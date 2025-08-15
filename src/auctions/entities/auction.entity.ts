import { ApiProperty } from '@nestjs/swagger';

export class Auction {
  @ApiProperty({ description: 'Unique identifier for the auction', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Title of the auction', example: 'Vintage Watch Collection' })
  title: string;

  @ApiProperty({ description: 'Detailed description of the auction item', example: 'A collection of rare vintage watches from the 1950s' })
  description: string;

  @ApiProperty({ description: 'Category of the item', example: 'Collectibles', nullable: true })
  category?: string | null;

  @ApiProperty({ description: 'Condition of the item', example: 'Good - Used', nullable: true })
  condition?: string | null;

  @ApiProperty({ description: 'Array of image URLs for the auction item', type: [String], nullable: true })
  imageUrls?: string[];

  @ApiProperty({ description: 'Starting price of the auction in dollars', example: 100 })
  startingPrice: number;

  @ApiProperty({ description: 'Current price of the auction in dollars', example: 150 })
  currentPrice: number;

  @ApiProperty({ description: 'Reserve price (minimum acceptable price) in dollars', example: 150, nullable: true })
  reservePrice?: number | null;

  @ApiProperty({ description: 'Minimum bid increment in dollars', example: 10, nullable: true })
  bidIncrements?: number | null;

  @ApiProperty({ description: 'Duration of the auction in days', example: 7, nullable: true })
  duration?: number | null;

  @ApiProperty({ description: 'Shipping cost in dollars', example: 15, nullable: true })
  shippingCost?: number | null;

  @ApiProperty({ description: 'Locations where the item can be shipped to', type: [String], nullable: true })
  shippingLocations?: string[];

  @ApiProperty({ description: 'Return policy details', example: 'Returns accepted within 30 days', nullable: true })
  returnPolicy?: string | null;

  @ApiProperty({ description: 'Whether terms and conditions are accepted', example: true, nullable: true })
  termsAccepted?: boolean | null;

  @ApiProperty({ description: 'Start time of the auction', example: '2023-12-01T10:00:00Z' })
  startTime: Date;

  @ApiProperty({ description: 'End time of the auction', example: '2023-12-08T10:00:00Z' })
  endTime: Date;

  @ApiProperty({ description: 'Status of the auction', example: 'ACTIVE', enum: ['PENDING', 'ACTIVE', 'ENDED', 'CANCELLED'] })
  status: string; // 'PENDING', 'ACTIVE', 'ENDED', 'CANCELLED'

  @ApiProperty({ description: 'ID of the seller', example: '123e4567-e89b-12d3-a456-426614174000' })
  sellerId: string;

  @ApiProperty({ description: 'ID of the winning bid', example: '123e4567-e89b-12d3-a456-426614174000', nullable: true })
  winningBidId: string | null;

  @ApiProperty({ description: 'Date when the auction was created', example: '2023-11-30T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the auction was last updated', example: '2023-11-30T10:00:00Z' })
  updatedAt: Date;

  constructor(partial: Partial<Auction>) {
    Object.assign(this, partial);
  }
}
