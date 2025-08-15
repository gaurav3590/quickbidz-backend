import { PartialType } from '@nestjs/mapped-types';
import { CreateStoryDto } from './create-story.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateStoryDto extends PartialType(CreateStoryDto) {
  @IsEnum(['ACTIVE', 'INACTIVE', 'DELETED'])
  @IsOptional()
  status?: string;
}
