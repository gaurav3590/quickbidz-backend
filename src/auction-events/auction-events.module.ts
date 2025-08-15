import { Module } from '@nestjs/common';
import { AuctionEventsGateway } from './auction-events.gateway';
import { AuctionEventsService } from './auction-events.service';

@Module({
  providers: [AuctionEventsGateway, AuctionEventsService],
  exports: [AuctionEventsGateway, AuctionEventsService],
})
export class AuctionEventsModule {} 