import { Transform } from 'class-transformer';
import { toNumber } from '@libs/util';

export const ToNumber = (): PropertyDecorator => Transform(({ value }) => toNumber(value));
