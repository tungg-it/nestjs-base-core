import { AppConfig } from './type';

export default (): AppConfig => ({
  environment: process.env?.NODE_ENV ?? 'development',
  apiDocument: process.env?.API_DOCUMENT ?? 'doc',
  apiPort: Number(process.env?.PORT ?? 8080),
});
