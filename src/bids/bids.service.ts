import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';
import { Bid } from './entities/bid.entity';
import { AuctionEventsService } from '../auction-events/auction-events.service';
import moment from 'moment';

@Injectable()
export class BidsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auctionEventsService: AuctionEventsService,
  ) {}

  async create(createBidDto: CreateBidDto, userId: string): Promise<Bid> {
    // Fetch the auction to check if bidding is allowed
    const auction = await this.prisma.auction.findUnique({
      where: { id: createBidDto.auctionId },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
        },
      },
    });

    if (!auction) {
      throw new NotFoundException(
        `Auction with ID ${createBidDto.auctionId} not found`,
      );
    }

    // Check if the auction is active
    if (auction.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot place bid on auction with status ${auction.status}`,
      );
    }

    // Check if auction end time has passed
    const now = moment();
    const endTime = moment(auction.endTime);
    if (now.isAfter(endTime)) {
      throw new BadRequestException('Auction has ended');
    }

    // Check if the user is trying to bid on their own auction
    if (auction.sellerId === userId) {
      throw new BadRequestException('You cannot bid on your own auction');
    }

    // Check if the bid amount is higher than the current price
    if (createBidDto.amount <= auction.currentPrice) {
      throw new BadRequestException(
        `Bid must be higher than current price: ${auction.currentPrice}`,
      );
    }

    // Start a transaction to handle bid placement
    return this.prisma
      .$transaction(async (prisma) => {
        // Update all previous bids of this user on this auction to 'OUTBID'
        await prisma.bid.updateMany({
          where: {
            auctionId: createBidDto.auctionId,
            bidderId: userId,
            status: 'PLACED',
          },
          data: {
            status: 'OUTBID',
          },
        });

        // Create the new bid
        const newBid = await prisma.bid.create({
          data: {
            amount: createBidDto.amount,
            status: 'PLACED',
            bidderId: userId,
            auctionId: createBidDto.auctionId,
          },
          include: {
            auction: true,
            bidder: {
              select: {
                id: true,
                username: true,
                profileImage: true,
              },
            },
          },
        });

        // Update the auction with the new current price
        await prisma.auction.update({
          where: { id: createBidDto.auctionId },
          data: {
            currentPrice: createBidDto.amount,
            winningBidId: newBid.id,
          },
        });

        // If there was a previous highest bid, update its status to 'OUTBID'
        if (auction.winningBidId) {
          await prisma.bid.update({
            where: { id: auction.winningBidId },
            data: { status: 'OUTBID' },
          });
        }

        // Update the new bid to 'WINNING'
        return await prisma.bid.update({
          where: { id: newBid.id },
          data: { status: 'WINNING' },
          include: {
            auction: true,
            bidder: {
              select: {
                id: true,
                username: true,
                profileImage: true,
              },
            },
          },
        });
      })
      .then((bid) => {
        // Emit the new bid event with bid details
        const bidData = new Bid(bid);
        this.auctionEventsService.emitNewBid(bid.auctionId, {
          id: bid.id,
          amount: bid.amount,
          bidderUsername: bid.bidder.username,
          bidderId: bid.bidderId,
          createdAt: bid.createdAt,
          status: bid.status,
        });
        
        return bidData;
      });
  }

  async findAll(
    auctionId?: string,
    bidderId?: string,
    status?: string,
    page = 1,
    limit = 10,
  ): Promise<{ bids: Bid[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const where = {};

    if (auctionId) {
      where['auctionId'] = auctionId;
    }

    if (bidderId) {
      where['bidderId'] = bidderId;
    }

    if (status) {
      where['status'] = status;
    }

    const [bids, total] = await Promise.all([
      this.prisma.bid.findMany({
        where,
        include: {
          auction: {
            select: {
              id: true,
              title: true,
              currentPrice: true,
              status: true,
            },
          },
          bidder: {
            select: {
              id: true,
              username: true,
              profileImage: true
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { auctionId: 'asc' },
          { amount: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.bid.count({ where }),
    ]);

    return {
      bids: bids.map((bid) => new Bid(bid)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Bid> {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      include: {
        auction: {
          select: {
            id: true,
            title: true,
            currentPrice: true,
            status: true,
            sellerId: true,
          },
        },
        bidder: {
          select: {
            id: true,
            username: true,
            profileImage: true
          },
        },
      },
    });

    if (!bid) {
      throw new NotFoundException(`Bid with ID ${id} not found`);
    }

    return new Bid(bid);
  }

  async update(
    id: string,
    updateBidDto: UpdateBidDto,
    userId: string,
  ): Promise<Bid> {
    // Check if the bid exists
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      include: { auction: true },
    });

    if (!bid) {
      throw new NotFoundException(`Bid with ID ${id} not found`);
    }

    // Check if the user is authorized to update the bid
    if (bid.bidderId !== userId) {
      throw new BadRequestException(
        'You are not authorized to update this bid',
      );
    }

    // Ensure the auction is still active
    if (bid.auction.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot update bid on auction with status ${bid.auction.status}`,
      );
    }

    // Check if auction end time has passed
    const now = moment();
    const endTime = moment(bid.auction.endTime);
    if (now.isAfter(endTime)) {
      throw new BadRequestException('Auction has ended');
    }

    // Update the bid
    const updatedBid = await this.prisma.bid.update({
      where: { id },
      data: updateBidDto,
    });

    return new Bid(updatedBid);
  }

  async remove(id: string, userId: string): Promise<void> {
    // Check if the bid exists
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      include: { auction: true },
    });

    if (!bid) {
      throw new NotFoundException(`Bid with ID ${id} not found`);
    }

    // Check if the user is authorized to delete the bid
    if (bid.bidderId !== userId) {
      throw new BadRequestException(
        'You are not authorized to delete this bid',
      );
    }

    // Ensure the auction is still active
    if (bid.auction.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot delete bid on auction with status ${bid.auction.status}`,
      );
    }

    // Delete the bid
    await this.prisma.bid.delete({ where: { id } });
  }

  async findUserBids(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{ bids: Bid[]; total: number; page: number; limit: number }> {
    return this.findAll(undefined, userId, undefined, page, limit);
  }

  async findAuctionBids(
    auctionId: string,
    page = 1,
    limit = 10,
  ): Promise<{ bids: Bid[]; total: number; page: number; limit: number }> {
    return this.findAll(auctionId, undefined, undefined, page, limit);
  }
}
