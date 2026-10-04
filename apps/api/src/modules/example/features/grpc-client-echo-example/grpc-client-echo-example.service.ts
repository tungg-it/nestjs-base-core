import { Injectable } from '@nestjs/common';
import type { Client } from '@connectrpc/connect';
import { GrpcClientResource, InjectGrpcClient } from '@libs/core/grpc';
import { ExampleService } from '@libs/contracts/generated/example/v1/example_pb';
import { ExampleService2 } from '@libs/contracts/generated/example2/v1/example_pb';

@Injectable()
export class GrpcClientEchoExampleService {
  private readonly apiClient: Client<typeof ExampleService>;
  private readonly apiClient2: Client<typeof ExampleService2>;

  constructor(@InjectGrpcClient('api') grpc: GrpcClientResource) {
    this.apiClient = grpc.clientFor(ExampleService);
    this.apiClient2 = grpc.clientFor(ExampleService2);
  }

  async echo(text: string, requestId?: string): Promise<string> {
    const response = await this.apiClient.echo(
      { text },
      requestId ? { headers: { 'x-request-id': requestId } } : undefined,
    );
    return response.text;
  }

  async echo2(text: string, requestId?: string): Promise<string> {
    const response = await this.apiClient2.echo(
      { text },
      requestId ? { headers: { 'x-request-id': requestId } } : undefined,
    );
    return response.text;
  }
}
