import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import config from '../config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { resolve } from 'path';
import { existsSync } from 'fs';

export const commonModules = [
  ConfigModule.forRoot({ load: [config], isGlobal: true }),
  HttpModule.register({
    timeout: 5000,
    maxRedirects: 5,
  }),
  I18nModule.forRoot({
    fallbackLanguage: 'en',
    loaderOptions: {
      // Prefer shared i18n in libs/core/src/i18n (works in dev and dist)
      path: (() => {
        const distShared = resolve(__dirname, '../i18n/');
        if (existsSync(distShared)) return distShared;
        const srcShared = resolve(process.cwd(), 'libs/core/src/i18n/');
        return srcShared;
      })(),
      watch: true,
    },
    resolvers: [
      { use: QueryResolver, options: ['lang'] },
      AcceptLanguageResolver,
      new HeaderResolver(['x-lang']),
    ],
  }),
];
