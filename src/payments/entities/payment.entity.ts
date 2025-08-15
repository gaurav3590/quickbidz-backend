export class Payment {
  id: string;
  amount: number;
  status: string; // 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'
  paymentMethod: string; // 'CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', etc.
  userId: string;
  auctionId: string;
  bidId: string | null;
  transactionId: string | null;
  gatewayResponse: any | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  user?: any;
  auction?: any;
  bid?: any;

  constructor(partial: Partial<Payment>) {
    Object.assign(this, partial);
  }
}
