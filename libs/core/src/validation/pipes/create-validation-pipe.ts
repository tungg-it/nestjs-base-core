import { ValidationError, ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { CommonErrors } from '@libs/util';
import { flattenValidationErrors } from '../../exception';

export const createValidationPipe = (overrides?: ValidationPipeOptions): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidUnknownValues: true,
    exceptionFactory: (errors: ValidationError[]) =>
      CommonErrors.validationFailed({
        cause: flattenValidationErrors(errors),
      }),
    ...overrides,
  });
