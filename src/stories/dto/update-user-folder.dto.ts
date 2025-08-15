import { PartialType } from '@nestjs/mapped-types';
import { CreateUserFolderDto } from './create-user-folder.dto';

export class UpdateUserFolderDto extends PartialType(CreateUserFolderDto) {}
