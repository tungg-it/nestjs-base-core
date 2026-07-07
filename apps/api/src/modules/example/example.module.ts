import { Module } from '@nestjs/common';
import { ExampleController } from './api/example.controller';

import { features } from './features';
@Module({
  imports: [],
  controllers: [ExampleController],
  providers: [...features],
})
export class ExampleModule {}
