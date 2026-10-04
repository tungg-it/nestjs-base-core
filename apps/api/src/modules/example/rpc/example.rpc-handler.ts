import { Injectable } from '@nestjs/common';
import type { ServiceImpl } from '@connectrpc/connect';
import { RpcService } from '@libs/core/grpc';
import { ExampleService } from '@libs/contracts/generated/example/v1/example_pb';
import { GrpcServerEchoExampleService } from '../features/grpc-server-echo-example/grpc-server-echo-example.service';

@Injectable()
@RpcService(ExampleService, { environments: ['development'] })
export class ExampleRpcHandler implements ServiceImpl<typeof ExampleService> {
  constructor(private readonly echoExample: GrpcServerEchoExampleService) {}

  echo: ServiceImpl<typeof ExampleService>['echo'] = (request) => ({ text: this.echoExample.echo(request.text) });
}
