import 'source-map-support/register';
import { Logger, Type, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { TimeoutInterceptor } from './timeout';
import morganMiddleware from '../middleware/morgan.middleware';
import { HttpExceptionFilter } from '@libs/core/exception';
import { I18nValidationPipe } from 'nestjs-i18n';
import { ResponseInterceptor } from './response';

export interface AppOptions {
  appName: string;
  exposePort?: boolean;
}
export const startApp = async (
  AppModule: Type<unknown>,
  options: AppOptions,
) => {
  const { appName, exposePort = true } = options;
  const logger = new Logger(appName);

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>(appName.toLowerCase() + 'Port');
  const environment = config.get<string>('environment');
  const apiDocument = config.get<string>('apiDocument');
  const prefix = `${appName === 'api' ? appName : appName + '/api'}/v1`;

  if (exposePort) {
    app.setGlobalPrefix(prefix);
    app.enableCors();
    app.enableVersioning();

    app.useGlobalPipes(new I18nValidationPipe());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        stopAtFirstError: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalInterceptors(new TimeoutInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter(config));

    // Config for development
    if (environment === 'development') {
      // Morgan config
      app.use(morganMiddleware);

      // Swagger config
      const docOptions = {
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          docExpansion: 'none',
          filter: true,
          showRequestHeaders: true,
        },
      };

      const config = new DocumentBuilder()
        .setTitle('API example')
        .setDescription('API for development.')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup(
        `${prefix}/${apiDocument}`,
        app,
        document,
        docOptions,
      );
    }

    await app.listen(port, '0.0.0.0');

    logger.log(
      `Service ${appName} HTTP is running on http://localhost:${port}/${prefix}`,
    );
    logger.log(`Environment: ${environment}`);
  } else {
    await app.init();
    logger.log(`Service ${appName} started successfully`);
    logger.log(`Environment: ${environment}`);
  }
};
