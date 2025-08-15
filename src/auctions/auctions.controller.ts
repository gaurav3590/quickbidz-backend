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
  Put,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
  UploadedFiles,
  BadRequestException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { Auction } from './entities/auction.entity';
import { MegaService } from '../common/services/mega.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('auctions')
@Controller('auctions')
@UseInterceptors(ClassSerializerInterceptor)
export class AuctionsController {
  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly megaService: MegaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new auction' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The auction has been successfully created',
    type: Auction,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateAuctionDto })
  async create(
    @Body() createAuctionDto: CreateAuctionDto,
    @GetUser('id') userId: string,
  ): Promise<Auction> {
    try {
      return this.auctionsService.create(createAuctionDto, userId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create auction: ${error.message}`,
      );
    }
  }

  @Get('getAll')
  @ApiOperation({ summary: 'Get all auctions with optional filtering' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by auction status (PENDING, ACTIVE, ENDED, CANCELLED)',
  })
  @ApiQuery({
    name: 'sellerId',
    required: false,
    description: 'Filter by seller ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of auctions returned successfully',
  })
  findAll(
    @Query('status') status?: string,
    @Query('sellerId') sellerId?: string,
    @Query('page', new DefaultValuePipe(1)) page?: number,
    @Query('limit', new DefaultValuePipe(10)) limit?: number,
  ) {
    return this.auctionsService.findAll(status, sellerId, page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search auctions by term' })
  @ApiQuery({ name: 'term', required: true, description: 'Search term' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results returned successfully',
  })
  search(
    @Query('term') term: string,
    @Query('page', new DefaultValuePipe(1)) page?: number,
    @Query('limit', new DefaultValuePipe(10)) limit?: number,
  ) {
    return this.auctionsService.searchAuctions(term, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get auction by ID' })
  @ApiParam({ name: 'id', description: 'Auction ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auction found',
    type: Auction,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Auction not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Auction> {
    return this.auctionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an auction' })
  @ApiParam({ name: 'id', description: 'Auction ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auction updated successfully',
    type: Auction,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Auction not found',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateAuctionDto })
  @UseInterceptors(FilesInterceptor('images', 5)) // Max 5 images
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAuctionDto: UpdateAuctionDto,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser('id') userId: string,
  ): Promise<Auction> {
    try {
      // Upload files to Mega if any are provided
      if (files && files.length > 0) {
        const imageUrls = await this.megaService.uploadMultipleFiles(files);

        // Add the image URLs to the DTO
        updateAuctionDto.imageUrls = imageUrls;
      }

      return this.auctionsService.update(id, updateAuctionDto, userId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update auction: ${error.message}`,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an auction' })
  @ApiParam({ name: 'id', description: 'Auction ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auction deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Auction not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete auction',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return this.auctionsService.remove(id, userId);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activate an auction' })
  @ApiParam({ name: 'id', description: 'Auction ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auction activated successfully',
    type: Auction,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Auction not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot activate auction',
  })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<Auction> {
    return this.auctionsService.activateAuction(id, userId);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel an auction' })
  @ApiParam({ name: 'id', description: 'Auction ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auction cancelled successfully',
    type: Auction,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Auction not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot cancel auction',
  })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<Auction> {
    return this.auctionsService.cancelAuction(id, userId);
  }
}
