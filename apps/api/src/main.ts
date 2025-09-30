import { AppModule } from '@apps/api/app.module';
import { startApp } from '@libs/core';

startApp(AppModule, {
  appName: 'api',
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
