import { Injectable } from '@nestjs/common';
import type { ServiceImpl } from '@connectrpc/connect';
import { RpcService } from '@libs/core/grpc';
import { GrpcServerEchoExampleService } from '../features/grpc-server-echo-example/grpc-server-echo-example.service';
import { ExampleService2 } from '@libs/contracts/generated/example2/v1/example_pb';

@Injectable()
@RpcService(ExampleService2, { environments: ['development'] })
export class Example2RpcHandler implements ServiceImpl<typeof ExampleService2> {
  constructor(private readonly echoExample: GrpcServerEchoExampleService) {}

  echo: ServiceImpl<typeof ExampleService2>['echo'] = (request) => ({ text: this.echoExample.echo(request.text) });
}
