import { ApiProperty } from '@nestjs/swagger';

export class Bid {
  @ApiProperty({ description: 'Unique identifier for the bid', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Bid amount in dollars', example: 150.50 })
  amount: number;

  @ApiProperty({ 
    description: 'Status of the bid', 
    example: 'PLACED',
    enum: ['PLACED', 'WINNING', 'OUTBID', 'ACCEPTED', 'REJECTED']
  })
  status: string; // 'PLACED', 'WINNING', 'OUTBID', 'ACCEPTED', 'REJECTED'

  @ApiProperty({ description: 'ID of the bidder', example: '123e4567-e89b-12d3-a456-426614174000' })
  bidderId: string;

  @ApiProperty({ description: 'ID of the auction', example: '123e4567-e89b-12d3-a456-426614174000' })
  auctionId: string;

  @ApiProperty({ description: 'Date when the bid was created', example: '2023-11-30T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the bid was last updated', example: '2023-11-30T10:00:00Z' })
  updatedAt: Date;

  // Relations
  auction?: any;

  bidder?: any;

  constructor(partial: Partial<Bid>) {
    Object.assign(this, partial);
  }
}
