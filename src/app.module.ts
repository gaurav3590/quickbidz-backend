import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { AuctionsController } from './auctions/auctions.controller';
import { AuctionsService } from './auctions/auctions.service';
import { AuctionsModule } from './auctions/auctions.module';
import { BidsModule } from './bids/bids.module';
import { CommentsController } from './comments/comments.controller';
import { CommentsService } from './comments/comments.service';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';
import { PaymentsModule } from './payments/payments.module';
import { StoriesModule } from './stories/stories.module';
import { PrismaModule } from './prisma/prisma.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AiModule } from './ai/ai.module';
import { EmailModule } from './email/email.module';
import { CommonModule } from './common/common.module';
import { AuctionEventsModule } from './auction-events/auction-events.module';
import { UploadModule } from './upload/upload.module';
import { CorsMiddleware } from './middleware/cors.middleware';
import { TestController } from './test.controller';
import { HealthController } from './health.controller';
// import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    AuctionsModule,
    BidsModule,
    CommentsModule,
    NotificationsModule,
    PaymentsModule,
    StoriesModule,
    AiModule,
    EmailModule,
    CommonModule,
    AuctionEventsModule,
    UploadModule,
    // FirebaseModule,
  ],
  controllers: [
    AppController,
    AuctionsController,
    CommentsController,
    PaymentsController,
    HealthController,
    TestController,
  ],
  providers: [
    AppService,
    UserService,
    AuctionsService,
    CommentsService,
    PaymentsService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorsMiddleware)
      .forRoutes('*');
  }
}
