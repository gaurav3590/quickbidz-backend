import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Story } from './entities/story.entity';
import { UserFolder } from './entities/user-folder.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CreateUserFolderDto } from './dto/create-user-folder.dto';
import { UpdateUserFolderDto } from './dto/update-user-folder.dto';

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Story CRUD operations
  async createStory(
    createStoryDto: CreateStoryDto,
    userId: string,
  ): Promise<Story> {
    // If userFolderId is provided, check if folder exists and belongs to the user
    if (createStoryDto.userFolderId) {
      const folder = await this.prisma.userFolder.findUnique({
        where: { id: createStoryDto.userFolderId },
      });

      if (!folder) {
        throw new NotFoundException(
          `Folder with ID ${createStoryDto.userFolderId} not found`,
        );
      }

      if (folder.userId !== userId) {
        throw new ForbiddenException('You can only use your own folders');
      }
    }

    // Create the story
    const story = await this.prisma.story.create({
      data: {
        title: createStoryDto.title,
        content: createStoryDto.content,
        imageUrl: createStoryDto.imageUrl,
        status: createStoryDto.status || 'ACTIVE',
        userId,
        userFolderId: createStoryDto.userFolderId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        userFolder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return new Story(story);
  }

  async findAllStories(
    userId?: string,
    userFolderId?: string,
    status?: string,
    page = 1,
    limit = 10,
  ): Promise<{
    stories: Story[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId !== undefined) {
      where.userId = userId;
    }

    if (userFolderId !== undefined) {
      where.userFolderId = userFolderId;
    }

    if (status !== undefined) {
      where.status = status;
    }

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          userFolder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.story.count({ where }),
    ]);

    return {
      stories: stories.map((story) => new Story(story)),
      total,
      page,
      limit,
    };
  }

  async findOneStory(id: string): Promise<Story> {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        userFolder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    return new Story(story);
  }

  async updateStory(
    id: string,
    updateStoryDto: UpdateStoryDto,
    userId: string,
  ): Promise<Story> {
    // First check if story exists and belongs to the user
    const existingStory = await this.prisma.story.findUnique({
      where: { id },
    });

    if (!existingStory) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    if (existingStory.userId !== userId) {
      throw new ForbiddenException('You can only update your own stories');
    }

    // If userFolderId is provided, check if folder exists and belongs to the user
    if (updateStoryDto.userFolderId) {
      const folder = await this.prisma.userFolder.findUnique({
        where: { id: updateStoryDto.userFolderId },
      });

      if (!folder) {
        throw new NotFoundException(
          `Folder with ID ${updateStoryDto.userFolderId} not found`,
        );
      }

      if (folder.userId !== userId) {
        throw new ForbiddenException('You can only use your own folders');
      }
    }

    // Update the story
    const updatedStory = await this.prisma.story.update({
      where: { id },
      data: {
        title: updateStoryDto.title,
        content: updateStoryDto.content,
        imageUrl: updateStoryDto.imageUrl,
        status: updateStoryDto.status,
        userFolderId: updateStoryDto.userFolderId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        userFolder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return new Story(updatedStory);
  }

  async removeStory(id: string, userId: string): Promise<Story> {
    // First check if story exists and belongs to the user
    const existingStory = await this.prisma.story.findUnique({
      where: { id },
    });

    if (!existingStory) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    if (existingStory.userId !== userId) {
      throw new ForbiddenException('You can only delete your own stories');
    }

    // Instead of hard delete, set status to DELETED
    const deletedStory = await this.prisma.story.update({
      where: { id },
      data: {
        status: 'DELETED',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        userFolder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return new Story(deletedStory);
  }

  // UserFolder CRUD operations
  async createUserFolder(
    createUserFolderDto: CreateUserFolderDto,
    userId: string,
  ): Promise<UserFolder> {
    // If parentId is provided, check if parent folder exists and belongs to the user
    if (createUserFolderDto.parentId) {
      const parentFolder = await this.prisma.userFolder.findUnique({
        where: { id: createUserFolderDto.parentId },
      });

      if (!parentFolder) {
        throw new NotFoundException(
          `Parent folder with ID ${createUserFolderDto.parentId} not found`,
        );
      }

      if (parentFolder.userId !== userId) {
        throw new ForbiddenException(
          'You can only create folders under your own folders',
        );
      }
    }

    // Create the folder
    const folder = await this.prisma.userFolder.create({
      data: {
        name: createUserFolderDto.name,
        userId,
        parentId: createUserFolderDto.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return new UserFolder(folder);
  }

  async findAllUserFolders(
    userId: string,
    parentId?: string,
    page = 1,
    limit = 10,
  ): Promise<{
    folders: UserFolder[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    const [folders, total] = await Promise.all([
      this.prisma.userFolder.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          subfolders: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              stories: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.userFolder.count({ where }),
    ]);

    return {
      folders: folders.map((folder) => new UserFolder(folder)),
      total,
      page,
      limit,
    };
  }

  async findOneUserFolder(id: string, userId: string): Promise<UserFolder> {
    const folder = await this.prisma.userFolder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        subfolders: {
          select: {
            id: true,
            name: true,
          },
        },
        stories: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    // Only allow user to access their own folders
    if (folder.userId !== userId) {
      throw new ForbiddenException('You can only access your own folders');
    }

    return new UserFolder(folder);
  }

  async updateUserFolder(
    id: string,
    updateUserFolderDto: UpdateUserFolderDto,
    userId: string,
  ): Promise<UserFolder> {
    // First check if folder exists and belongs to the user
    const existingFolder = await this.prisma.userFolder.findUnique({
      where: { id },
    });

    if (!existingFolder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    if (existingFolder.userId !== userId) {
      throw new ForbiddenException('You can only update your own folders');
    }

    // If parentId is provided, check if parent folder exists and belongs to the user
    if (updateUserFolderDto.parentId) {
      // Prevent circular references by checking if the new parent is not a descendant of the current folder
      if (updateUserFolderDto.parentId === id) {
        throw new BadRequestException('Folder cannot be its own parent');
      }

      const parentFolder = await this.prisma.userFolder.findUnique({
        where: { id: updateUserFolderDto.parentId },
      });

      if (!parentFolder) {
        throw new NotFoundException(
          `Parent folder with ID ${updateUserFolderDto.parentId} not found`,
        );
      }

      if (parentFolder.userId !== userId) {
        throw new ForbiddenException('You can only use your own folders');
      }

      // More thorough check for circular references would be needed in a real app
    }

    // Update the folder
    const updatedFolder = await this.prisma.userFolder.update({
      where: { id },
      data: {
        name: updateUserFolderDto.name,
        parentId: updateUserFolderDto.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        subfolders: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return new UserFolder(updatedFolder);
  }

  async removeUserFolder(id: string, userId: string): Promise<void> {
    // First check if folder exists and belongs to the user
    const existingFolder = await this.prisma.userFolder.findUnique({
      where: { id },
      include: {
        subfolders: true,
        stories: true,
      },
    });

    if (!existingFolder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    if (existingFolder.userId !== userId) {
      throw new ForbiddenException('You can only delete your own folders');
    }

    // Check if folder has any stories or subfolders
    if (
      existingFolder.stories.length > 0 ||
      existingFolder.subfolders.length > 0
    ) {
      throw new BadRequestException(
        'Cannot delete a folder that contains stories or subfolders',
      );
    }

    // Delete the folder
    await this.prisma.userFolder.delete({
      where: { id },
    });
  }
}
