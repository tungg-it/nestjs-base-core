import { Module } from '@nestjs/common';
import { DefaultRouteController, GrpcClientModule, GrpcServerModule, commonModules } from '@libs/core';

import { ExampleModule } from './modules/example/example.module';
@Module({
  imports: [
    ...commonModules({ appName: 'api' }),
    GrpcServerModule.register('api'),
    GrpcClientModule.register('api'),
    ExampleModule,
  ],
  controllers: [DefaultRouteController],
  providers: [],
})
export class AppModule {}
