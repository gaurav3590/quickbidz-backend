import { PartialType } from '@nestjs/mapped-types';
import { CreateBidDto } from './create-bid.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBidDto extends PartialType(CreateBidDto) {
  @ApiPropertyOptional({ 
    description: 'Status of the bid', 
    enum: ['PLACED', 'WINNING', 'OUTBID', 'ACCEPTED', 'REJECTED'],
    example: 'ACCEPTED'
  })
  @IsEnum(['PLACED', 'WINNING', 'OUTBID', 'ACCEPTED', 'REJECTED'])
  @IsOptional()
  status?: string;
}
