import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartiesGateway } from '../parties/parties.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PartiesGateway))
    private readonly gateway: PartiesGateway,
  ) {}

  async listForUser(userId: string, limit = 50) {
    return this.prisma.userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async unreadCount(userId: string) {
    return this.prisma.userNotification.count({
      where: { userId, read: false },
    });
  }

  async markRead(userId: string, notificationId: string) {
    await this.prisma.userNotification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.userNotification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { ok: true };
  }

  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    partyId?: string,
  ) {
    const row = await this.prisma.userNotification.create({
      data: { userId, type, title, body, partyId },
    });
    this.gateway.notifyUser(userId, {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      partyId: row.partyId,
      read: row.read,
      createdAt: row.createdAt.toISOString(),
    });
    return row;
  }

  async notifyPartyMembers(
    partyId: string,
    userIds: string[],
    type: NotificationType,
    title: string,
    body: string,
  ) {
    const unique = [...new Set(userIds)];
    await Promise.all(unique.map((uid) => this.notify(uid, type, title, body, partyId)));
  }
}
