import { isUUID, registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export const IsUuidV7 =
  (validationOptions?: ValidationOptions): PropertyDecorator =>
  (object: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'isUuidV7',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate: (value: unknown) => typeof value === 'string' && isUUID(value, '7'),
        defaultMessage: (args?: ValidationArguments) => `${args?.property} không phải mã định danh hợp lệ`,
      },
    });
  };
