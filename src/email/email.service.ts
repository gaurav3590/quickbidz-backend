import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE', false),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  private async compileTemplate(
    templateName: string,
    context: any,
  ): Promise<string> {
    const templatesDir = path.join(process.cwd(), 'src/email/templates');
    const templatePath = path.join(templatesDir, `${templateName}.hbs`);

    try {
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      return template(context);
    } catch (error) {
      console.error(`Failed to compile template ${templateName}:`, error);
      throw error;
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    email: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from:
          email ||
          this.configService.get<string>('EMAIL_FROM') ||
          'noreply@quickbidz.com',
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendForgotPasswordEmail(
    to: string,
    username: string,
    resetToken: string,
    email: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    const html = await this.compileTemplate('forgot-password', {
      username,
      resetUrl,
      resetToken,
    });

    await this.sendEmail(to, 'Reset Your Password', html, email);
  }

  async sendAccountActivationEmail(
    to: string,
    username: string,
    activationToken: string,
    email: string,
  ): Promise<void> {
    const activationUrl = `${this.configService.get<string>('FRONTEND_URL')}/activate-account?token=${activationToken}`;

    const html = await this.compileTemplate('account-activation', {
      username,
      activationUrl,
      activationToken,
    });

    await this.sendEmail(to, 'Activate Your Account', html, email);
  }

  async sendAuctionBidStartedEmail(
    to: string,
    username: string,
    auctionTitle: string,
    auctionId: string,
    email: string,
  ): Promise<void> {
    const auctionUrl = `${this.configService.get<string>('FRONTEND_URL')}/auctions/${auctionId}`;

    const html = await this.compileTemplate('auction-bid-started', {
      username,
      auctionTitle,
      auctionUrl,
    });

    await this.sendEmail(to, `Bidding Started: ${auctionTitle}`, html, email);
  }

  async sendParticipatingInAuctionEmail(
    to: string,
    username: string,
    auctionTitle: string,
    auctionId: string,
    currentBid: number,
    email: string,
  ): Promise<void> {
    const auctionUrl = `${this.configService.get<string>('FRONTEND_URL')}/auctions/${auctionId}`;

    const html = await this.compileTemplate('participating-in-auction', {
      username,
      auctionTitle,
      auctionUrl,
      currentBid,
    });

    await this.sendEmail(
      to,
      `You're Participating in Auction: ${auctionTitle}`,
      html,
      email,
    );
  }

  async sendWinningAuctionBidEmail(
    to: string,
    username: string,
    auctionTitle: string,
    auctionId: string,
    winningBid: number,
    email: string,
  ): Promise<void> {
    const auctionUrl = `${this.configService.get<string>('FRONTEND_URL')}/auctions/${auctionId}`;
    const paymentUrl = `${this.configService.get<string>('FRONTEND_URL')}/payment/${auctionId}`;

    const html = await this.compileTemplate('winning-auction-bid', {
      username,
      auctionTitle,
      auctionUrl,
      winningBid,
      paymentUrl,
    });

    await this.sendEmail(
      to,
      `Congratulations! You Won the Auction: ${auctionTitle}`,
      html,
      email,
    );
  }

  async sendLosingAuctionBidEmail(
    to: string,
    username: string,
    auctionTitle: string,
    auctionId: string,
    yourBid: number,
    winningBid: number,
    email: string,
  ): Promise<void> {
    const auctionUrl = `${this.configService.get<string>('FRONTEND_URL')}/auctions/${auctionId}`;
    const allAuctionsUrl = `${this.configService.get<string>('FRONTEND_URL')}/auctions`;

    const html = await this.compileTemplate('losing-auction-bid', {
      username,
      auctionTitle,
      auctionUrl,
      yourBid,
      winningBid,
      allAuctionsUrl,
    });

    await this.sendEmail(to, `Auction Result: ${auctionTitle}`, html, email);
  }
}
