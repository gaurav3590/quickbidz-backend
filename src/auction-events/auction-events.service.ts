import { Injectable } from '@nestjs/common';
import { AuctionEventsGateway } from './auction-events.gateway';

@Injectable()
export class AuctionEventsService {
  constructor(private readonly auctionEventsGateway: AuctionEventsGateway) {}

  /**
   * Emit a new bid event for a specific auction
   */
  emitNewBid(auctionId: string, bidData: any) {
    this.auctionEventsGateway.emitNewBid(auctionId, bidData);
  }

  /**
   * Emit auction status change event (e.g., ACTIVE, ENDED, CANCELLED)
   */
  emitAuctionStatusChange(auctionId: string, status: string) {
    this.auctionEventsGateway.emitAuctionStatusChange(auctionId, status);
  }

  /**
   * Emit time remaining for an auction (useful for countdown)
   */
  emitTimeRemaining(auctionId: string, timeRemaining: number) {
    this.auctionEventsGateway.emitTimeRemaining(auctionId, timeRemaining);
  }

  /**
   * Emit when a user joins an auction
   */
  emitUserJoined(auctionId: string, username: string) {
    this.auctionEventsGateway.emitUserJoined(auctionId, username);
  }

  /**
   * Broadcast an announcement to all connected clients
   */
  broadcastAnnouncement(message: string) {
    this.auctionEventsGateway.broadcastToAllAuctions(message);
  }
} 