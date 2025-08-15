import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { AuctionsEmailService } from './auctions-email.service';
import { CommonModule } from '../common/common.module';
import { AuctionEventsModule } from '../auction-events/auction-events.module';
// import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [PrismaModule, EmailModule, CommonModule, AuctionEventsModule],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionsEmailService],
  exports: [AuctionsService, AuctionsEmailService],
})
export class AuctionsModule {}
