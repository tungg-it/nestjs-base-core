import { AppConfig } from './type';

export default (): AppConfig => ({
  environment: process.env?.NODE_ENV ?? 'development',
  devMode: process.env?.DEV_MODE === 'true',
  apiDocument: process.env?.API_DOCUMENT ?? 'doc',
  apiPort: Number(process.env?.API_PORT ?? 8080),
  isApi: process.env?.IS_API === 'true',
  isConsumer: process.env?.IS_CONSUMER === 'true',
  isCron: process.env?.IS_CRON === 'true',
});
