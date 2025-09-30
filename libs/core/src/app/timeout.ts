import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutInMilliseconds = 10_000;

  intercept<T>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    return next.handle().pipe(
      timeout(this.timeoutInMilliseconds),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          throw new HttpException(
            'gateway_timeout',
            HttpStatus.GATEWAY_TIMEOUT,
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
