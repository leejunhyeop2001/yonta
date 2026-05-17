import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TrustModule } from '../trust/trust.module';
import { PartiesController } from './parties.controller';
import { PartiesGateway } from './parties.gateway';
import { PartiesService } from './parties.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule, ConfigModule, forwardRef(() => NotificationsModule), TrustModule],
  controllers: [PartiesController],
  providers: [PartiesService, PartiesGateway],
  exports: [PartiesService, PartiesGateway],
})
export class PartiesModule {}

