import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UploadApiResponse, v2 as Cloudinary } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadService {
  constructor(
    @Inject('CLOUDINARY') private cloudinary: typeof Cloudinary,
    private prisma: PrismaService
  ) {}

  /**
   * Uploads a user profile image to Cloudinary cloud storage
   * @param buffer - The file buffer to upload
   * @param filename - The name to give the file
   * @returns The URL to access the file
   */
  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader
        .upload_stream(
          { resource_type: 'image' },
          (error, result: UploadApiResponse) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          },
        )
        .end(file.buffer);
    });
  }

  /**
   * Uploads multiple images to Cloudinary cloud storage
   * @param files - The files to upload
   * @returns The URLs to access the files
   */
  async uploadMultipleImages(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file));
    return Promise.all(uploadPromises);
  }
  
  /**
   * Uploads an image to Cloudinary with specific folder and options
   * @param file - The file to upload
   * @param folder - The folder to upload to
   * @returns The URL to access the file
   */
  async uploadImageWithOptions(
    file: Express.Multer.File, 
    options: { folder?: string; public_id?: string }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader
        .upload_stream(
          { 
            resource_type: 'image',
            ...options
          },
          (error, result: UploadApiResponse) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          },
        )
        .end(file.buffer);
    });
  }

  /**
   * Uploads multiple auction images to Cloudinary in the auctions folder
   * @param files - The files to upload
   * @returns The URLs to access the files
   */
  async uploadMultipleAuctionImages(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => 
      this.uploadImageWithOptions(file, { folder: 'auctions' })
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Uploads multiple auction images to Cloudinary in a specific auction folder
   * @param files - The files to upload
   * @param auctionId - The ID of the auction
   * @returns The URLs to access the files
   */
  async uploadMultipleAuctionImagesWithId(
    files: Express.Multer.File[], 
    auctionId: string
  ): Promise<string[]> {
    const uploadPromises = files.map((file, index) => 
      this.uploadImageWithOptions(file, { 
        folder: `auctions/${auctionId}`,
        public_id: `image_${index + 1}`
      })
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Uploads images for an auction and updates the auction record
   * @param files - The image files to upload
   * @param auctionId - The ID of the auction to update
   * @param userId - The ID of the user performing the update
   * @returns The updated auction with image URLs
   */
  async uploadAndUpdateAuctionImages(
    files: Express.Multer.File[],
    auctionId: string,
    userId: string
  ): Promise<any> {
    // First check if auction exists and belongs to the user
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      throw new NotFoundException(`Auction with ID ${auctionId} not found`);
    }

    // Verify ownership if userId is provided
    if (userId && auction.sellerId !== userId) {
      throw new NotFoundException(`You do not have permission to update this auction's images`);
    }

    // Upload images
    const imageUrls = await this.uploadMultipleAuctionImagesWithId(files, auctionId);

    // Update auction with new image URLs
    const updatedAuction = await this.prisma.auction.update({
      where: { id: auctionId },
      data: {
        // If auction already has images, append the new ones, otherwise set them
        imageUrls: auction.imageUrls 
          ? [...auction.imageUrls, ...imageUrls]
          : imageUrls,
      },
    });

    return updatedAuction;
  }
}
