import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mannerScoreToTemp, maskEmail, studentIdFromEmail } from '../common/manner';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private mapUser(u: {
    id: string;
    email: string;
    fullName: string | null;
    gender: string;
    mannerTemperature: number;
    verifiedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: u.id,
      email: u.email,
      name: u.fullName?.trim() || u.email.split('@')[0],
      studentId: studentIdFromEmail(u.email),
      gender: u.gender,
      mannerTemp: mannerScoreToTemp(u.mannerTemperature),
      verified: Boolean(u.verifiedAt),
      createdAt: u.createdAt.toISOString(),
    };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return users.map((u) => this.mapUser(u));
  }

  async searchUsers(keyword: string) {
    const q = keyword.trim();
    if (!q) return this.listUsers();
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { fullName: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return users.map((u) => this.mapUser(u));
  }

  async stats() {
    const [totalUsers, verifiedUsers, activeParties] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { verifiedAt: { not: null } } }),
      this.prisma.party.count({ where: { status: { in: ['PENDING', 'ACTIVE'] } } }),
    ]);
    return { totalUsers, verifiedUsers, activeParties };
  }
}
