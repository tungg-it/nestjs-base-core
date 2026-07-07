import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsCode, ToNumber, Trim } from '@libs/core';

/**
 * Ví dụ validation stack:
 * - `@Trim` + constraint generic → message i18n từ `validation.constraints.*`
 * - `@IsCode` → domain validator, message riêng
 * - `@MaxLength(..., { message })` → override message cho field cụ thể
 * - `@ToNumber` → coerce query/body string sang number trước khi validate
 */
export class CreateExampleDto {
  @ApiProperty({ example: 'Cấp đổi giấy phép lái xe' })
  @Trim()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'CAP_DOI_GPLX' })
  @Trim()
  @IsCode()
  code: string;

  @ApiProperty({
    required: false,
    example: 'Thủ tục cấp đổi GPLX do ngành GTVT quản lý',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Mô tả không được vượt quá 500 ký tự' })
  description?: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  quantity?: number;
}
