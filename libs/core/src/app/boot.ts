import { Type, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyMultipart from '@fastify/multipart';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { TimeoutInterceptor } from './timeout';
import { HttpExceptionFilter } from '@libs/core/exception';
import { ResponseInterceptor } from './response';
import { convertToCamelCase } from '@libs/util';
import { createValidationPipe } from '../validation/pipes/create-validation-pipe';
import { Logger as NestPinoLogger } from 'nestjs-pino';
import { RequestIdMiddleware } from '../middleware/request-id.middleware';
import { AppLogger } from '../logger/logger.service';
import { wrapLoggerSkipNestFramework } from '../logger/nest-quiet-logger';

export interface AppOptions {
  appName: string;
  exposePort?: boolean;
  enableMultipart?: boolean;
}

export const startApp = async (AppModule: Type<unknown>, options: AppOptions) => {
  const { appName, exposePort = true, enableMultipart } = options;
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      keepAliveTimeout: 72000, // 72 seconds
      connectionTimeout: 120000, // 120 seconds
      bodyLimit: 5 * 1024 * 1024, // 5MB
    }),
    {
      bufferLogs: true,
      logger: false,
    },
  );

  const config = app.get(ConfigService);
  const port = config.get<number>(convertToCamelCase(appName) + 'Port');
  const environment = config.get<string>('environment');
  const apiDocument = config.get<string>('apiDocument');
  const prefix = `${appName === 'api' ? appName : appName + '/api'}`;

  app.use(RequestIdMiddleware());
  app.useLogger(wrapLoggerSkipNestFramework(app.get(NestPinoLogger)));

  const logger = app.get(AppLogger);
  logger.setContext(AppModule.name);

  if (exposePort) {
    app.setGlobalPrefix(prefix);
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
      exposedHeaders: ['Content-Disposition'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    app.useGlobalPipes(createValidationPipe());

    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalInterceptors(new TimeoutInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter(app.get(HttpAdapterHost), config));

    if (environment !== 'production') {
      const docOptions = {
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          docExpansion: 'none',
          filter: true,
          showRequestHeaders: true,
        },
      };

      const swaggerConfig = new DocumentBuilder()
        .setTitle('API example')
        .setDescription('API for development.')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, swaggerConfig);
      SwaggerModule.setup(`${appName}/${apiDocument}`, app, document, docOptions);
    }

    if (enableMultipart) {
      const maxUploadBytes = config.get<number>('storage.maxUploadBytes');
      await app.register(fastifyMultipart, {
        limits: { fileSize: maxUploadBytes },
        throwFileSizeLimit: false,
      });
      logger.log(`Multipart enabled for ${appName} (max file size ${maxUploadBytes} bytes)`);
    }

    app.enableShutdownHooks();

    await app.listen(port, '0.0.0.0');

    logger.log(`Service ${appName} HTTP is running on http://localhost:${port}/${prefix}`);

    if (environment !== 'production')
      logger.log(`API Document service ${appName}: http://localhost:${port}/${appName}/${apiDocument}`);
  } else {
    await app.init();
    logger.log(`Service ${appName} started successfully`);
  }
};
