import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';
import { Bid } from './entities/bid.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('bids')
@Controller('bids')
@UseInterceptors(ClassSerializerInterceptor)
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new bid' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Bid placed successfully', type: Bid })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid bid data or conditions' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Auction not found' })
  @ApiBody({ type: CreateBidDto })
  create(
    @Body() createBidDto: CreateBidDto,
    @GetUser('id') userId: string,
  ): Promise<Bid> {
    return this.bidsService.create(createBidDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bids with optional filtering' })
  @ApiQuery({ name: 'auctionId', required: false, description: 'Filter by auction ID' })
  @ApiQuery({ name: 'bidderId', required: false, description: 'Filter by bidder ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by bid status (PLACED, WINNING, OUTBID, ACCEPTED, REJECTED)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of bids returned successfully' })
  findAll(
    @Query('auctionId') auctionId?: string,
    @Query('bidderId') bidderId?: string,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1)) page?: number,
    @Query('limit', new DefaultValuePipe(10)) limit?: number,
  ) {
    return this.bidsService.findAll(auctionId, bidderId, status, page, limit);
  }

  @Get('my-bids')
  @ApiOperation({ summary: 'Get bids placed by the authenticated user' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of user bids returned successfully' })
  findMyBids(
    @GetUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1)) page?: number,
    @Query('limit', new DefaultValuePipe(10)) limit?: number,
  ) {
    return this.bidsService.findUserBids(userId, page, limit);
  }

  @Get('auction/:auctionId')
  @ApiOperation({ summary: 'Get all bids for a specific auction' })
  @ApiParam({ name: 'auctionId', description: 'Auction ID', type: String })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of auction bids returned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Auction not found' })
  findAuctionBids(
    @Param('auctionId', ParseUUIDPipe) auctionId: string,
    @Query('page', new DefaultValuePipe(1)) page?: number,
    @Query('limit', new DefaultValuePipe(10)) limit?: number,
  ) {
    return this.bidsService.findAuctionBids(auctionId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bid by ID' })
  @ApiParam({ name: 'id', description: 'Bid ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bid found', type: Bid })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Bid not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Bid> {
    return this.bidsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bid' })
  @ApiParam({ name: 'id', description: 'Bid ID', type: String })
  @ApiBody({ type: UpdateBidDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bid updated successfully', type: Bid })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid bid data or conditions' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Bid not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBidDto: UpdateBidDto,
    @GetUser('id') userId: string,
  ): Promise<Bid> {
    return this.bidsService.update(id, updateBidDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bid' })
  @ApiParam({ name: 'id', description: 'Bid ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bid deleted successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot delete bid' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Bid not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return this.bidsService.remove(id, userId);
  }
}
