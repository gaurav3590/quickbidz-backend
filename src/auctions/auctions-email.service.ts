import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuctionsEmailService {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get fromEmail(): string {
    return (
      this.configService.get<string>('EMAIL_FROM') || 'noreply@quickbidz.com'
    );
  }

  async sendAuctionStartedEmail(auctionId: string): Promise<void> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        seller: true,
      },
    });

    if (!auction) {
      return;
    }

    // Get all users who have shown interest in similar auctions
    const interestedUsers = await this.prisma.user.findMany({
      where: {
        // Example condition - could be more sophisticated based on user interests
        bids: {
          some: {
            auction: {
              id: {
                not: auctionId, // Not the current auction
              },
              // Could add more filters based on category, etc.
            },
          },
        },
        isActive: true,
      },
    });

    // Send email to each interested user
    for (const user of interestedUsers) {
      await this.emailService.sendAuctionBidStartedEmail(
        user.email,
        user.username,
        auction.title,
        auction.id,
        this.fromEmail,
      );
    }
  }

  async sendParticipatingInAuctionEmail(
    userId: string,
    auctionId: string,
    bidAmount: number,
  ): Promise<void> {
    const [user, auction] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
      }),
      this.prisma.auction.findUnique({
        where: { id: auctionId },
      }),
    ]);

    if (!user || !auction || !user.isActive) {
      return;
    }

    await this.emailService.sendParticipatingInAuctionEmail(
      user.email,
      user.username,
      auction.title,
      auction.id,
      bidAmount,
      this.fromEmail,
    );
  }

  async sendAuctionResultEmails(auctionId: string): Promise<void> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        winningBid: {
          include: {
            bidder: true,
          },
        },
        bids: {
          include: {
            bidder: true,
          },
          orderBy: {
            amount: 'desc',
          },
        },
      },
    });

    if (!auction || !auction.winningBid) {
      return;
    }

    // Send winning email to winner
    await this.emailService.sendWinningAuctionBidEmail(
      auction.winningBid.bidder.email,
      auction.winningBid.bidder.username,
      auction.title,
      auction.id,
      auction.winningBid.amount,
      this.fromEmail,
    );

    // Send losing emails to all other bidders
    const losingBidders = auction.bids.filter(
      (bid) => bid.id !== auction.winningBid?.id && bid.bidder.isActive,
    );

    for (const bid of losingBidders) {
      await this.emailService.sendLosingAuctionBidEmail(
        bid.bidder.email,
        bid.bidder.username,
        auction.title,
        auction.id,
        bid.amount,
        auction.winningBid.amount,
        this.fromEmail,
      );
    }
  }
}
