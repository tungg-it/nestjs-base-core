import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseUuidV7Pipe } from '@libs/core';
import { CreateExampleDto } from '../features/create-example/create-example.dto';
import { CreateExampleService } from '../features/create-example/create-example.service';
import { CommonErrors } from '@libs/util';

@ApiTags('example')
@Controller()
export class ExampleController {
  constructor(private readonly createExample: CreateExampleService) {}

  /**
   * Body validation: 422 VALIDATION_FAILED với `{ field, key, message }[]`.
   * Thử: `POST /api/v1/example/validate` với body `{}` hoặc `{ "name": "", "code": "bad code" }`.
   */
  @ApiOperation({ summary: 'Demo body validation (global ValidationPipe)' })
  @Post('/example/validate')
  validate(@Body() dto: CreateExampleDto) {
    return this.createExample.create(dto);
  }

  /**
   * Param validation: id không phải UUID v7 → 422 VALIDATION_FAILED qua `ParseUuidV7Pipe`.
   * Thử: `GET /api/v1/example/uuid/not-a-uuid`.
   */
  @ApiOperation({ summary: 'Demo param validation (ParseUuidV7Pipe)' })
  @Get('/example/uuid/:id')
  uuid(@Param('id', ParseUuidV7Pipe) id: string) {
    return { id };
  }

  @ApiOperation({ summary: 'Demo Internal Error' })
  @Get('/example/internal-error')
  internalError() {
    throw new Error('Internal error');
  }

  @ApiOperation({ summary: 'Demo Custom Error' })
  @Get('/example/custom-error')
  customError() {
    throw CommonErrors.badRequest('Custom error', { data: { field: 'value' } });
  }
}
