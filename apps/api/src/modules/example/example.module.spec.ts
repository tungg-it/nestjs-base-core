import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { ExampleService2 } from '@libs/contracts/generated/example2/v1/example_pb';
import { GrpcServer, GrpcServerModule } from '@libs/core/grpc';
import { ExampleModule } from './example.module';
import { GrpcClientEchoExampleService } from './features/grpc-client-echo-example/grpc-client-echo-example.service';
import { ExampleRpcHandler } from './rpc/example.rpc-handler';
import { Example2RpcHandler } from './rpc/example2.rpc-handler';

describe('ExampleModule', () => {
  afterEach(() => jest.restoreAllMocks());

  it('registers both example RPC handlers as Nest providers', async () => {
    const module = await Test.createTestingModule({ imports: [ExampleModule] })
      .overrideProvider(GrpcClientEchoExampleService)
      .useValue({})
      .compile();

    expect(module.get(ExampleRpcHandler)).toBeInstanceOf(ExampleRpcHandler);
    expect(module.get(Example2RpcHandler)).toBeInstanceOf(Example2RpcHandler);
  });

  it('registers the ExampleService2 route with the gRPC server', async () => {
    const module = await Test.createTestingModule({
      imports: [GrpcServerModule.register('test'), ExampleModule],
    })
      .overrideProvider(GrpcClientEchoExampleService)
      .useValue({})
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) =>
          key === 'environment'
            ? 'development'
            : key === 'grpc.test'
              ? { enabled: true, host: '127.0.0.1', port: 0, plaintext: true }
              : undefined,
      })
      .compile();
    await module.init();

    try {
      const client = createClient(ExampleService2, createGrpcTransport({ baseUrl: module.get(GrpcServer).address() }));
      await expect(client.echo({ text: 'registered' })).resolves.toMatchObject({ text: 'registered' });
    } finally {
      await module.close();
    }
  });
});
