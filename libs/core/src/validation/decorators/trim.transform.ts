import { Transform } from 'class-transformer';

export const Trim = (): PropertyDecorator =>
  Transform((params) => {
    const value: unknown = params.value;
    return typeof value === 'string' ? value.trim() : value;
  });
