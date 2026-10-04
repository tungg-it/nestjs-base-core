import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IncomingMessage, ServerResponse } from 'node:http';
import { maskSensitiveFields } from '@libs/util';
import { setHttpResponseData } from '../logger/http-response-data';
import { setHttpRequestData } from '../logger/http-request-data';

export interface Response<T> {
  code: 200;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest<{ raw?: IncomingMessage; body?: unknown }>();
    if (request?.raw instanceof IncomingMessage && request.body !== undefined) {
      setHttpRequestData(request.raw, maskSensitiveFields(request.body));
    }

    return next.handle().pipe(
      map((data) => {
        const body = { code: 200 as const, message: 'Ok', data };
        const reply = http.getResponse<{ raw?: ServerResponse }>();
        if (reply?.raw instanceof ServerResponse) {
          setHttpResponseData(reply.raw, maskSensitiveFields(body));
        }
        return body;
      }),
    );
  }
}
