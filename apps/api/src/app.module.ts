import { Module } from '@nestjs/common';
import { DefaultRouteController, commonModules } from '@libs/core';

import { ExampleModule } from './modules/example/example.module';
@Module({
  imports: [...commonModules({ appName: 'api' }), ExampleModule],
  controllers: [DefaultRouteController],
  providers: [],
})
export class AppModule {}
