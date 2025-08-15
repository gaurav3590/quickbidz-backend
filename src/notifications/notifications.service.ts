import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createNotificationDto.userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createNotificationDto.userId} not found`,
      );
    }

    // Create the notification
    const notification = await this.prisma.notification.create({
      data: {
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        userId: createNotificationDto.userId,
        data: createNotificationDto.data
          ? createNotificationDto.data
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return new Notification(notification);
  }

  async findAll(
    userId?: string,
    read?: boolean,
    page = 1,
    limit = 10,
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId !== undefined) {
      where.userId = userId;
    }

    if (read !== undefined) {
      where.read = read;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map(
        (notification) => new Notification(notification),
      ),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return new Notification(notification);
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    userId: string,
  ): Promise<Notification> {
    // Check if notification exists
    const notification = await this.findOne(id);

    // Check if user is the recipient of the notification
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only update your own notifications',
      );
    }

    // Only allow updating the read status
    if (
      updateNotificationDto.type ||
      updateNotificationDto.title ||
      updateNotificationDto.message ||
      updateNotificationDto.userId ||
      updateNotificationDto.data
    ) {
      throw new ForbiddenException('Only the read status can be updated');
    }

    // Update the notification
    const updatedNotification = await this.prisma.notification.update({
      where: { id },
      data: { read: updateNotificationDto.read },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return new Notification(updatedNotification);
  }

  async remove(id: string, userId: string): Promise<void> {
    // Check if notification exists
    const notification = await this.findOne(id);

    // Check if user is the recipient of the notification
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own notifications',
      );
    }

    // Delete the notification
    await this.prisma.notification.delete({
      where: { id },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return this.update(id, { read: true }, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async deleteAllRead(userId: string): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: {
        userId,
        read: true,
      },
    });
  }

  async createSystemNotification(
    type: string,
    title: string,
    message: string,
    userId: string,
    data?: any,
  ): Promise<Notification> {
    return this.create({
      type,
      title,
      message,
      userId,
      data,
    });
  }

  async findUserNotifications(
    userId: string,
    read?: boolean,
    page = 1,
    limit = 10,
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findAll(userId, read, page, limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }
}
