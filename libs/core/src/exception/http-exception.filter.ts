import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { AppError } from '@libs/util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly serverErrorMessageKeyByStatus: Record<number, string> = {
    500: 'server_error',
    502: 'bad_gateway',
    503: 'service_unavailable',
    504: 'gateway_timeout',
  };

  private readonly serverErrorStatusCodeByStatus: Record<number, string> = {
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
  };

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly config?: ConfigService,
  ) {}
  private logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<object>();
    const request = ctx.getRequest<object>();
    const i18n = I18nContext.current(host);
    const environment = this.config?.get<string>('environment');

    if (!(exception instanceof HttpException)) {
      this.logServerError(
        500,
        exception instanceof Error ? exception.message : 'Internal server error',
        exception,
        request,
      );

      httpAdapter.reply(response, this.buildServerErrorBody(500, request, i18n), 500);
      return;
    }

    if (environment === 'development') {
      this.logger.error(exception?.stack || exception?.message || exception);
    }

    const status = exception.getStatus();

    if (exception instanceof AppError) {
      const res = exception.getResponse() as {
        message?: string;
        data?: unknown;
      };

      if (status >= 500) {
        this.logServerError(status, exception.message, exception.originalCause ?? exception, request);

        httpAdapter.reply(response, this.buildServerErrorBody(status, request, i18n, exception.statusCode), status);
        return;
      }

      httpAdapter.reply(
        response,
        {
          code: status,
          statusCode: exception.statusCode,
          message: this.resolveAppErrorMessage(exception, res.message, i18n),
          data: res.data ?? null,
          cause: this.shapeCause(exception.originalCause, environment),
          timestamp: new Date().toISOString(),
          path: httpAdapter.getRequestUrl(request) as string,
        },
        status,
      );
      return;
    }

    const res = exception.getResponse() as
      | string
      | {
          message?: string | string[];
          cause?: string;
          data?: unknown;
        };

    const cause = (typeof res === 'object' && 'cause' in res ? res.cause : null) ?? null;

    if (status >= 500) {
      this.logServerError(status, exception.message, cause ?? exception, request);

      httpAdapter.reply(response, this.buildServerErrorBody(status, request, i18n), status);
      return;
    }

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

    const originalMessage =
      typeof res === 'string'
        ? res
        : typeof res === 'object' && res?.message
          ? Array.isArray(res.message)
            ? res.message[0]
            : res.message
          : exception.message;

    const i18nKey = `message.errors.${messageKey}`;
    const translated = i18n?.t(i18nKey);
    const translatedMessage = translated && translated !== i18nKey ? translated : originalMessage;

    httpAdapter.reply(
      response,
      {
        code: status,
        message: translatedMessage,
        data: typeof res === 'object' ? (res?.data ?? null) : null,
        cause,
        timestamp: new Date().toISOString(),
        path: httpAdapter.getRequestUrl(request) as string,
      },
      status,
    );
  }

  private resolveAppErrorMessage(exception: AppError, fallbackMessage: string | undefined, i18n?: I18nContext): string {
    if (!exception.messageKey) {
      return fallbackMessage ?? exception.message;
    }

    if (!i18n) {
      return fallbackMessage ?? exception.message;
    }

    const translated = i18n.t(exception.messageKey, {
      args: exception.messageArgs,
    });

    return translated && translated !== exception.messageKey
      ? (translated as string)
      : (fallbackMessage ?? exception.message);
  }

  private shapeCause(cause: unknown, environment?: string): unknown {
    if (environment === 'production') return null;
    if (cause === null || cause === undefined) return null;
    if (cause instanceof Error) {
      return { message: cause.message, stack: cause.stack };
    }
    return cause;
  }

  private buildServerErrorBody(status: number, request: object, i18n?: I18nContext, statusCode?: string) {
    const { httpAdapter } = this.httpAdapterHost;

    return {
      code: status,
      statusCode: statusCode ?? this.serverErrorStatusCodeByStatus[status] ?? 'INTERNAL_SERVER_ERROR',
      message: this.resolveServerErrorMessage(status, i18n),
      data: null,
      cause: null,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request) as string,
    };
  }

  private resolveServerErrorMessage(status: number, i18n?: I18nContext): string {
    const messageKey = this.serverErrorMessageKeyByStatus[status] ?? 'server_error';
    const i18nKey = `message.errors.${messageKey}`;
    const translated = i18n?.t(i18nKey);
    const fallbackByStatus: Record<number, string> = {
      500: 'Internal server error',
      502: 'Bad gateway',
      503: 'Service unavailable',
      504: 'Gateway timeout',
    };

    if (translated && translated !== i18nKey) {
      return translated as string;
    }

    return fallbackByStatus[status] ?? 'Internal server error';
  }

  private logServerError(status: number, message: string, cause: unknown, request: object): void {
    const shapedCause = cause instanceof Error ? { message: cause.message, stack: cause.stack } : cause;

    this.logger.error({
      status,
      message,
      path: this.httpAdapterHost.httpAdapter.getRequestUrl(request),
      cause: shapedCause,
    });
  }
}
