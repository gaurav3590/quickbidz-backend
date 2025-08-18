import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
  Delete,
  Logger,
  Options,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GetUser } from './decorators/get-user.decorator';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { TokenResponseDto } from './dto/token-response.dto';
import moment from 'moment';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('test')
  @ApiOperation({ summary: 'Test auth API connectivity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Auth API is working' })
  test() {
    try {
      this.logger.log('Auth test endpoint called');
      return {
        message: 'Auth API is working',
        timestamp: moment().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      this.logger.error('Error in test endpoint', error);
      return {
        message: 'Auth API encountered an error',
        error: error.message,
        timestamp: moment().toISOString(),
      };
    }
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered successfully', type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid registration data' })
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Options('login')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Handle OPTIONS preflight for login' })
  preflightLogin(@Res() res: Response) {
    res.header('Access-Control-Allow-Origin', 'https://quickbidz.netlify.app');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(204).end();
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'User logged in successfully', type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Res() res: Response): Promise<void> {
    try {
      console.log('Login attempt for email:', loginDto.email);
      const result = await this.authService.login(loginDto);
      
      // Set CORS headers explicitly
      res.header('Access-Control-Allow-Origin', 'https://quickbidz.netlify.app');
      res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific errors
      if (error instanceof UnauthorizedException) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: error.message || 'Invalid credentials',
        });
      } else {
        // Generic error - don't expose details in production
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An error occurred during login. Please try again.',
        });
      }
    }
  }

  @Public()
  @Options('login-alt')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Handle OPTIONS preflight for login-alt' })
  preflightLoginAlt(@Res() res: Response) {
    res.header('Access-Control-Allow-Origin', 'https://quickbidz.netlify.app');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(204).end();
  }

  @Public()
  @Post('login-alt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alternative login endpoint' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'User logged in successfully', type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  async loginAlternative(
    @Body() loginDto: LoginDto,
    @Res() res: Response
  ): Promise<void> {
    const result = await this.authService.login(loginDto);
    
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', 'https://quickbidz.netlify.app');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    res.status(HttpStatus.OK).json(result);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tokens refreshed successfully', type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid refresh token' })
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @GetUser() user,
  ): Promise<TokenResponseDto> {
    return this.authService.refreshTokens(
      user.id,
      refreshTokenDto.refreshToken,
    );
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset email sent if account exists' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message:
        'If an account with that email exists, a password reset link has been sent',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
    return { message: 'Password reset successfully' };
  }

  @Public()
  @Post('activate-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate user account using token' })
  @ApiBody({ type: ActivateAccountDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Account activated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid or expired token' })
  async activateAccount(@Body() activateAccountDto: ActivateAccountDto) {
    await this.authService.activateAccount(activateAccountDto.token);
    return { message: 'Account activated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout a user' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Logged out successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  async logout(@GetUser() user) {
    await this.authService.logout(user.id);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile returned' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  getProfile(@GetUser() user) {
    return user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin')
  @ApiOperation({ summary: 'Admin-only route' })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Admin route accessed' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not authorized (not an admin)' })
  adminRoute() {
    return { message: 'This route is only for admins' };
  }
}
