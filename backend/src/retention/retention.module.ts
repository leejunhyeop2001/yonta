import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { RetentionService } from './retention.service';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  providers: [RetentionService],
})
export class RetentionModule {}
