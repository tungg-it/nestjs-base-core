import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import {
  AcceptLanguageResolver,
  I18nModule,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';

import config from '@config/configApp';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [config], isGlobal: true }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
