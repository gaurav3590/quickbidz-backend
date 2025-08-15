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
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
@UseInterceptors(ClassSerializerInterceptor)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notification created successfully', type: Notification })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  create(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications with optional filtering' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'read', required: false, description: 'Filter by read status (true/false)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of notifications returned successfully' })
  findAll(
    @Query('userId', ParseUUIDPipe) userId?: string,
    @Query('read') read?: string,
    @Query('page', new DefaultValuePipe(1)) page?: number,
    @Query('limit', new DefaultValuePipe(10)) limit?: number,
  ) {
    let readBoolean: boolean | undefined;

    if (read === 'true') readBoolean = true;
    else if (read === 'false') readBoolean = false;
    else readBoolean = undefined;

    return this.notificationsService.findAll(userId, readBoolean, page, limit);
  }

  @Get('my-notifications')
  @ApiOperation({ summary: 'Get notifications for the authenticated user' })
  @ApiQuery({ name: 'read', required: false, description: 'Filter by read status (true/false)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of user notifications returned successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  findMyNotifications(
    @GetUser('id') userId: string,
    @Query('read') read?: string,
    @Query('page', new DefaultValuePipe(1)) page?: number,
    @Query('limit', new DefaultValuePipe(10)) limit?: number,
  ) {
    let readBoolean: boolean | undefined;
    if (read === 'true') readBoolean = true;
    else if (read === 'false') readBoolean = false;

    return this.notificationsService.findUserNotifications(
      userId,
      readBoolean,
      page,
      limit,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications for the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Unread count returned successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  getUnreadCount(@GetUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification found', type: Notification })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Notification not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Notification> {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiBody({ type: UpdateNotificationDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification updated successfully', type: Notification })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Notification not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized to update this notification' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @GetUser('id') userId: string,
  ): Promise<Notification> {
    return this.notificationsService.update(id, updateNotificationDto, userId);
  }

  @Patch(':id/mark-as-read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification marked as read', type: Notification })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Notification not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized to update this notification' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('mark-all-as-read')
  @ApiOperation({ summary: 'Mark all notifications as read for the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'All notifications marked as read' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  markAllAsRead(@GetUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Notification not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized to delete this notification' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return this.notificationsService.remove(id, userId);
  }

  @Delete('delete-all-read')
  @ApiOperation({ summary: 'Delete all read notifications for the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'All read notifications deleted' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  deleteAllRead(@GetUser('id') userId: string) {
    return this.notificationsService.deleteAllRead(userId);
  }
}
