export class Exception extends Error {
  readonly isBusinessException: boolean = true;
  readonly status: number;
  readonly code: string;

  constructor({
    status,
    code,
    message,
  }: {
    status?: number;
    code?: string;
    message: string;
  }) {
    super(message);

    this.status = status ?? 400;
    this.code = code ?? COMMON_CODE.BAD_REQUEST;

    // Fix prototype chain (quan trọng cho instanceof)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const throwException = ({
  status,
  code,
  message,
}: {
  status?: number;
  code?: string;
  message?: string;
}): never => {
  throw new Exception({
    status,
    code,
    message: (message ?? code ?? 'error').toLowerCase(),
  });
};

export const COMMON_CODE = {
  OBJECT_NOT_FOUND: 'object_not_found',
  OBJECT_EXISTED: 'object_existed',
  BAD_REQUEST: 'bad_request',
  SERVER_ERROR: 'server_error',
  FORBIDDEN: 'forbidden',
  UNAUTHORIZED: 'unauthorized',
  NOT_ALLOWED: 'not_allowed',
};

export const isServerError = (e: unknown) => {
  return e instanceof Exception ? e.code === COMMON_CODE.SERVER_ERROR : true;
};

export const throwObjectNotFound = (message?: string): never =>
  throwException({
    message: message ?? COMMON_CODE.OBJECT_NOT_FOUND,
    code: COMMON_CODE.OBJECT_NOT_FOUND,
    status: 404,
  });

export const isObjectNotFound = (error: unknown): boolean =>
  error instanceof Exception && error.code === COMMON_CODE.OBJECT_NOT_FOUND;

export const throwObjectExisted = (message?: string): never =>
  throwException({
    message: message ?? COMMON_CODE.OBJECT_EXISTED,
    code: COMMON_CODE.OBJECT_EXISTED,
    status: 400,
  });

export const throwBadRequest = (message?: string): never =>
  throwException({
    message: message ?? COMMON_CODE.BAD_REQUEST,
    code: COMMON_CODE.BAD_REQUEST,
    status: 400,
  });

export const throwServerError = (message?: string): never =>
  throwException({
    message: message ?? COMMON_CODE.SERVER_ERROR,
    code: COMMON_CODE.SERVER_ERROR,
    status: 500,
  });

export const throwForbidden = (message?: string): never =>
  throwException({
    message: message ?? COMMON_CODE.FORBIDDEN,
    code: COMMON_CODE.FORBIDDEN,
    status: 403,
  });

export const throwUnauthorized = (message?: string): never =>
  throwException({
    message: message ?? COMMON_CODE.UNAUTHORIZED,
    code: COMMON_CODE.UNAUTHORIZED,
    status: 401,
  });

export const throwNotAllowed = (message?: string): never =>
  throwException({
    message: message ?? COMMON_CODE.NOT_ALLOWED,
    code: COMMON_CODE.NOT_ALLOWED,
    status: 405,
  });

export { HttpExceptionFilter } from './http-exception.filter';
