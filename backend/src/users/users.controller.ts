import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtUserPayload } from '../auth/auth.service';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TrustService } from '../trust/trust.service';

type AuthenticatedRequest = Request & { user: JwtUserPayload };

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly trustService: TrustService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.getMe(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/dashboard')
  getDashboard(@Req() req: AuthenticatedRequest) {
    return this.trustService.getDashboard(req.user);
  }
}
