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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('comments')
@Controller('comments')
@UseInterceptors(ClassSerializerInterceptor)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Comment created successfully', type: Comment })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid comment data' })
  create(
    @Body() createCommentDto: CreateCommentDto,
    @GetUser('id') userId: string,
  ): Promise<Comment> {
    return this.commentsService.create(createCommentDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments with optional filtering' })
  @ApiQuery({ name: 'auctionId', required: false, description: 'Filter by auction ID' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent comment ID or "null" for top-level comments' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of comments returned successfully' })
  findAll(
    @Query('auctionId') auctionId?: string,
    @Query('parentId') parentId?: string | 'null',
    @Query('userId') userId?: string,
    @Query('page', new DefaultValuePipe(1)) page?: number,
    @Query('limit', new DefaultValuePipe(10)) limit?: number,
  ) {
    // Handle the special case for top-level comments
    let parentIdValue: string | null | undefined;

    if (parentId === 'null') {
      parentIdValue = null; // Get only top-level comments
    } else if (parentId) {
      parentIdValue = parentId; // Get replies to a specific comment
    }

    return this.commentsService.findAll(
      auctionId,
      parentIdValue,
      userId,
      page,
      limit,
    );
  }

  @Get('auction/:auctionId')
  @ApiOperation({ summary: 'Get comments for a specific auction' })
  @ApiParam({ name: 'auctionId', description: 'Auction ID', type: String })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent comment ID or "null" for top-level comments' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of auction comments returned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Auction not found' })
  findByAuction(
    @Param('auctionId', ParseUUIDPipe) auctionId: string,
    @Query('parentId') parentId?: string | 'null',
    @Query('page', new DefaultValuePipe(1)) page?: number,
    @Query('limit', new DefaultValuePipe(10)) limit?: number,
  ) {
    // Handle the special case for top-level comments
    let parentIdValue: string | null | undefined;

    if (parentId === 'null') {
      parentIdValue = null; // Get only top-level comments
    } else if (parentId) {
      parentIdValue = parentId; // Get replies to a specific comment
    }

    return this.commentsService.findByAuction(
      auctionId,
      parentIdValue,
      page,
      limit,
    );
  }

  @Get('my-comments')
  @ApiOperation({ summary: 'Get comments made by the authenticated user' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of user comments returned successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  findMyComments(
    @GetUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1)) page?: number,
    @Query('limit', new DefaultValuePipe(10)) limit?: number,
  ) {
    return this.commentsService.findByUser(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comment found', type: Comment })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Comment not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Comment> {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID', type: String })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comment updated successfully', type: Comment })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid comment data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Comment not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized to update this comment' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @GetUser('id') userId: string,
  ): Promise<Comment> {
    return this.commentsService.update(id, updateCommentDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comment deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Comment not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized to delete this comment' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return this.commentsService.remove(id, userId);
  }
}
