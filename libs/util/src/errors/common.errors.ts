import { createErrorFactory } from './create-error-factory';

export const CommonErrors = createErrorFactory({
  badRequest: {
    code: 'BAD_REQUEST',
    httpStatus: 400,
    messageKey: 'message.errors.bad_request',
    message: (detail?: string) => detail,
  },
  unauthenticated: {
    code: 'UNAUTHENTICATED',
    httpStatus: 401,
    messageKey: 'message.errors.unauthorized',
  },
  forbidden: {
    code: 'FORBIDDEN',
    httpStatus: 403,
    messageKey: 'message.errors.forbidden',
  },
  notFound: {
    code: 'NOT_FOUND',
    httpStatus: 404,
    messageKey: (resource?: string) =>
      resource ? 'message.errors.not_found_with_resource' : 'message.errors.not_found',
    messageArgs: (resource?: string) => (resource ? { resource } : undefined),
  },
  conflict: {
    code: 'CONFLICT',
    httpStatus: 409,
    messageKey: 'message.errors.conflict',
    message: (detail?: string) => detail,
  },
  validationFailed: {
    code: 'VALIDATION_FAILED',
    httpStatus: 422,
    messageKey: 'message.errors.validation_failed',
  },
  tooManyRequests: {
    code: 'TOO_MANY_REQUESTS',
    httpStatus: 429,
    messageKey: 'message.errors.too_many_requests',
  },
  internal: {
    code: 'INTERNAL_SERVER_ERROR',
    httpStatus: 500,
    messageKey: 'message.errors.server_error',
  },
  serviceUnavailable: {
    code: 'SERVICE_UNAVAILABLE',
    httpStatus: 503,
    messageKey: 'message.errors.service_unavailable',
  },
  gatewayTimeout: {
    code: 'GATEWAY_TIMEOUT',
    httpStatus: 504,
    messageKey: 'message.errors.gateway_timeout',
  },
});
