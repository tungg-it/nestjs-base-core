import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { CommonErrors } from '@libs/util';
import { resolveValidationMessage } from '../messages';

@Injectable()
export class ParseUuidV7Pipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (typeof value === 'string' && isUUID(value, '7')) {
      return value;
    }

    const field = metadata.data ?? 'id';
    throw CommonErrors.validationFailed({
      data: [
        {
          field,
          key: 'isUuidV7',
          message: resolveValidationMessage('isUuidV7', field) ?? `${field} is not a valid identifier`,
        },
      ],
    });
  }
}
