import { HttpException } from '@nestjs/common';

export interface FieldError {
  field: string;
  key: string;
  message: string;
}

export interface AppErrorData {
  errors?: FieldError[];
  [key: string]: unknown;
}

export interface AppErrorOptions<TData = AppErrorData> {
  cause?: unknown;
  data?: TData;
  messageKey?: string;
  messageArgs?: Record<string, unknown>;
}

export class AppError extends HttpException {
  public readonly statusCode: string;
  public readonly originalCause?: unknown;
  public readonly messageKey?: string;
  public readonly messageArgs?: Record<string, unknown>;

  constructor(statusCode: string, httpStatus: number, message: string, options?: AppErrorOptions<unknown>) {
    super(
      { statusCode, message, data: options?.data ?? null },
      httpStatus,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.statusCode = statusCode;
    this.originalCause = options?.cause;
    this.messageKey = options?.messageKey;
    this.messageArgs = options?.messageArgs;
  }
}
