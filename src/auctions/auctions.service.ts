import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { Auction } from './entities/auction.entity';
import { AuctionEventsService } from '../auction-events/auction-events.service';
// import { FirebaseNotificationService } from '../firebase/firebase-notification.service';
import moment from 'moment';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(
    private prisma: PrismaService,
    private auctionEventsService: AuctionEventsService,
    // private firebaseNotificationService: FirebaseNotificationService,
  ) {
    // Initialize the auction timer for active auctions after service is fully initialized
    setTimeout(() => this.initializeAuctionTimers(), 3000);
  }

  // Initialize timers for all active auctions
  private async initializeAuctionTimers() {
    try {
      // Get all active auctions
      const activeAuctions = await this.prisma.auction.findMany({
        where: {
          status: 'ACTIVE',
        },
        select: {
          id: true,
          endTime: true,
        },
      });

      // Set up timers for each active auction
      activeAuctions.forEach((auction) => {
        this.startAuctionTimer(auction.id, auction.endTime);
      });

      this.logger.log(
        `Initialized timers for ${activeAuctions.length} active auctions`,
      );
    } catch (error) {
      this.logger.error(`Error initializing auction timers: ${error.message}`);
    }
  }

  // Start a timer for a specific auction
  private startAuctionTimer(auctionId: string, endTime: Date) {
    const interval = setInterval(async () => {
      try {
        const now = moment();
        const auctionEndTime = moment(endTime);
        const timeRemaining = auctionEndTime.diff(now, 'milliseconds');

        // If auction has ended
        if (timeRemaining <= 0) {
          clearInterval(interval);
          await this.endAuction(auctionId);
          return;
        }

        // Emit time remaining in seconds
        this.auctionEventsService.emitTimeRemaining(
          auctionId,
          Math.floor(timeRemaining / 1000),
        );
      } catch (error) {
        this.logger.error(
          `Error in auction timer for ${auctionId}: ${error.message}`,
        );
        clearInterval(interval);
      }
    }, 5000); // Update every 5 seconds
  }

  // End an auction when its time is up
  private async endAuction(auctionId: string) {
    try {
      const auction = await this.prisma.auction.findUnique({
        where: { id: auctionId },
        include: {
          bids: {
            orderBy: {
              amount: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!auction || auction.status !== 'ACTIVE') {
        return;
      }

      // Update auction status to ENDED
      await this.prisma.auction.update({
        where: { id: auctionId },
        data: {
          status: 'ENDED',
        },
      });

      // Emit auction ended event
      this.auctionEventsService.emitAuctionStatusChange(auctionId, 'ENDED');
    } catch (error) {
      this.logger.error(`Error ending auction ${auctionId}: ${error.message}`);
    }
  }

  async create(
    createAuctionDto: CreateAuctionDto,
    userId: string,
  ): Promise<Auction> {
    // Validate auction dates
    const startTime = moment(createAuctionDto.startTime);
    const endTime = moment(createAuctionDto.endTime);
    const now = moment();

    if (startTime.isBefore(now)) {
      throw new BadRequestException('Start time must be in the future');
    }

    if (endTime.isSameOrBefore(startTime)) {
      throw new BadRequestException('End time must be after start time');
    }

    try {
      // Calculate duration in days if not provided
      let duration = createAuctionDto.duration;
      if (!duration) {
        duration = endTime.diff(startTime, 'days');
      }

      const auction = await this.prisma.auction.create({
        data: {
          ...createAuctionDto,
          sellerId: userId,
          currentPrice: createAuctionDto.startingPrice,
          status: 'PENDING',
          duration: duration > 0 ? duration : 1, // Ensure minimum 1 day duration
        },
      });

      // If the auction is ACTIVE, start the timer
      if (auction.status === 'ACTIVE') {
        this.startAuctionTimer(auction.id, auction.endTime);
      }

      // Send push notification for auction creation
      // try {
      //   await this.firebaseNotificationService.sendNotificationToUser(
      //     userId,
      //     'Auction created',
      //     'Your auction has been created successfully.',
      //     {},
      //   );
      // } catch (error) {
      //   this.logger.error(
      //     `Error sending auction created notification: ${error.message}`,
      //   );
      //   // Continue even if notification fails
      // }

      const newAuction = new Auction(auction);
      return newAuction;
    } catch (error) {
      this.logger.error(`Error creating auction: ${error.message}`);
      throw new BadRequestException('Unable to create auction');
    }
  }

  async findAll(
    status?: string,
    sellerId?: string,
    page = 1,
    limit = 10,
  ): Promise<{
    auctions: Auction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) {
      where['status'] = status;
    }

    if (sellerId) {
      where['sellerId'] = sellerId;
    }

    const [auctions, total] = await Promise.all([
      this.prisma.auction.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
          bids: {
            orderBy: {
              amount: 'desc',
            },
            take: 1,
          },
          _count: {
            select: {
              bids: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.auction.count({ where }),
    ]);

    return {
      auctions: auctions.map((auction) => new Auction(auction)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Auction> {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
        bids: {
          include: {
            bidder: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            amount: 'desc',
          },
        },
        _count: {
          select: {
            bids: true,
            comments: true,
          },
        },
      },
    });

    if (!auction) {
      throw new NotFoundException(`Auction with ID ${id} not found`);
    }

    return new Auction(auction);
  }

  async update(
    id: string,
    updateAuctionDto: UpdateAuctionDto,
    userId?: string,
  ): Promise<Auction> {
    // Verify auction exists
    const auction = await this.findOne(id);

    // If userId provided, ensure the user is the seller
    if (userId && auction.sellerId !== userId) {
      throw new BadRequestException('You can only update your own auctions');
    }

    // Check if auction can be updated
    if (auction.status === 'ENDED' || auction.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot update auction with status ${auction.status}`,
      );
    }

    // Validate date updates if provided
    if (updateAuctionDto.startTime) {
      const startTime = moment(updateAuctionDto.startTime);
      const now = moment();

      if (startTime.isBefore(now)) {
        throw new BadRequestException('Start time must be in the future');
      }
    }

    if (updateAuctionDto.endTime && updateAuctionDto.startTime) {
      const startTime = moment(updateAuctionDto.startTime);
      const endTime = moment(updateAuctionDto.endTime);

      if (endTime.isSameOrBefore(startTime)) {
        throw new BadRequestException('End time must be after start time');
      }
    } else if (updateAuctionDto.endTime) {
      const startTime = moment(auction.startTime);
      const endTime = moment(updateAuctionDto.endTime);

      if (endTime.isSameOrBefore(startTime)) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    // Perform the update
    const updatedAuction = await this.prisma.auction.update({
      where: { id },
      data: {
        title: updateAuctionDto.title,
        description: updateAuctionDto.description,
        category: updateAuctionDto.category,
        condition: updateAuctionDto.condition,
        startTime: updateAuctionDto.startTime,
        endTime: updateAuctionDto.endTime,
        startingPrice: updateAuctionDto.startingPrice,
        reservePrice: updateAuctionDto.reservePrice,
        bidIncrements: updateAuctionDto.bidIncrements,
        duration: updateAuctionDto.duration,
        shippingCost: updateAuctionDto.shippingCost,
        shippingLocations: updateAuctionDto.shippingLocations,
        returnPolicy: updateAuctionDto.returnPolicy,
        termsAccepted: updateAuctionDto.termsAccepted,
        status: updateAuctionDto.status,
        winningBidId: updateAuctionDto.winningBidId,
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    const resultAuction = new Auction(updatedAuction);
    return resultAuction;
  }

  async remove(id: string, userId?: string): Promise<void> {
    // Verify auction exists
    const auction = await this.findOne(id);

    // If userId provided, ensure the user is the seller
    if (userId && auction.sellerId !== userId) {
      throw new BadRequestException('You can only delete your own auctions');
    }

    // Check if auction can be deleted
    if (auction.status === 'ACTIVE' || auction.status === 'ENDED') {
      throw new BadRequestException(
        `Cannot delete auction with status ${auction.status}`,
      );
    }

    await this.prisma.auction.delete({
      where: { id },
    });
  }

  // Additional methods for auction management

  async activateAuction(id: string, userId: string): Promise<Auction> {
    const auction = await this.findOne(id);

    // Ensure the user is the seller
    if (auction.sellerId !== userId) {
      throw new BadRequestException('You can only activate your own auctions');
    }

    // Check if auction can be activated
    if (auction.status !== 'PENDING') {
      throw new BadRequestException('Only pending auctions can be activated');
    }

    // Current time
    const now = moment().toDate();

    // Update auction status to ACTIVE
    const updatedAuction = await this.prisma.auction.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startTime: now,
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Emit auction status change event
    this.auctionEventsService.emitAuctionStatusChange(id, 'ACTIVE');

    // Start the auction timer
    this.startAuctionTimer(id, updatedAuction.endTime);

    // Send push notification for auction start
    // try {
    //   await this.firebaseNotificationService.sendNotificationToUser(
    //     userId,
    //     'Auction started',
    //     'Your auction has been started successfully, Please check the auction details and start bidding',
    //     {},
    //   );
    // } catch (error) {
    //   this.logger.error(
    //     `Error sending auction started notification: ${error.message}`,
    //   );
    // }

    const resultAuction = new Auction(updatedAuction);
    return resultAuction;
  }

  async cancelAuction(id: string, userId: string): Promise<Auction> {
    const auction = await this.findOne(id);

    // Ensure the user is the seller
    if (auction.sellerId !== userId) {
      throw new BadRequestException('You can only cancel your own auctions');
    }

    // Check if auction can be cancelled
    if (auction.status === 'ENDED' || auction.status === 'CANCELLED') {
      throw new BadRequestException(
        `Auction with status ${auction.status} cannot be cancelled`,
      );
    }

    // Update auction status to CANCELLED
    const updatedAuction = await this.prisma.auction.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Emit auction status change event
    this.auctionEventsService.emitAuctionStatusChange(id, 'CANCELLED');

    const resultAuction = new Auction(updatedAuction);
    return resultAuction;
  }

  async searchAuctions(
    searchTerm: string,
    page = 1,
    limit = 10,
  ): Promise<{
    auctions: Auction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [auctions, total] = await Promise.all([
      this.prisma.auction.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          status: {
            not: 'CANCELLED',
          },
        },
        include: {
          seller: {
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
      this.prisma.auction.count({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          status: {
            not: 'CANCELLED',
          },
        },
      }),
    ]);

    return {
      auctions: auctions.map((auction) => new Auction(auction)),
      total,
      page,
      limit,
    };
  }
}
