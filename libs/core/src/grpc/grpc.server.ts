import {
  DynamicModule,
  Inject,
  Injectable,
  Module,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Optional,
  Scope,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';
import { connectNodeAdapter } from '@connectrpc/connect-node';
import { Code, ConnectError, type ConnectRouter, type ServiceImpl } from '@connectrpc/connect';
import { createValidateInterceptor } from '@connectrpc/validate';
import {
  createSecureServer,
  createServer,
  type Http2Server,
  type Http2SecureServer,
  type ServerHttp2Session,
} from 'node:http2';
import { readFileSync } from 'node:fs';
import { AppLogger } from '../logger/logger.service';
import { Health } from '@libs/contracts/grpc/health/v1/health_pb';
import { GrpcHealth } from './grpc.health';
import { createGrpcServerInterceptor } from './grpc.telemetry';
import { rpcServiceDecorator } from './grpc.decorator';

export const GRPC_SERVER_OPTIONS = Symbol('GRPC_SERVER_OPTIONS');
export const DEFAULT_GRPC_MESSAGE_BYTES = 4 * 1024 * 1024;

export interface GrpcServerConfig {
  enabled: boolean;
  host: string;
  port: number;
  plaintext: boolean;
  tls?: { certPath: string; keyPath: string; caPath?: string; requireClientCertificate?: boolean };
  maxMessageBytes?: number;
  maxTimeoutMs?: number;
  shutdownGraceMs?: number;
}

export interface GrpcServerRegistration {
  appName: string;
}

@Injectable()
export class GrpcServer implements OnApplicationBootstrap, OnApplicationShutdown {
  private server?: Http2Server | Http2SecureServer;
  private readonly sessions = new Set<ServerHttp2Session>();
  private stopping = false;
  private closePromise?: Promise<void>;

  constructor(
    @Inject(GRPC_SERVER_OPTIONS) private readonly registration: GrpcServerRegistration,
    private readonly config: ConfigService,
    private readonly discovery: DiscoveryService,
    private readonly health: GrpcHealth,
    @Optional() private readonly logger?: AppLogger,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const options = this.config.get<GrpcServerConfig>(`grpc.${this.registration.appName}`);
    if (!options?.enabled) return;
    this.validateConfig(options);
    const environment = this.config.get<string>('environment');

    // ADR 0014: Nest owns DI/lifecycle; Connect owns only the gRPC transport.
    const handler = connectNodeAdapter({
      grpc: true,
      grpcWeb: false,
      connect: false,
      readMaxBytes: options.maxMessageBytes ?? DEFAULT_GRPC_MESSAGE_BYTES,
      writeMaxBytes: options.maxMessageBytes ?? DEFAULT_GRPC_MESSAGE_BYTES,
      maxTimeoutMs: options.maxTimeoutMs ?? 10_000,
      requestGate: () => {
        if (this.stopping) throw new ConnectError('gRPC server shutting down', Code.Unavailable);
      },
      interceptors: [
        createGrpcServerInterceptor(this.logger, {
          includeRequestBody: environment === 'development',
          includeResponseBody: environment === 'development',
        }),
        createValidateInterceptor(),
      ],
      routes: (router) => {
        this.registerRpcServices(router);
        const services = [...new Set(router.handlers.map((route) => route.service.typeName))];
        router.service(Health, this.health);
        this.health.setServices(services);
      },
    });

    const requestHandler = (request: Parameters<typeof handler>[0], response: Parameters<typeof handler>[1]) => {
      // ADR 0014: even callers omitting grpc-timeout receive a bounded server deadline.
      request.headers['grpc-timeout'] ??= `${options.maxTimeoutMs ?? 10_000}m`;
      void handler(request, response);
    };
    this.server = options.plaintext
      ? createServer(requestHandler)
      : createSecureServer(
          {
            cert: readFileSync(options.tls.certPath),
            key: readFileSync(options.tls.keyPath),
            ca: options.tls.caPath ? readFileSync(options.tls.caPath) : undefined,
            requestCert: options.tls.requireClientCertificate ?? false,
            rejectUnauthorized: options.tls.requireClientCertificate ?? false,
            allowHTTP1: false,
          },
          requestHandler,
        );
    this.server.on('session', (session) => {
      this.sessions.add(session);
      session.once('close', () => this.sessions.delete(session));
    });
    try {
      await new Promise<void>((resolve, reject) => {
        this.server.once('error', reject);
        this.server.listen(options.port, options.host, () => {
          this.server.off('error', reject);
          resolve();
        });
      });
    } catch (error) {
      this.server.close();
      this.server = undefined;
      throw error;
    }
    this.logger?.log('gRPC listener started', { app: this.registration.appName, address: this.address() });
  }

  address(): string {
    const address = this.server?.address();
    if (!address || typeof address === 'string') throw new Error('gRPC listener is not running');
    const options = this.config.get<GrpcServerConfig>(`grpc.${this.registration.appName}`);
    const host = address.address === '0.0.0.0' || address.address === '::' ? '127.0.0.1' : address.address;
    return `${options.plaintext ? 'http' : 'https'}://${host}:${address.port}`;
  }

  async onApplicationShutdown(): Promise<void> {
    if (!this.server) return;
    if (this.closePromise !== undefined) return this.closePromise;
    this.stopping = true;
    this.health.shutdown();
    const server = this.server;
    const graceMs = this.config.get<GrpcServerConfig>(`grpc.${this.registration.appName}`)?.shutdownGraceMs ?? 10_000;
    this.closePromise = new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        for (const session of this.sessions)
          session.destroy(new ConnectError('server shutting down', Code.Unavailable));
      }, graceMs);
      timer.unref();
      server.close(() => {
        clearTimeout(timer);
        this.server = undefined;
        resolve();
      });
      for (const session of this.sessions) session.close();
    });
    return this.closePromise;
  }

  private registerRpcServices(router: ConnectRouter): void {
    const environment = this.config.get<string>('environment');
    const registered = new Set<string>();
    for (const provider of this.discovery.getProviders({ metadataKey: rpcServiceDecorator.KEY })) {
      const metadata = this.discovery.getMetadataByDecorator(rpcServiceDecorator, provider);
      if (!metadata || (metadata.environments && !metadata.environments.includes(environment))) continue;
      const { service } = metadata;
      if (registered.has(service.typeName)) throw new Error(`Duplicate gRPC service: ${service.typeName}`);
      if (provider.scope !== undefined && provider.scope !== Scope.DEFAULT) {
        throw new Error(`gRPC handler must be singleton: ${service.typeName}`);
      }
      if (!provider.instance) throw new Error(`gRPC handler is not available: ${service.typeName}`);
      const implementation = provider.instance as Record<string, unknown>;
      for (const method of service.methods) {
        if (typeof implementation[method.localName] !== 'function') {
          throw new Error(`Missing gRPC handler: ${service.typeName}/${method.name}`);
        }
      }
      router.service(service, provider.instance as ServiceImpl<typeof service>);
      registered.add(service.typeName);
    }
  }

  private validateConfig(options: GrpcServerConfig): void {
    const environment = this.config.get<string>('environment');
    if (!options.host || !Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
      throw new Error('Invalid gRPC host or port');
    }
    if (options.plaintext && environment === 'production') throw new Error('Production gRPC requires TLS');
    if (options.port === 0 && environment === 'production') throw new Error('Production gRPC requires a fixed port');
    if (!options.plaintext && (!options.tls?.certPath || !options.tls?.keyPath)) {
      throw new Error('gRPC TLS certificate and key are required');
    }
    for (const value of [options.maxMessageBytes, options.maxTimeoutMs, options.shutdownGraceMs]) {
      if (value !== undefined && (!Number.isSafeInteger(value) || value <= 0)) throw new Error('Invalid gRPC limit');
    }
  }
}

@Module({})
export class GrpcServerModule {
  static register(appName: string): DynamicModule {
    return {
      module: GrpcServerModule,
      imports: [ConfigModule, DiscoveryModule],
      providers: [
        { provide: GRPC_SERVER_OPTIONS, useValue: { appName } satisfies GrpcServerRegistration },
        GrpcHealth,
        GrpcServer,
      ],
      exports: [GrpcServer, GrpcHealth],
    };
  }
}
