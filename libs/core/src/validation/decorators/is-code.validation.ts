import { registerDecorator, ValidationOptions } from 'class-validator';
import { MASTER_DATA_CODE_REGEX } from '@libs/util';

export const IsCode =
  (validationOptions?: ValidationOptions): PropertyDecorator =>
  (object: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'isCode',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate: (value: unknown) => typeof value === 'string' && MASTER_DATA_CODE_REGEX.test(value),
        defaultMessage: () => 'Mã chỉ gồm chữ in HOA,in thường ,số ,dấu gạch ngang và dấu gạch dưới',
      },
    });
  };
