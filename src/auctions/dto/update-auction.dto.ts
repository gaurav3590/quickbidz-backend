import { PartialType } from '@nestjs/mapped-types';
import { CreateAuctionDto } from './create-auction.dto';
import { IsEnum, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import moment from 'moment';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAuctionDto extends PartialType(CreateAuctionDto) {
  @ApiPropertyOptional({ 
    description: 'Status of the auction', 
    enum: ['PENDING', 'ACTIVE', 'ENDED', 'CANCELLED'],
    example: 'ACTIVE'
  })
  @IsEnum(['PENDING', 'ACTIVE', 'ENDED', 'CANCELLED'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Current price of the auction in dollars', 
    example: 150
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentPrice?: number;

  @ApiPropertyOptional({ 
    description: 'ID of the winning bid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsOptional()
  winningBidId?: string;
  
  @ApiPropertyOptional({ 
    description: 'Start time of the auction',
    example: '2023-12-01T10:00:00Z'
  })
  @Transform(({ value }) => value ? moment(value).toDate() : undefined)
  @IsOptional()
  startTime?: Date;

  @ApiPropertyOptional({ 
    description: 'End time of the auction',
    example: '2023-12-08T10:00:00Z'
  })
  @Transform(({ value }) => value ? moment(value).toDate() : undefined)
  @IsOptional()
  endTime?: Date;
}
