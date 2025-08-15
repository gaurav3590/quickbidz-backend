import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(['ACTIVE', 'INACTIVE', 'DELETED'])
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  userFolderId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string; // This will be set from the authenticated user
}
