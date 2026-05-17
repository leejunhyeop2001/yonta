import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.headers['x-admin-key'];
    const expected = this.configService.get<string>('ADMIN_API_KEY') ?? 'yonta-admin-2026';
    if (typeof key !== 'string' || key !== expected) {
      throw new UnauthorizedException('Invalid admin key.');
    }
    return true;
  }
}
