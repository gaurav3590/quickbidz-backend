export class Notification {
  id: string;
  type: string; // 'BID_PLACED', 'BID_OUTBID', 'AUCTION_ENDED', 'AUCTION_WON', 'COMMENT_ADDED', etc.
  title: string;
  message: string;
  userId: string;
  read: boolean;
  data?: any; // Additional data related to the notification (e.g., auctionId, bidId, etc.)
  createdAt: Date;
  updatedAt: Date;

  // Relations
  user?: any;

  constructor(partial: Partial<Notification>) {
    Object.assign(this, partial);
  }
}
