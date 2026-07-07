import { Injectable } from '@nestjs/common';
import { CreateExampleDto } from './create-example.dto';

@Injectable()
export class CreateExampleService {
  /** Echo DTO đã được normalize + validate (chứng minh @Trim/@ToNumber đã chạy). */
  create(dto: CreateExampleDto): CreateExampleDto {
    return dto;
  }
}
