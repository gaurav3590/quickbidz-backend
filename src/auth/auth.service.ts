import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import moment from 'moment';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    // Check if user exists
    const userExists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: registerDto.email }, { username: registerDto.username }],
      },
    });

    if (userExists) {
      throw new BadRequestException(
        'User with that email or username already exists',
      );
    }

    // Hash password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpires = moment().add(24, 'hours').toDate(); // 24 hours

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        dob: registerDto.dob,
        isActive: false, // User needs to activate account
        activationToken,
        activationTokenExpires,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        dob: true,
        role: true,
        createdAt: true,
      },
    });

    // Send activation email
    await this.emailService.sendAccountActivationEmail(
      user.email,
      user.username,
      activationToken,
      this.configService.get<string>('EMAIL_FROM') || 'noreply@quickbidz.com',
    );

    // Generate tokens
    const tokens = await this.tokenService.generateTokens(user.id);

    return {
      user,
      ...tokens,
      tokenType: 'Bearer',
    };
  }

  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    try {
      console.log('Login attempt for email:', loginDto.email);
      
      // Find user
      let user;
      try {
        user = await this.prisma.user.findUnique({
          where: { email: loginDto.email },
          select: {
            id: true,
            email: true,
            username: true,
            password: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        });
      } catch (dbError) {
        console.error('Database error when finding user:', dbError);
        throw new InternalServerErrorException('Database error occurred');
      }

      if (!user || !user.isActive) {
        throw new UnauthorizedException(
          'Invalid credentials or inactive account',
        );
      }

      // Verify password
      let isPasswordValid;
      try {
        isPasswordValid = await bcrypt.compare(
          loginDto.password,
          user.password,
        );
      } catch (bcryptError) {
        console.error('Error comparing passwords:', bcryptError);
        throw new InternalServerErrorException('Authentication error occurred');
      }

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Generate tokens
      let tokens;
      try {
        tokens = await this.tokenService.generateTokens(user.id);
      } catch (tokenError) {
        console.error('Error generating tokens:', tokenError);
        throw new InternalServerErrorException('Failed to generate authentication tokens');
      }

      return {
        user: userWithoutPassword,
        ...tokens,
        tokenType: 'Bearer',
      };
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw the error to be handled by the exception filter
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
      },
    });

    // Don't reveal if user exists or not
    if (!user || !user.isActive) {
      return; // Silently return to prevent user enumeration
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = moment().add(1, 'hour').toDate(); // 1 hour

    // Store reset token in the database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // Send email with reset token
    await this.emailService.sendForgotPasswordEmail(
      user.email,
      user.username,
      resetToken,
      this.configService.get<string>('EMAIL_FROM') || 'noreply@quickbidz.com',
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user by token and check if token is not expired
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: moment().toDate(), // Token not expired
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user password and clear token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });
  }

  async activateAccount(token: string): Promise<void> {
    // Find user by activation token and check if token is not expired
    const user = await this.prisma.user.findFirst({
      where: {
        activationToken: token,
        activationTokenExpires: {
          gt: moment().toDate(), // Token not expired
        },
        isActive: false, // Account not activated yet
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired activation token');
    }

    // Activate user account and clear token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        activationToken: null,
        activationTokenExpires: null,
      },
    });
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<TokenResponseDto> {
    // Validate the refresh token
    const tokenFamily = await this.tokenService.validateRefreshToken(
      userId,
      refreshToken,
    );

    if (!tokenFamily) {
      // If token validation fails, revoke all tokens for security
      await this.tokenService.revokeAllUserTokens(userId);
      throw new ForbiddenException('Invalid refresh token');
    }

    // Get user information
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens using the same token family
    const tokens = await this.tokenService.generateTokens(userId, tokenFamily);

    return {
      user,
      ...tokens,
      tokenType: 'Bearer',
    };
  }

  async logout(userId: string): Promise<void> {
    // Revoke all refresh tokens for the user
    await this.tokenService.revokeAllUserTokens(userId);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}
