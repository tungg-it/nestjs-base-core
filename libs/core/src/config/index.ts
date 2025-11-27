import { AppConfig } from './type';

export default (): AppConfig => ({
  environment: process.env?.NODE_ENV ?? 'development',
  apiDocument: process.env?.API_DOCUMENT ?? 'doc',
  chatbotPort: Number(process.env?.CHATBOT_PORT ?? 8080),
});
