import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CreateUserFolderDto } from './dto/create-user-folder.dto';
import { UpdateUserFolderDto } from './dto/update-user-folder.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  // Story endpoints
  @Post()
  @ApiOperation({ summary: 'Create a new story' })
  @ApiBody({ type: CreateStoryDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Story created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid story data' })
  async createStory(
    @Body() createStoryDto: CreateStoryDto,
    @GetUser('id') userId: string,
  ) {
    return this.storiesService.createStory(createStoryDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stories with optional filtering' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'userFolderId', required: false, description: 'Filter by folder ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by story status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of stories returned successfully' })
  async findAllStories(
    @Query('userId') userId?: string,
    @Query('userFolderId') userFolderId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.storiesService.findAllStories(
      userId,
      userFolderId,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('user')
  @ApiOperation({ summary: 'Get stories for the authenticated user' })
  @ApiQuery({ name: 'userFolderId', required: false, description: 'Filter by folder ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by story status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of user stories returned successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  async findUserStories(
    @GetUser('id') userId: string,
    @Query('userFolderId') userFolderId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.storiesService.findAllStories(
      userId,
      userFolderId,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get story by ID' })
  @ApiParam({ name: 'id', description: 'Story ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Story found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Story not found' })
  async findOneStory(@Param('id', ParseUUIDPipe) id: string) {
    return this.storiesService.findOneStory(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a story' })
  @ApiParam({ name: 'id', description: 'Story ID', type: String })
  @ApiBody({ type: UpdateStoryDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Story updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid story data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Story not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized to update this story' })
  async updateStory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStoryDto: UpdateStoryDto,
    @GetUser('id') userId: string,
  ) {
    return this.storiesService.updateStory(id, updateStoryDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a story' })
  @ApiParam({ name: 'id', description: 'Story ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Story deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Story not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized to delete this story' })
  async removeStory(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return this.storiesService.removeStory(id, userId);
  }

  // UserFolder endpoints
  @Post('folders')
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiBody({ type: CreateUserFolderDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Folder created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid folder data' })
  async createUserFolder(
    @Body() createUserFolderDto: CreateUserFolderDto,
    @GetUser('id') userId: string,
  ) {
    return this.storiesService.createUserFolder(createUserFolderDto, userId);
  }

  @Get('folders')
  @ApiOperation({ summary: 'Get all folders for the authenticated user' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent folder ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of folders returned successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  async findAllUserFolders(
    @GetUser('id') userId: string,
    @Query('parentId') parentId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.storiesService.findAllUserFolders(
      userId,
      parentId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('folders/:id')
  @ApiOperation({ summary: 'Get folder by ID' })
  @ApiParam({ name: 'id', description: 'Folder ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Folder found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Folder not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized to access this folder' })
  async findOneUserFolder(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return this.storiesService.findOneUserFolder(id, userId);
  }

  @Get('folders/:id/stories')
  @ApiOperation({ summary: 'Get stories in a folder' })
  @ApiParam({ name: 'id', description: 'Folder ID', type: String })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by story status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of stories in folder returned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Folder not found' })
  async findFolderStories(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.storiesService.findAllStories(
      undefined,
      id,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Patch('folders/:id')
  @ApiOperation({ summary: 'Update a folder' })
  @ApiParam({ name: 'id', description: 'Folder ID', type: String })
  @ApiBody({ type: UpdateUserFolderDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Folder updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid folder data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Folder not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized to update this folder' })
  async updateUserFolder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserFolderDto: UpdateUserFolderDto,
    @GetUser('id') userId: string,
  ) {
    return this.storiesService.updateUserFolder(
      id,
      updateUserFolderDto,
      userId,
    );
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Delete a folder' })
  @ApiParam({ name: 'id', description: 'Folder ID', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Folder deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Folder not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized to delete this folder' })
  async removeUserFolder(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return this.storiesService.removeUserFolder(id, userId);
  }
}
