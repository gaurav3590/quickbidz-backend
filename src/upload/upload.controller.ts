import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Body,
  Put,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UploadAuctionImagesDto } from './dto/upload-auction-images.dto';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('auction-images')
  @ApiOperation({ summary: 'Upload multiple auction images' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Images uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        imageUrls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of uploaded image URLs',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or file upload failed',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'List of images to upload',
    type: UploadAuctionImagesDto,
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 images per upload
  async uploadAuctionImages(
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser('id') userId: string,
  ): Promise<{ imageUrls: string[] }> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files uploaded');
      }

      // Validate file types
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          throw new BadRequestException(
            `File ${file.originalname} is not a valid image`,
          );
        }
      }

      // Upload to Cloudinary with auction folder
      const imageUrls = await this.uploadService.uploadMultipleAuctionImages(files);
      return { imageUrls };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload auction images: ${error.message}`,
      );
    }
  }

  @Post('auction/:id/images')
  @ApiOperation({ summary: 'Upload multiple images for a specific auction' })
  @ApiParam({ name: 'id', description: 'Auction ID', type: String })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Images uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        imageUrls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of uploaded image URLs',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or file upload failed',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'List of images to upload',
    type: UploadAuctionImagesDto,
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 images per upload
  async uploadImagesForAuction(
    @Param('id', ParseUUIDPipe) auctionId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser('id') userId: string,
  ): Promise<{ imageUrls: string[] }> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files uploaded');
      }

      // Validate file types
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          throw new BadRequestException(
            `File ${file.originalname} is not a valid image`,
          );
        }
      }

      // Upload to Cloudinary with auction folder and ID
      const imageUrls = await this.uploadService.uploadMultipleAuctionImagesWithId(
        files,
        auctionId,
      );
      return { imageUrls };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload auction images: ${error.message}`,
      );
    }
  }
  
  @Put('auction/:id/images')
  @ApiOperation({ summary: 'Upload and update auction with multiple images' })
  @ApiParam({ name: 'id', description: 'Auction ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auction updated with images successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or file upload failed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Auction not found or user does not have permission',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'List of images to upload',
    type: UploadAuctionImagesDto,
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 images per upload
  async uploadAndUpdateAuction(
    @Param('id', ParseUUIDPipe) auctionId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser('id') userId: string,
  ): Promise<any> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files uploaded');
      }

      // Validate file types
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          throw new BadRequestException(
            `File ${file.originalname} is not a valid image`,
          );
        }
      }

      // Upload images and update the auction
      const updatedAuction = await this.uploadService.uploadAndUpdateAuctionImages(
        files,
        auctionId,
        userId,
      );
      
      return updatedAuction;
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update auction with images: ${error.message}`,
      );
    }
  }
}
