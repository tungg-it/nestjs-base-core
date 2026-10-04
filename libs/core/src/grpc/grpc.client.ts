import { DynamicModule, Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { type DescService } from '@bufbuild/protobuf';
import { Code, ConnectError, createClient, type Client, type Transport } from '@connectrpc/connect';
import { createGrpcTransport, Http2SessionManager } from '@connectrpc/connect-node';
import { readFileSync } from 'node:fs';
import { propagation, context } from '@opentelemetry/api';
import { DEFAULT_GRPC_MESSAGE_BYTES } from './grpc.server';
import type { GrpcAppConfig } from '../config/type';

export const getGrpcClientResourceToken = (app: string): string => `GRPC_CLIENT_RESOURCE:${app}`;

export const InjectGrpcClient = (app: string): ParameterDecorator => Inject(getGrpcClientResourceToken(app));

export interface GrpcClientOptions {
  endpoint: string;
  target?: string;
  deadlineMs?: number;
  maxMessageBytes?: number;
  tls?: { caPath?: string; certPath?: string; keyPath?: string };
  authorizationMethods?: string[];
  idempotentMethods?: string[];
  retry?: { maxAttempts: number; initialDelayMs: number };
}

const metadataAllowlist = new Set(['x-request-id', 'traceparent', 'tracestate', 'accept-language', 'idempotency-key']);

export class GrpcClientResource implements OnApplicationShutdown {
  private readonly sessionManager: Http2SessionManager;
  private readonly transport: Transport;
  private closed = false;

  constructor(
    private readonly options: GrpcClientOptions,
    environment?: string,
  ) {
    this.validate(environment);
    const tls = options.tls;
    this.sessionManager = new Http2SessionManager(options.endpoint, undefined, {
      ca: tls?.caPath ? readFileSync(tls.caPath) : undefined,
      cert: tls?.certPath ? readFileSync(tls.certPath) : undefined,
      key: tls?.keyPath ? readFileSync(tls.keyPath) : undefined,
    });
    const wireTransport = createGrpcTransport({
      baseUrl: options.endpoint,
      sessionManager: this.sessionManager,
      readMaxBytes: options.maxMessageBytes ?? DEFAULT_GRPC_MESSAGE_BYTES,
      writeMaxBytes: options.maxMessageBytes ?? DEFAULT_GRPC_MESSAGE_BYTES,
      acceptCompression: [],
    });
    const deadlineMs = options.deadlineMs ?? 5_000;
    const transport: Transport = {
      unary: async (method, signal, timeoutMs, header, input, contextValues) => {
        const effectiveTimeout = timeoutMs && timeoutMs > 0 ? timeoutMs : deadlineMs;
        const deadline = Date.now() + effectiveTimeout;
        const metadata = this.allowedHeaders(method.name, header);
        const attempts = options.idempotentMethods?.includes(method.name) ? (options.retry?.maxAttempts ?? 1) : 1;
        for (let attempt = 1; ; attempt++) {
          if (this.closed) throw new ConnectError('gRPC client is closed', Code.Unavailable);
          const remaining = deadline - Date.now();
          if (remaining <= 0) throw new ConnectError('RPC deadline exceeded', Code.DeadlineExceeded);
          try {
            return await wireTransport.unary(method, signal, remaining, metadata, input, contextValues);
          } catch (error) {
            const rpcError = ConnectError.from(error);
            if (rpcError.code === Code.Unimplemented && rpcError.rawMessage === 'HTTP 404') {
              throw new ConnectError(
                `RPC path is not registered: /${method.parent.typeName}/${method.name}`,
                Code.Unimplemented,
                rpcError.metadata,
                undefined,
                rpcError,
              );
            }
            if (
              attempt >= attempts ||
              rpcError.code !== Code.Unavailable ||
              signal?.aborted ||
              deadline - Date.now() <= 0
            ) {
              if (isGrpcConnectionError(rpcError)) {
                throw new ConnectError(
                  `Cannot connect to gRPC ${options.target ?? method.parent.typeName}`,
                  Code.Unavailable,
                  rpcError.metadata,
                  undefined,
                  rpcError,
                );
              }
              throw rpcError;
            }
            const delay = Math.min(
              Math.floor((options.retry?.initialDelayMs ?? 50) * 2 ** (attempt - 1) * (0.5 + Math.random())),
              Math.max(0, deadline - Date.now()),
            );
            await waitForRetry(delay, signal);
          }
        }
      },
      stream: (method, signal, timeoutMs, header, input, contextValues) => {
        if (this.closed) throw new ConnectError('gRPC client is closed', Code.Unavailable);
        const effectiveTimeout = timeoutMs && timeoutMs > 0 ? timeoutMs : deadlineMs;
        return wireTransport.stream(
          method,
          signal,
          effectiveTimeout,
          this.allowedHeaders(method.name, header),
          input,
          contextValues,
        );
      },
    };
    this.transport = transport;
  }

  clientFor<T extends DescService>(service: T): Client<T> {
    return createClient(service, this.transport);
  }

  onApplicationShutdown(): void {
    if (this.closed) return;
    this.closed = true;
    this.sessionManager.abort();
  }

  private allowedHeaders(method: string, original?: HeadersInit): Headers {
    // ADR 0014: explicit allowlist prevents accidental propagation of HTTP credentials or user fields.
    const source = new Headers(original);
    const allowed = new Headers();
    for (const [key, value] of source) {
      if (
        metadataAllowlist.has(key) ||
        (key === 'authorization' && this.options.authorizationMethods?.includes(method))
      ) {
        allowed.set(key, value);
      }
    }
    propagation.inject(context.active(), allowed, {
      set: (headers, key, value) => headers.set(key, value),
    });
    return allowed;
  }

  private validate(environment?: string): void {
    const { endpoint, deadlineMs, maxMessageBytes, retry, tls } = this.options;
    const url = new URL(endpoint);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('gRPC endpoint must use HTTP/2');
    if (environment === 'production' && url.protocol !== 'https:')
      throw new Error('Production gRPC client requires TLS');
    if (Boolean(tls?.certPath) !== Boolean(tls?.keyPath))
      throw new Error('gRPC client certificate and key must be paired');
    for (const value of [deadlineMs, maxMessageBytes, retry?.maxAttempts, retry?.initialDelayMs]) {
      if (value !== undefined && (!Number.isSafeInteger(value) || value <= 0))
        throw new Error('Invalid gRPC client limit');
    }
    if (retry && retry.maxAttempts > 3) throw new Error('gRPC retry attempts must not exceed three');
  }
}

const GRPC_CONNECTION_ERROR =
  /(ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|socket hang up|network socket|TLS|certificate)/i;

function isGrpcConnectionError(error: ConnectError): boolean {
  if (error.code === Code.Unavailable) return true;
  const cause =
    error.cause instanceof Error
      ? `${error.cause.message} ${error.cause.stack ?? ''}`
      : typeof error.cause === 'string'
        ? error.cause
        : '';
  return GRPC_CONNECTION_ERROR.test(`${error.rawMessage} ${cause}`);
}

function waitForRetry(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new ConnectError('RPC canceled', Code.Canceled));
    const timer = setTimeout(done, ms);
    function done() {
      signal?.removeEventListener('abort', canceled);
      resolve();
    }
    function canceled() {
      clearTimeout(timer);
      reject(new ConnectError('RPC canceled', Code.Canceled));
    }
    signal?.addEventListener('abort', canceled, { once: true });
  });
}

@Global()
@Module({})
export class GrpcClientModule {
  static register(app: string): DynamicModule {
    const resourceToken = getGrpcClientResourceToken(app);
    return {
      module: GrpcClientModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: resourceToken,
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const target = config.getOrThrow<GrpcAppConfig>(`grpc.${app}`);
            return new GrpcClientResource(
              {
                target: app.toUpperCase(),
                endpoint: target.endpoint,
                maxMessageBytes: target.maxMessageBytes,
                tls: target.plaintext ? undefined : { caPath: target.tls?.caPath },
              },
              config.get<string>('environment'),
            );
          },
        },
      ],
      exports: [resourceToken],
    };
  }
}
