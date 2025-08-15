import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async generateTokens(userId: string, tokenFamily?: string) {
    try {
      this.logger.log(`Generating tokens for user: ${userId}`);

      // Create a new token family if not provided
      const family = tokenFamily || uuidv4();

      // Get token expiration times from config
      const accessExpiration =
        this.configService.get<string>('JWT_EXPIRATION') || '15m';
      const refreshExpiration =
        this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

      this.logger.debug('JWT configuration:', {
        accessExpiration,
        refreshExpiration,
        jwtSecret: this.configService.get<string>('JWT_SECRET')
          ? 'Set'
          : 'Not set',
        jwtRefreshSecret: this.configService.get<string>('JWT_REFRESH_SECRET')
          ? 'Set'
          : 'Not set',
      });

      // Calculate expiration times in seconds for the response
      const expiresIn = this.getExpirationSeconds(accessExpiration);

      // Generate JWT tokens
      let accessToken, refreshToken;
      try {
        [accessToken, refreshToken] = await Promise.all([
          this.jwtService.signAsync(
            {
              userId,
              type: 'access',
              jti: uuidv4(), // JWT ID for token identification
            },
            {
              secret: this.configService.get<string>('JWT_SECRET'),
              expiresIn: accessExpiration,
            },
          ),
          this.jwtService.signAsync(
            {
              userId,
              type: 'refresh',
              family,
              jti: uuidv4(),
            },
            {
              secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
              expiresIn: refreshExpiration,
            },
          ),
        ]);
      } catch (jwtError) {
        this.logger.error('Error signing JWT tokens:', jwtError);
        throw new InternalServerErrorException(
          'Failed to generate authentication tokens',
        );
      }

      // Store refresh token information for validation
      try {
        await this.storeRefreshToken(userId, refreshToken, family);
      } catch (storeError) {
        this.logger.error('Error storing refresh token:', storeError);
        throw new InternalServerErrorException(
          'Failed to store authentication data',
        );
      }

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      this.logger.error('Error generating tokens:', error);
      throw error;
    }
  }

  async validateRefreshToken(
    userId: string,
    token: string,
  ): Promise<string | null> {
    try {
      this.logger.log(`Validating refresh token for user: ${userId}`);

      // Verify the token
      let payload;
      try {
        payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        });
      } catch (jwtError) {
        this.logger.warn('Invalid refresh token:', jwtError.message);
        return null;
      }

      // Check if it's a refresh token
      if (payload.type !== 'refresh' || !payload.family) {
        this.logger.warn('Token is not a valid refresh token');
        return null;
      }

      // Find the token family
      try {
        const refreshToken = await this.prisma.refreshToken.findFirst({
          where: {
            userId,
            family: payload.family,
            revoked: false,
          },
        });

        if (!refreshToken) {
          // Token family not found or revoked
          this.logger.warn('Refresh token family not found or revoked');
          return null;
        }

        // Return the token family for new token generation
        return refreshToken.family;
      } catch (dbError) {
        this.logger.error(
          'Database error when validating refresh token:',
          dbError,
        );
        return null;
      }
    } catch (error) {
      this.logger.error('Error validating refresh token:', error);
      return null;
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      this.logger.log(`Revoking all tokens for user: ${userId}`);
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      });
    } catch (error) {
      this.logger.error(`Error revoking tokens for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to revoke user tokens');
    }
  }

  async revokeRefreshTokenFamily(
    userId: string,
    family: string,
  ): Promise<void> {
    try {
      this.logger.log(`Revoking token family ${family} for user: ${userId}`);
      await this.prisma.refreshToken.updateMany({
        where: { userId, family },
        data: { revoked: true },
      });
    } catch (error) {
      this.logger.error(
        `Error revoking token family ${family} for user ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to revoke token family');
    }
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
    family: string,
  ): Promise<void> {
    try {
      // First revoke any previous tokens from the same family
      await this.prisma.refreshToken.updateMany({
        where: { userId, family },
        data: { revoked: true },
      });

      // Create a hash/fingerprint of the token instead of storing the raw token
      const tokenHash = this.createTokenFingerprint(token);

      // Store the new token info
      await this.prisma.refreshToken.create({
        data: {
          userId,
          family,
          tokenHash,
          expiresAt: this.calculateExpirationDate(
            this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
          ),
        },
      });
    } catch (error) {
      this.logger.error('Error storing refresh token:', error);
      throw error;
    }
  }

  private createTokenFingerprint(token: string): string {
    try {
      // In a real implementation, you would use a cryptographic hash function
      // This is a simplified version for demonstration purposes
      return Buffer.from(token).toString('base64');
    } catch (error) {
      this.logger.error('Error creating token fingerprint:', error);
      throw new InternalServerErrorException(
        'Failed to process authentication token',
      );
    }
  }

  private calculateExpirationDate(expiresIn: string): Date {
    try {
      const ms = this.parseDuration(expiresIn);
      return moment().add(ms, 'milliseconds').toDate();
    } catch (error) {
      this.logger.error('Error calculating expiration date:', error);
      throw new InternalServerErrorException(
        'Failed to process token expiration',
      );
    }
  }

  private getExpirationSeconds(duration: string): number {
    try {
      return Math.floor(this.parseDuration(duration) / 1000);
    } catch (error) {
      this.logger.error('Error calculating expiration seconds:', error);
      throw new InternalServerErrorException(
        'Failed to process token expiration',
      );
    }
  }

  private parseDuration(duration: string): number {
    try {
      const unit = duration.charAt(duration.length - 1);
      const value = parseInt(duration.substring(0, duration.length - 1));

      switch (unit) {
        case 's':
          return value * 1000;
        case 'm':
          return value * 60 * 1000;
        case 'h':
          return value * 60 * 60 * 1000;
        case 'd':
          return value * 24 * 60 * 60 * 1000;
        default:
          return parseInt(duration);
      }
    } catch (error) {
      this.logger.error('Error parsing duration:', error);
      throw new InternalServerErrorException('Failed to process time duration');
    }
  }
}
