import { AppConfig } from './type';

export default (): AppConfig => ({
  environment: process.env?.NODE_ENV ?? 'development',
  devMode: process.env?.DEV_MODE === 'true',
  apiDocument: process.env?.API_DOCUMENT ?? 'doc',
  apiPort: Number(process.env?.API_PORT ?? 8080),
});
