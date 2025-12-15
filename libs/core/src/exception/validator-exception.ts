import { ValidationError } from '@nestjs/common';

export const flattenValidationErrors = (
  errors: ValidationError[],
  parentPath = '',
): { field: string; message: string }[] => {
  const result: { field: string; message: string }[] = [];

  for (const error of errors) {
    const fieldPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      for (const msg of Object.values(error.constraints)) {
        result.push({
          field: fieldPath,
          message: msg,
        });
      }
    }

    if (error.children && error.children.length > 0) {
      result.push(...flattenValidationErrors(error.children, fieldPath));
    }
  }

  return result;
};
