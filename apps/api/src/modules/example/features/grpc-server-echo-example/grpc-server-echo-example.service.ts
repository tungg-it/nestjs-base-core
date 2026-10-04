import { Injectable } from '@nestjs/common';

@Injectable()
export class GrpcServerEchoExampleService {
  echo(text: string): string {
    return text;
  }
}
