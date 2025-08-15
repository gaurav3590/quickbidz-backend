import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MegaService } from './services/mega.service';

@Module({
  imports: [ConfigModule],
  providers: [MegaService],
  exports: [MegaService],
})
export class CommonModule {}
