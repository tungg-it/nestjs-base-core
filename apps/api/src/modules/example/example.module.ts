import { Module } from '@nestjs/common';
import { ExampleController } from './api/example.controller';

import { features } from './features';
import { ExampleRpcHandler } from './rpc/example.rpc-handler';
import { Example2RpcHandler } from './rpc/example2.rpc-handler';
@Module({
  imports: [],
  controllers: [ExampleController],
  providers: [...features, ExampleRpcHandler, Example2RpcHandler],
})
export class ExampleModule {}
