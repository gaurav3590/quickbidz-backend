import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsUUID,
  IsArray,
  IsBoolean,
  IsPositive,
  IsInt,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import moment from 'moment';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Custom validator for moment dates
class IsMomentDate {
  validate(value: any) {
    return moment(value).isValid();
  }

  defaultMessage() {
    return 'Value must be a valid date';
  }
}

export class CreateAuctionDto {
  @ApiProperty({ description: 'Title of the auction', example: 'Vintage Watch Collection' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed description of the auction item', example: 'A collection of rare vintage watches from the 1950s' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Category of the item', example: 'Collectibles' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Condition of the item', example: 'Good - Used' })
  @IsString()
  @IsOptional()
  condition?: string;

  @ApiProperty({ description: 'Starting price of the auction in dollars', example: 100 })
  @IsNumber()
  @Min(0)
  startingPrice: number;

  @ApiPropertyOptional({ description: 'Reserve price (minimum acceptable price) in dollars', example: 150 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  reservePrice?: number;

  @ApiPropertyOptional({ description: 'Minimum bid increment in dollars', example: 10 })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  bidIncrements?: number;

  @ApiPropertyOptional({ description: 'Duration of the auction in days', example: 7 })
  @IsInt()
  @IsOptional()
  @IsPositive()
  duration?: number;

  @ApiPropertyOptional({ description: 'Shipping cost in dollars', example: 15 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  shippingCost?: number;

  @ApiPropertyOptional({ 
    description: 'Locations where the item can be shipped to',
    example: ['United States', 'Canada', 'Europe'],
    isArray: true
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  shippingLocations?: string[];

  @ApiPropertyOptional({ description: 'Return policy details', example: 'Returns accepted within 30 days' })
  @IsString()
  @IsOptional()
  returnPolicy?: string;

  @ApiPropertyOptional({ description: 'Whether terms and conditions are accepted', example: true })
  @IsBoolean()
  @IsOptional()
  termsAccepted?: boolean;

  @ApiProperty({ description: 'Start time of the auction', example: '2023-12-01T10:00:00Z' })
  @Transform(({ value }) => moment(value).toDate())
  @Validate(IsMomentDate)
  startTime: Date;

  @ApiProperty({ description: 'End time of the auction', example: '2023-12-08T10:00:00Z' })
  @Transform(({ value }) => moment(value).toDate())
  @Validate(IsMomentDate)
  endTime: Date;

  @ApiPropertyOptional({ description: 'ID of the seller (automatically set from authenticated user)' })
  @IsUUID()
  @IsOptional()
  sellerId?: string;

  @ApiPropertyOptional({ 
    description: 'Array of image URLs for the auction item',
    type: [String],
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];
}
