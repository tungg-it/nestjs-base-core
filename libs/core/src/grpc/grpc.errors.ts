import { Code, ConnectError } from '@connectrpc/connect';
import { AppError } from '@libs/util';
import { BadRequestSchema, ErrorInfoSchema } from '@libs/contracts/google/rpc/error_details_pb';
import { ViolationsSchema } from '@libs/contracts/buf/validate/validate_pb';

const httpToGrpc: Record<number, Code> = {
  400: Code.InvalidArgument,
  401: Code.Unauthenticated,
  403: Code.PermissionDenied,
  404: Code.NotFound,
  409: Code.AlreadyExists,
  422: Code.InvalidArgument,
  429: Code.ResourceExhausted,
  500: Code.Internal,
  503: Code.Unavailable,
  504: Code.DeadlineExceeded,
};

export function mapRpcError(error: unknown): ConnectError {
  if (error instanceof AppError) {
    const code = httpToGrpc[error.getStatus()] ?? Code.Unknown;
    const details: ConstructorParameters<typeof ConnectError>[3] = [
      { desc: ErrorInfoSchema, value: { reason: error.statusCode, domain: 'doit.internal' } },
    ];
    const data = (error.getResponse() as { data?: { errors?: Array<{ field?: string; key?: string }> } }).data;
    if (code === Code.InvalidArgument && Array.isArray(data?.errors)) {
      details.push({
        desc: BadRequestSchema,
        value: {
          fieldViolations: data.errors
            .filter((item) => typeof item.field === 'string')
            .map((item) => ({ field: item.field, description: 'Invalid field', reason: item.key ?? '' })),
        },
      });
    }
    return new ConnectError(code >= Code.Internal ? 'RPC failed' : 'Request rejected', code, undefined, details);
  }

  if (error instanceof ConnectError) {
    const violations = error.findDetails(ViolationsSchema).flatMap((detail) => detail.violations);
    if (error.code === Code.InvalidArgument && violations.length > 0) {
      return new ConnectError('Invalid request', Code.InvalidArgument, undefined, [
        { desc: ErrorInfoSchema, value: { reason: 'VALIDATION_FAILED', domain: 'doit.internal' } },
        {
          desc: BadRequestSchema,
          value: {
            fieldViolations: violations.map((violation) => ({
              field:
                violation.field?.elements
                  .map((item) => item.fieldName)
                  .filter(Boolean)
                  .join('.') ?? '',
              description: 'Invalid field',
              reason: violation.ruleId || 'CONSTRAINT_FAILED',
            })),
          },
        },
      ]);
    }
    if (
      [Code.NotFound, Code.Canceled, Code.DeadlineExceeded, Code.Unauthenticated, Code.PermissionDenied].includes(
        error.code,
      )
    ) {
      return new ConnectError('RPC failed', error.code);
    }
  }

  // ADR 0014: raw transport and infrastructure errors never become RPC messages or details.
  return new ConnectError('Internal RPC error', Code.Internal);
}
