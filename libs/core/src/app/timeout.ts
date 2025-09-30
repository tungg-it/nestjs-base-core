import { Exception } from '@libs/core/exception';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutInMilliseconds: number = 10_000;

  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(this.timeoutInMilliseconds),
      catchError((err) => {
        if (err instanceof TimeoutError)
          throw new Exception({
            status: 408,
            code: 'REQUEST_TIMEOUT',
            message: 'Request timeout',
          });

        return throwError(() => err);
      }),
    );
  }
}
