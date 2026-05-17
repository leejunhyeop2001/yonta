import { Module } from '@nestjs/common';
import { TrustModule } from '../trust/trust.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TrustModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
