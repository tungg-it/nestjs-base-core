import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';
import { I18nContext } from 'nestjs-i18n';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const i18n = I18nContext.current(host);
    // eslint-disable-next-line
    const res: any = exception.getResponse();
    const status = res?.status || res?.statusCode || 400;

    if (status >= 500) {
      const messageKey = 'server_error';
      const translatedMessage =
        i18n?.t(`message.errors.${messageKey}`) ?? messageKey;
      return response.status(status).json({
        statusCode: HttpStatusCode.InternalServerError,
        message: translatedMessage,
        data: null,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    let messageKey =
      typeof res?.message === 'string'
        ? String(res.message).toLowerCase()
        : 'bad_request';

    // Map Nest's default 404 messages like "Cannot GET /path" to not_found
    if (status === 404 && messageKey.startsWith('cannot ')) {
      messageKey = 'not_found';
    }

    const translatedMessage =
      i18n?.t(`message.errors.${messageKey}`) ?? res?.message ?? messageKey;
    return response.status(status).json({
      statusCode: status,
      message: translatedMessage,
      data: res.data || null,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
