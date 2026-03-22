import { Module } from '@nestjs/common';
import { DefaultRouteController, commonModules } from '@libs/core';

@Module({
  imports: [...commonModules({ appName: 'api' })],
  controllers: [DefaultRouteController],
  providers: [],
})
export class AppModule {}
