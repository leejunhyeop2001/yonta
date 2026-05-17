import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TrustService } from './trust.service';

@Module({
  imports: [NotificationsModule],
  providers: [TrustService],
  exports: [TrustService],
})
export class TrustModule {}
