import { Module } from '@nestjs/common';
import { DefaultRouteController, commonModules } from '@libs/core';

@Module({
  imports: [...commonModules],
  controllers: [DefaultRouteController],
  providers: [],
})
export class AppModule {}
