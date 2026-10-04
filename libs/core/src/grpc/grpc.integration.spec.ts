import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createClient, Code, type Client } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { ExampleService } from '@libs/contracts/generated/example/v1/example_pb';
import { GrpcServerModule, GrpcServer } from './grpc.server';
import { GrpcClientModule, GrpcClientResource, getGrpcClientResourceToken } from './grpc.client';
import { Health, HealthCheckResponse_ServingStatus } from '@libs/contracts/grpc/health/v1/health_pb';
import { AppLogger } from '../logger/logger.service';
import { AppLoggerModule } from '../logger/logger.module';
import { Injectable } from '@nestjs/common';
import { RpcService } from './grpc.decorator';
import { createServer } from 'node:net';

@Injectable()
@RpcService(ExampleService)
class DuplicateExampleRpcHandler {
  echo = (request: { text: string }) => ({ text: request.text });
}

@Injectable()
@RpcService(ExampleService, { environments: ['development', 'test'] })
class ExampleRpcHandler {
  echo = (request: { text: string }) => ({ text: request.text });
}

describe('internal gRPC foundation', () => {
  it('identifies the target when a gRPC service is unreachable', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a TCP test address');
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));

    const client = new GrpcClientResource({
      endpoint: `http://127.0.0.1:${address.port}`,
      target: 'AI',
      deadlineMs: 200,
    });
    try {
      await expect(client.clientFor(Health).check({ service: '' })).rejects.toMatchObject({
        code: Code.Unavailable,
        rawMessage: 'Cannot connect to gRPC AI',
      });
    } finally {
      client.onApplicationShutdown();
    }
  });

  it('does not expose environment-restricted handlers outside their configured environments', async () => {
    const module = await Test.createTestingModule({
      imports: [GrpcServerModule.register('test')],
      providers: [ExampleRpcHandler],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) =>
          key === 'environment'
            ? 'staging'
            : key === 'grpc.test'
              ? { enabled: true, host: '127.0.0.1', port: 0, plaintext: true }
              : undefined,
      })
      .compile();
    await module.init();
    try {
      const health = createClient(Health, createGrpcTransport({ baseUrl: module.get(GrpcServer).address() }));
      await expect(health.check({ service: ExampleService.typeName })).rejects.toMatchObject({ code: Code.NotFound });

      const client = new GrpcClientResource({ endpoint: module.get(GrpcServer).address() });
      try {
        await expect(client.clientFor(ExampleService).echo({ text: 'not-registered' })).rejects.toMatchObject({
          code: Code.Unimplemented,
          rawMessage: `RPC path is not registered: /${ExampleService.typeName}/Echo`,
        });
      } finally {
        client.onApplicationShutdown();
      }
    } finally {
      await module.close();
    }
  });

  it('rejects duplicate service descriptors during listener startup', async () => {
    const module = await Test.createTestingModule({
      imports: [GrpcServerModule.register('test')],
      providers: [ExampleRpcHandler, DuplicateExampleRpcHandler],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) =>
          key === 'environment'
            ? 'test'
            : key === 'grpc.test'
              ? { enabled: true, host: '127.0.0.1', port: 0, plaintext: true }
              : undefined,
      })
      .compile();
    await expect(module.init()).rejects.toThrow(`Duplicate gRPC service: ${ExampleService.typeName}`);
  });

  it('serves typed unary RPC clients through Nest over HTTP/2', async () => {
    const log = jest.fn();
    const module = await Test.createTestingModule({
      imports: [AppLoggerModule.register({ appName: 'test' }), GrpcServerModule.register('test')],
      providers: [ExampleRpcHandler],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) =>
          key === 'environment'
            ? 'development'
            : key === 'grpc.test'
              ? { enabled: true, host: '127.0.0.1', port: 0, plaintext: true }
              : undefined,
      })
      .overrideProvider(AppLogger)
      .useValue({ log })
      .compile();
    await module.init();

    try {
      const address = module.get(GrpcServer).address();
      const client = createClient(ExampleService, createGrpcTransport({ baseUrl: address }));
      await expect(client.echo({ text: 'hello' }, { headers: { 'x-request-id': 'trace-123' } })).resolves.toMatchObject(
        { text: 'hello' },
      );
      expect(log).toHaveBeenCalledWith('gRPC request completed', {
        req: {
          requestId: 'trace-123',
          method: 'POST',
          url: `/${ExampleService.typeName}/Echo`,
          req: { text: 'hello' },
        },
        res: { grpcStatusCode: 0, data: { text: 'hello' } },
        responseTime: expect.any(Number),
        rpc: { service: ExampleService.typeName, method: 'Echo' },
      });
      expect(log.mock.calls.filter(([message]) => message === 'gRPC request completed')).toHaveLength(1);

      const health = createClient(Health, createGrpcTransport({ baseUrl: address }));
      await expect(health.check({ service: ExampleService.typeName })).resolves.toMatchObject({
        status: HealthCheckResponse_ServingStatus.SERVING,
      });
      await expect(health.check({ service: 'missing.Service' })).rejects.toMatchObject({ code: Code.NotFound });

      const consumer = await Test.createTestingModule({ imports: [GrpcClientModule.register('ai')] })
        .overrideProvider(ConfigService)
        .useValue({
          get: (key: string) => (key === 'environment' ? 'test' : undefined),
          getOrThrow: (key: string) => {
            if (key === 'grpc.ai') return { endpoint: address, plaintext: true, maxMessageBytes: 4 * 1024 * 1024 };
            throw new Error(`Missing test config: ${key}`);
          },
        })
        .compile();
      await consumer.init();
      try {
        const resource = consumer.get<GrpcClientResource>(getGrpcClientResourceToken('ai'));
        const exampleClient: Client<typeof ExampleService> = resource.clientFor(ExampleService);
        const healthClient: Client<typeof Health> = resource.clientFor(Health);
        await expect(exampleClient.echo({ text: 'from-api' })).resolves.toMatchObject({ text: 'from-api' });
        await expect(healthClient.check({ service: ExampleService.typeName })).resolves.toMatchObject({
          status: HealthCheckResponse_ServingStatus.SERVING,
        });
      } finally {
        await consumer.close();
      }

      const namedClient = new GrpcClientResource({
        endpoint: address,
      });
      const namedExample = namedClient.clientFor(ExampleService);
      await expect(namedExample.echo({ text: 'named' })).resolves.toMatchObject({ text: 'named' });
      namedClient.onApplicationShutdown();
      await expect(namedExample.echo({ text: 'closed' })).rejects.toMatchObject({ code: Code.Unavailable });
    } finally {
      await module.close();
    }
  });
});
