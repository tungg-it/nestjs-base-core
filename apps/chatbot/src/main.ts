import { AppModule } from '@apps/chatbot/app.module';
import { startApp } from '@libs/core';

startApp(AppModule, {
  appName: 'chatbot',
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
