import { AppConfig } from './type';

export default (): AppConfig => ({
  environment: process.env?.NODE_ENV ?? 'development',
  apiDocument: process.env?.API_DOCUMENT ?? 'document',
  port: Number(process.env?.PORT ?? 8080),
  host: process.env?.HOST ?? '0.0.0.0',
  prefix: process.env?.PREFIX ?? 'api',
});
