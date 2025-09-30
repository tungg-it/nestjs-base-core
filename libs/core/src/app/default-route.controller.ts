import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiExcludeController()
@Controller()
export class DefaultRouteController {
  @Get('health-check')
  async getHello(@I18n() i18n: I18nContext): Promise<string> {
    return await i18n.t('message.hello');
  }
}
