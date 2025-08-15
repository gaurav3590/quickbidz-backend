import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createPaymentDto: CreatePaymentDto,
    userId: string,
  ): Promise<Payment> {
    // Check if auction exists
    const auction = await this.prisma.auction.findUnique({
      where: { id: createPaymentDto.auctionId },
    });

    if (!auction) {
      throw new NotFoundException(
        `Auction with ID ${createPaymentDto.auctionId} not found`,
      );
    }

    // If bidId is provided, check if bid exists and belongs to the auction and user
    if (createPaymentDto.bidId) {
      const bid = await this.prisma.bid.findUnique({
        where: { id: createPaymentDto.bidId },
      });

      if (!bid) {
        throw new NotFoundException(
          `Bid with ID ${createPaymentDto.bidId} not found`,
        );
      }

      if (bid.auctionId !== createPaymentDto.auctionId) {
        throw new BadRequestException(
          'Bid does not belong to the specified auction',
        );
      }

      if (bid.bidderId !== userId) {
        throw new ForbiddenException(
          'You can only make payments for your own bids',
        );
      }
    }

    // Create the payment
    const payment = await this.prisma.payment.create({
      data: {
        amount: createPaymentDto.amount,
        status: createPaymentDto.status || 'PENDING',
        paymentMethod: createPaymentDto.paymentMethod,
        userId,
        auctionId: createPaymentDto.auctionId,
        bidId: createPaymentDto.bidId,
        transactionId: createPaymentDto.transactionId,
        gatewayResponse: createPaymentDto.gatewayResponse,
        notes: createPaymentDto.notes,
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
        bid: {
          select: {
            id: true,
            amount: true,
          },
        },
      },
    });

    return new Payment(payment);
  }

  async findAll(
    userId?: string,
    auctionId?: string,
    status?: string,
    page = 1,
    limit = 10,
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId !== undefined) {
      where.userId = userId;
    }

    if (auctionId !== undefined) {
      where.auctionId = auctionId;
    }

    if (status !== undefined) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
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
          bid: {
            select: {
              id: true,
              amount: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments: payments.map((payment) => new Payment(payment)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
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
        bid: {
          select: {
            id: true,
            amount: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return new Payment(payment);
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    // First check if payment exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // Update the payment
    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto,
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
        bid: {
          select: {
            id: true,
            amount: true,
          },
        },
      },
    });

    return new Payment(updatedPayment);
  }

  async remove(id: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    await this.prisma.payment.delete({
      where: { id },
    });
  }
}
