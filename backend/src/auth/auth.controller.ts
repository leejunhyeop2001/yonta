import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginPasswordDto } from './dto/login-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { AccountStatusQueryDto } from './dto/account-status-query.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtUserPayload } from './auth.service';
import type { Request } from 'express';

type AuthenticatedRequest = Request & { user: JwtUserPayload };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Get('account-status')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60 } })
  accountStatus(@Query() query: AccountStatusQueryDto) {
    return this.authService.getAccountStatus(query.email);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60 } })
  loginWithPassword(@Body() dto: LoginPasswordDto) {
    return this.authService.loginWithPassword(dto.email, dto.password);
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  setPassword(@Req() req: AuthenticatedRequest, @Body() dto: SetPasswordDto) {
    return this.authService.setPassword(req.user.userId, dto.password);
  }
}

