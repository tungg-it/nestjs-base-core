import { DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { createPinoConfig } from './logger.factory';
import { AppLogger } from './logger.service';
import { ConfigService, ConfigModule } from '@nestjs/config';

export interface AppLoggerModuleOptions {
  appName: string;
}

@Module({})
export class AppLoggerModule {
  static register(options: AppLoggerModuleOptions): DynamicModule {
    const { appName } = options;

    return {
      module: AppLoggerModule,
      global: true,
      imports: [
        LoggerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const devMode = config.get<boolean>('devMode');
            const environment = config.get<string>('environment');
            return createPinoConfig({
              appName,
              devMode,
              environment,
            });
          },
        }),
      ],
      providers: [AppLogger],
      exports: [AppLogger],
    };
  }
}
