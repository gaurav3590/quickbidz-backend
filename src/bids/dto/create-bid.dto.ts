import { IsNumber, IsOptional, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBidDto {
  @ApiProperty({ 
    description: 'Bid amount in dollars',
    example: 150.50,
    minimum: 0.01
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ 
    description: 'ID of the auction to bid on',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  auctionId: string;

  @ApiPropertyOptional({ 
    description: 'ID of the bidder (automatically set from authenticated user)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  bidderId?: string;
}
