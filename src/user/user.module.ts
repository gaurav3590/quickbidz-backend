import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { CloudinaryProvider } from '../upload/cloudinary.provider';
import { UploadService } from '../upload/upload.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [UserController],
  providers: [UserService, CloudinaryProvider, UploadService],
  exports: [UserService],
})
export class UserModule {}
