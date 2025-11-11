import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { I18nContext } from 'nestjs-i18n';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly config?: ConfigService) {}
  private logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const i18n = I18nContext.current(host);
    const environment = this.config?.get<string>('environment');

    if (environment === 'development') {
      this.logger.error(exception?.stack || exception?.message || exception);
    }

    // get response object from exception
    const res = exception.getResponse() as
      | string
      | {
          message?: string | string[];
          cause?: string;
          data?: unknown;
        };
    // check status
    const status =
      // eslint-disable-next-line
      typeof (exception as HttpException).getStatus === 'function'
        ? exception.getStatus()
        : 400;

    const cause =
      (typeof res === 'object' && 'cause' in res ? res.cause : null) ?? null;

    if (status >= 500) {
      const messageKeyByStatus: Record<number, string> = {
        500: 'server_error',
        502: 'bad_gateway',
        503: 'service_unavailable',
        504: 'gateway_timeout',
      };

      const messageKey = messageKeyByStatus[status] || 'server_error';
      return response.status(status).json({
        statusCode: status,
        message: messageKey,
        data: null,
        cause,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // get message key from response
    let messageKey: string | undefined;

    if (typeof res === 'string') {
      messageKey = res.toLowerCase();
    } else if (typeof res?.message === 'string') {
      messageKey = res.message.toLowerCase();
    }

    if (!messageKey) {
      const messageKeyByStatus: Record<number, string> = {
        400: 'bad_request',
        401: 'unauthorized',
        403: 'forbidden',
        404: 'not_found',
        405: 'not_allowed',
        408: 'request_timeout',
        409: 'conflict',
        422: 'unprocessable_entity',
        428: 'precondition_required',
        429: 'too_many_requests',
      };
      messageKey = messageKeyByStatus[status] || 'bad_request';
    }

    if (status === 404 && messageKey.startsWith('cannot ')) {
      messageKey = 'not_found';
    }

    // Get original message from exception
    const originalMessage =
      typeof res === 'string'
        ? res
        : typeof res === 'object' && res?.message
          ? Array.isArray(res.message)
            ? res.message[0]
            : res.message
          : exception.message;

    // Try to translate, if no i18n key then use original message
    const i18nKey = `message.errors.${messageKey}`;
    const translated = i18n?.t(i18nKey);
    const translatedMessage =
      translated && translated !== i18nKey ? translated : originalMessage;

    return response.status(status).json({
      code: status,
      message: translatedMessage,
      data: typeof res === 'object' ? (res?.data ?? null) : null,
      cause,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
