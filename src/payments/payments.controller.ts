import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Payment created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid payment data' })
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @GetUser('id') userId: string,
  ) {
    return this.paymentsService.create(createPaymentDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments with optional filtering' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'auctionId', required: false, description: 'Filter by auction ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by payment status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of payments returned successfully' })
  async findAll(
    @Query('userId') userId?: string,
    @Query('auctionId') auctionId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.findAll(
      userId,
      auctionId,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('user')
  @ApiOperation({ summary: 'Get payments for the authenticated user' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by payment status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of user payments returned successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  async findUserPayments(
    @GetUser('id') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.findAll(
      userId,
      undefined,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('auction/:auctionId')
  @ApiOperation({ summary: 'Get payments for a specific auction' })
  @ApiParam({ name: 'auctionId', description: 'Auction ID', type: String })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by payment status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of auction payments returned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Auction not found' })
  async findAuctionPayments(
    @Param('auctionId', ParseUUIDPipe) auctionId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.findAll(
      undefined,
      auctionId,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Payment not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID', type: String })
  @ApiBody({ type: UpdatePaymentDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid payment data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Payment not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }
}
