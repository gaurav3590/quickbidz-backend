import { Body, Controller, Post, HttpStatus } from '@nestjs/common';
import { EmailService } from './email.service';
import { Public } from '../auth/decorators/public.decorator';
import { TestEmailDto } from './dto/test-email.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('email-test')
@Controller('email-test')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Send a test email' })
  @ApiBody({ type: TestEmailDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Test email sent successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Failed to send test email' })
  async testEmail(@Body() testEmailDto: TestEmailDto) {
    const { to, username, emailType } = testEmailDto;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@quickbidz.com';

    try {
      switch (emailType) {
        case 'forgot-password':
          await this.emailService.sendForgotPasswordEmail(
            to,
            username,
            'test-reset-token-123456',
            fromEmail,
          );
          break;
        case 'account-activation':
          await this.emailService.sendAccountActivationEmail(
            to,
            username,
            'test-activation-token-123456',
            fromEmail,
          );
          break;
        case 'auction-started':
          await this.emailService.sendAuctionBidStartedEmail(
            to,
            username,
            'Test Auction Item',
            'test-auction-id-123456',
            fromEmail,
          );
          break;
        case 'participating':
          await this.emailService.sendParticipatingInAuctionEmail(
            to,
            username,
            'Test Auction Item',
            'test-auction-id-123456',
            100.0,
            fromEmail,
          );
          break;
        case 'winning':
          await this.emailService.sendWinningAuctionBidEmail(
            to,
            username,
            'Test Auction Item',
            'test-auction-id-123456',
            150.0,
            fromEmail,
          );
          break;
        case 'losing':
          await this.emailService.sendLosingAuctionBidEmail(
            to,
            username,
            'Test Auction Item',
            'test-auction-id-123456',
            120.0,
            150.0,
            fromEmail,
          );
          break;
        default:
          throw new Error(`Unknown email type: ${emailType}`);
      }

      return {
        success: true,
        message: `Test ${emailType} email sent to ${to}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send test email',
        error: error.message,
      };
    }
  }
}
