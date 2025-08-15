import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<Comment> {
    // Check if auction exists
    const auction = await this.prisma.auction.findUnique({
      where: { id: createCommentDto.auctionId },
    });

    if (!auction) {
      throw new NotFoundException(
        `Auction with ID ${createCommentDto.auctionId} not found`,
      );
    }

    // Check if parent comment exists if parentId is provided
    if (createCommentDto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException(
          `Parent comment with ID ${createCommentDto.parentId} not found`,
        );
      }

      // Check if parent comment belongs to the same auction
      if (parentComment.auctionId !== createCommentDto.auctionId) {
        throw new BadRequestException(
          'Parent comment must belong to the same auction',
        );
      }

      // Check if we're not trying to create a nested reply (replies can only be one level deep)
      if (parentComment.parentId) {
        throw new BadRequestException(
          'Cannot reply to a reply. Comments can only be nested one level deep',
        );
      }
    }

    // Create the comment
    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        userId,
        auctionId: createCommentDto.auctionId,
        parentId: createCommentDto.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        auction: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return new Comment(comment);
  }

  async findAll(
    auctionId?: string,
    parentId?: string | null,
    userId?: string,
    page = 1,
    limit = 10,
  ): Promise<{
    comments: Comment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (auctionId !== undefined) {
      where.auctionId = auctionId;
    }

    if (userId !== undefined) {
      where.userId = userId;
    }

    // If parentId is null, get only top-level comments (no parent)
    // If parentId is a string, get only replies to that comment
    // If parentId is undefined, don't filter by parent
    if (parentId === null) {
      where.parentId = null;
    } else if (parentId !== undefined) {
      where.parentId = parentId;
    }

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profileImage: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profileImage: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      comments: comments.map((comment) => new Comment(comment)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        auction: {
          select: {
            id: true,
            title: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return new Comment(comment);
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ): Promise<Comment> {
    const comment = await this.findOne(id);

    // Verify that the user is the comment author
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    // Don't allow changing anything except the content
    if (Object.keys(updateCommentDto).length > 1 || !updateCommentDto.content) {
      throw new BadRequestException('Only comment content can be updated');
    }

    // Update the comment
    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: {
        content: updateCommentDto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        auction: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return new Comment(updatedComment);
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.findOne(id);

    // Verify that the user is the comment author
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete all replies if this is a parent comment
    await this.prisma.comment.deleteMany({
      where: { parentId: id },
    });

    // Delete the comment
    await this.prisma.comment.delete({
      where: { id },
    });
  }

  async findByAuction(
    auctionId: string,
    parentId?: string | null,
    page = 1,
    limit = 10,
  ): Promise<{
    comments: Comment[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findAll(auctionId, parentId, undefined, page, limit);
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    comments: Comment[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findAll(undefined, undefined, userId, page, limit);
  }
}
