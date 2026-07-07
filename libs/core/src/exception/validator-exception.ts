import { getMetadataStorage, ValidationError } from 'class-validator';
import { FieldError } from '@libs/util';
import { resolveValidationMessage } from '../validation';

export type FlattenedValidationError = FieldError;

interface ConstraintMetadata {
  propertyName: string;
  name?: string;
  type: string;
  message?: unknown;
}

type Constructor = abstract new (...args: never[]) => object;

const metadataCache = new WeakMap<Constructor, ConstraintMetadata[]>();

const constraintMetadatasFor = (ctor: Constructor): ConstraintMetadata[] => {
  let metadatas = metadataCache.get(ctor);
  if (!metadatas) {
    metadatas = getMetadataStorage().getTargetValidationMetadatas(ctor, '', false, false);
    metadataCache.set(ctor, metadatas);
  }
  return metadatas;
};

const hasExplicitMessage = (target: unknown, property: string, key: string): boolean => {
  const ctor = (target as { constructor?: Constructor } | null | undefined)?.constructor;
  if (!ctor) return false;
  return constraintMetadatasFor(ctor).some(
    (m) => m.propertyName === property && (m.name === key || m.type === key) && Boolean(m.message),
  );
};

export const flattenValidationErrors = (errors: ValidationError[], parentPath = ''): FlattenedValidationError[] => {
  const result: FlattenedValidationError[] = [];

  for (const error of errors) {
    const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      for (const [key, rawMessage] of Object.entries(error.constraints)) {
        const message = hasExplicitMessage(error.target, error.property, key)
          ? rawMessage
          : (resolveValidationMessage(key, fieldPath) ?? rawMessage);
        result.push({ field: fieldPath, key, message });
      }
    }

    if (error.children && error.children.length > 0) {
      result.push(...flattenValidationErrors(error.children, fieldPath));
    }
  }

  return result;
};
