import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import MorganMiddleware from '@common/middlewares/morgan.middleware';

async function bootstrap() {
  const logger = new Logger(bootstrap.name);
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>('port');
  const host = config.get<string>('host');
  const prefix = config.get<string>('prefix');
  const environment = config.get<string>('environment');
  const apiDocument = config.get<string>('apiDocument');

  app.enableCors({
    exposedHeaders: ['Content-Type'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.setGlobalPrefix(prefix);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // HttpExceptionFilter config
  // app.useGlobalFilters(new HttpExceptionFilter());

  // Config for development
  if (environment === 'development') {
    // Morgan config
    app.use(MorganMiddleware);

    // Swagger config
    const config = new DocumentBuilder()
      .setTitle('API example')
      .setDescription('API for development.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(apiDocument, app, document);
  }

  await app.listen(port, host);
  logger.log(`Application is running on: ${await app.getUrl()}/${prefix}`);
}

bootstrap();
