import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from 'megajs';

@Injectable()
export class MegaService {
  private storage: Storage;
  private readonly logger = new Logger(MegaService.name);

  constructor(private configService: ConfigService) {
    // Initialize Mega client with credentials from environment variables
    const email = this.configService.get<string>('MEGA_EMAIL');
    const password = this.configService.get<string>('MEGA_PASSWORD');

    if (!email || !password) {
      throw new Error(
        'MEGA_EMAIL and MEGA_PASSWORD must be defined in environment variables',
      );
    }

    this.storage = new Storage({
      email,
      password,
    });
  }

  /**
   * Uploads a file to Mega cloud storage
   * @param file - The file buffer to upload
   * @param filename - The name to give the file
   * @returns The URL to access the file
   */
  async uploadFile(buffer: Buffer, filename: string): Promise<string> {
    try {
      // Connect to Mega
      await this.storage.login();
      this.logger.log('Connected to Mega');

      // Get the root directory
      const root = this.storage.root;

      // Create auctions folder if it doesn't exist
      let auctionsFolder = root.children?.find(
        (node) => node.name === 'auctions',
      );
      if (!auctionsFolder) {
        auctionsFolder = await root.mkdir('auctions');
        this.logger.log('Created auctions folder in Mega');
      }

      // Generate unique filename to avoid collisions
      const uniqueFilename = `${Date.now()}-${filename}`;

      // Upload the file to the auctions folder
      const file = await auctionsFolder.upload(
        {
          name: uniqueFilename,
          size: buffer.length,
        },
        buffer,
      );
      // Generate a public link for the file
      const link = await (file as any).link({
        noKey: false,
      });

      this.logger.log(`File uploaded successfully: ${filename}`);
      return link;
    } catch (error) {
      this.logger.error(`Failed to upload file to Mega: ${error.message}`);
      throw new Error(`Failed to upload file to Mega: ${error.message}`);
    } finally {
      // Logout from Mega to free up resources
      await this.storage.close();
    }
  }

  /**
   * Uploads a user profile image to Mega cloud storage
   * @param buffer - The file buffer to upload
   * @param filename - The name to give the file
   * @returns The URL to access the file
   */
  async uploadProfileImage(buffer: Buffer, filename: string): Promise<string> {
    try {
      // Connect to Mega
      await this.storage.login();
      this.logger.log('Connected to Mega');

      // Get the root directory
      const root = this.storage.root;

      // Create profiles folder if it doesn't exist
      let profilesFolder = root.children?.find(
        (node) => node.name === 'profiles',
      );
      if (!profilesFolder) {
        profilesFolder = await root.mkdir('profiles');
        this.logger.log('Created profiles folder in Mega');
      }

      // Generate unique filename to avoid collisions
      const uniqueFilename = `${Date.now()}-${filename}`;

      // Upload the file to the profiles folder
      const file = await profilesFolder.upload(
        {
          name: uniqueFilename,
          size: buffer.length,
        },
        buffer,
      );
      // Generate a public link for the file
      const link = await (file as any).link({
        noKey: false,
      });

      this.logger.log(`Profile image uploaded successfully: ${filename}`);
      return link;
    } catch (error) {
      this.logger.error(`Failed to upload profile image to Mega: ${error.message}`);
      throw new Error(`Failed to upload profile image to Mega: ${error.message}`);
    } finally {
      // Logout from Mega to free up resources
      await this.storage.close();
    }
  }

  /**
   * Uploads multiple files to Mega cloud storage
   * @param files - Array of files to upload
   * @returns Array of URLs to access the files
   */
  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file.buffer, file.originalname),
    );

    return Promise.all(uploadPromises);
  }
}
