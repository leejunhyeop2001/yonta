import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtUserPayload } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(user: JwtUserPayload) {
    const u = await this.prisma.user.findUnique({ where: { id: user.userId } });
    if (!u) throw new NotFoundException('User not found.');
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      gender: u.gender,
      prefersQuiet: u.prefersQuiet,
      mannerTemperature: u.mannerTemperature,
      verifiedAt: u.verifiedAt,
      hasPassword: Boolean(u.passwordHash),
    };
  }

  async updateMe(user: JwtUserPayload, dto: UpdateProfileDto) {
    const u = await this.prisma.user.update({
      where: { id: user.userId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.prefersQuiet !== undefined && { prefersQuiet: dto.prefersQuiet }),
      },
    });
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      gender: u.gender,
      prefersQuiet: u.prefersQuiet,
      mannerTemperature: u.mannerTemperature,
      verifiedAt: u.verifiedAt,
      hasPassword: Boolean(u.passwordHash),
    };
  }
}
