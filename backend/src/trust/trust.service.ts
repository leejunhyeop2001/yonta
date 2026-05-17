import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NoShowReportStatus, NotificationType, PartyStatus } from '@prisma/client';
import { JwtUserPayload } from '../auth/auth.service';
import {
  mannerScoreToTemp,
  maskEmail,
  ratingToMannerDelta,
  trustLevelFromScore,
} from '../common/manner';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { MemberReviewDto } from './dto/member-review.dto';
import { NoShowReportDto } from './dto/no-show-report.dto';
import { PartyReviewDto } from './dto/party-review.dto';

@Injectable()
export class TrustService {
  private readonly noshowReportsToConfirm: number;
  private readonly noshowSuspensionCount: number;
  private readonly suspensionDays: number;
  private readonly noshowMannerDelta: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    this.noshowReportsToConfirm = Number(configService.get('NOSHOW_REPORTS_TO_CONFIRM') ?? 2);
    this.noshowSuspensionCount = Number(configService.get('NOSHOW_SUSPENSION_COUNT') ?? 2);
    this.suspensionDays = Number(configService.get('SUSPENSION_DAYS') ?? 7);
    this.noshowMannerDelta = Number(configService.get('MANNER_NOSHOW_DELTA') ?? 20);
  }

  async assertActiveUser(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException('User not found.');
    if (u.suspendedUntil && u.suspendedUntil > new Date()) {
      throw new ForbiddenException('Account is suspended.');
    }
    return u;
  }

  async getDashboard(user: JwtUserPayload) {
    const u = await this.assertActiveUser(user.userId);
    const mannerTemp = mannerScoreToTemp(u.mannerTemperature);
    const trust = trustLevelFromScore(u.mannerTemperature);

    const [reviewsReceived, partiesJoined, noShowCount, recentReviews] = await Promise.all([
      this.prisma.memberReview.findMany({
        where: { revieweeId: user.userId },
        include: { reviewer: { select: { email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.partyMember.count({ where: { userId: user.userId } }),
      this.prisma.noShowReport.count({
        where: { reportedUserId: user.userId, status: NoShowReportStatus.CONFIRMED },
      }),
      this.prisma.memberReview.findMany({
        where: { revieweeId: user.userId },
        include: { reviewer: { select: { email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const avg =
      reviewsReceived.length > 0
        ? reviewsReceived.reduce((s, r) => s + r.rating, 0) / reviewsReceived.length
        : null;

    return {
      mannerTemp,
      trustLevel: trust.level,
      trustLevelLabel: trust.label,
      suspended: Boolean(u.suspendedUntil && u.suspendedUntil > new Date()),
      suspendedUntil: u.suspendedUntil?.toISOString() ?? null,
      totalReviewsReceived: reviewsReceived.length,
      averageRatingReceived: avg,
      totalPartiesJoined: partiesJoined,
      noShowCount,
      recentReviewsReceived: recentReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        reviewerAlias:
          r.reviewer.fullName?.trim() || maskEmail(r.reviewer.email),
      })),
    };
  }

  async getHistoryItems(user: JwtUserPayload) {
    const memberships = await this.prisma.partyMember.findMany({
      where: {
        userId: user.userId,
        party: { status: { in: [PartyStatus.COMPLETED, PartyStatus.CANCELLED] } },
      },
      include: {
        party: {
          include: {
            members: {
              where: { leftAt: null },
              include: { user: { select: { id: true, email: true, fullName: true } } },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: 50,
    });

    const items: Awaited<ReturnType<TrustService['buildHistoryItem']>>[] = [];
    for (const m of memberships) {
      items.push(await this.buildHistoryItem(user.userId, m.party));
    }
    return { items };
  }

  private async buildHistoryItem(viewerId: string, party: {
    id: string;
    hostId: string;
    startTime: Date;
    pickupName: string;
    destinationName: string;
    capacity: number;
    status: PartyStatus;
    members: {
      userId: string;
      role: string;
      user: { id: string; email: string; fullName: string | null };
    }[];
  }) {
    const currentCount = party.members.length;
    const myReview = await this.prisma.partyReview.findUnique({
      where: { partyId_reviewerId: { partyId: party.id, reviewerId: viewerId } },
    });
    const receivedReviews = await this.prisma.memberReview.findMany({
      where: { partyId: party.id, revieweeId: viewerId },
      include: { reviewer: { select: { email: true, fullName: true } } },
    });

    const otherMembers = party.members
      .filter((m) => m.userId !== viewerId)
      .map((m) => {
        const alias = m.user.fullName?.trim() || maskEmail(m.user.email);
        return {
          userId: m.userId,
          alias,
          isHost: m.role === 'HOST',
          reviewedByMe: false,
          noShowReportedByMe: false,
        };
      });

    for (const om of otherMembers) {
      const mr = await this.prisma.memberReview.findUnique({
        where: {
          partyId_reviewerId_revieweeId: {
            partyId: party.id,
            reviewerId: viewerId,
            revieweeId: om.userId,
          },
        },
      });
      om.reviewedByMe = Boolean(mr);
      const ns = await this.prisma.noShowReport.findUnique({
        where: {
          partyId_reporterId_reportedUserId: {
            partyId: party.id,
            reporterId: viewerId,
            reportedUserId: om.userId,
          },
        },
      });
      om.noShowReportedByMe = Boolean(ns);
    }

    return {
      party: {
        id: party.id,
        departureTime: party.startTime.toISOString(),
        pickupName: party.pickupName,
        destinationName: party.destinationName,
        departure: 'CAMPUS',
        destination: 'OTHER',
        currentCount,
        maxCount: party.capacity,
        status: party.status === PartyStatus.COMPLETED ? 'SETTLED' : 'SETTLED',
      },
      reviewed: Boolean(myReview),
      myRating: myReview?.rating ?? null,
      receivedReviews: receivedReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        reviewerAlias:
          r.reviewer.fullName?.trim() || maskEmail(r.reviewer.email),
      })),
      otherMembers,
    };
  }

  async submitPartyReview(user: JwtUserPayload, partyId: string, dto: PartyReviewDto) {
    await this.assertActiveUser(user.userId);
    const party = await this.requireCompletedParty(partyId);
    await this.requireWasMember(user.userId, partyId);

    await this.prisma.partyReview.upsert({
      where: { partyId_reviewerId: { partyId, reviewerId: user.userId } },
      create: {
        partyId,
        reviewerId: user.userId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
      update: {
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
    });

    return { ok: true };
  }

  async submitMemberReview(user: JwtUserPayload, partyId: string, dto: MemberReviewDto) {
    await this.assertActiveUser(user.userId);
    await this.requireCompletedParty(partyId);
    await this.requireWasMember(user.userId, partyId);

    if (dto.revieweeId === user.userId) {
      throw new BadRequestException('Cannot review yourself.');
    }

    const revieweeWasMember = await this.prisma.partyMember.findFirst({
      where: { partyId, userId: dto.revieweeId },
    });
    if (!revieweeWasMember) {
      throw new BadRequestException('Reviewee was not in this party.');
    }

    const delta = ratingToMannerDelta(dto.rating);

    await this.prisma.$transaction(async (tx) => {
      await tx.memberReview.upsert({
        where: {
          partyId_reviewerId_revieweeId: {
            partyId,
            reviewerId: user.userId,
            revieweeId: dto.revieweeId,
          },
        },
        create: {
          partyId,
          reviewerId: user.userId,
          revieweeId: dto.revieweeId,
          rating: dto.rating,
          comment: dto.comment?.trim() || null,
        },
        update: {
          rating: dto.rating,
          comment: dto.comment?.trim() || null,
        },
      });

      const target = await tx.user.findUnique({ where: { id: dto.revieweeId } });
      if (!target) return;
      const next = Math.min(100, Math.max(0, target.mannerTemperature + delta));
      await tx.user.update({
        where: { id: dto.revieweeId },
        data: { mannerTemperature: next },
      });
      await tx.mannerChangeLog.create({
        data: {
          userId: dto.revieweeId,
          partyId,
          delta,
          reason: 'MEMBER_REVIEW',
        },
      });
    });

    return { ok: true };
  }

  async submitNoShowReport(user: JwtUserPayload, partyId: string, dto: NoShowReportDto) {
    await this.assertActiveUser(user.userId);
    const party = await this.requireCompletedParty(partyId);
    await this.requireWasMember(user.userId, partyId);

    if (dto.reportedUserId === user.userId) {
      throw new BadRequestException('Cannot report yourself.');
    }

    const report = await this.prisma.noShowReport.upsert({
      where: {
        partyId_reporterId_reportedUserId: {
          partyId,
          reporterId: user.userId,
          reportedUserId: dto.reportedUserId,
        },
      },
      create: {
        partyId,
        reporterId: user.userId,
        reportedUserId: dto.reportedUserId,
        reason: dto.reason.trim(),
      },
      update: { reason: dto.reason.trim() },
    });

    const confirmedCount = await this.prisma.noShowReport.count({
      where: {
        partyId,
        reportedUserId: dto.reportedUserId,
        status: NoShowReportStatus.CONFIRMED,
      },
    });

    if (report.status === NoShowReportStatus.CONFIRMED) {
      return {
        ok: true,
        message: '이미 확정된 노쇼 신고입니다.',
        status: report.status,
      };
    }

    const pendingDistinct = await this.prisma.noShowReport.count({
      where: {
        partyId,
        reportedUserId: dto.reportedUserId,
        status: NoShowReportStatus.PENDING,
      },
    });

    if (pendingDistinct >= this.noshowReportsToConfirm) {
      await this.confirmNoShow(party, dto.reportedUserId);
      return {
        ok: true,
        message: '노쇼가 확정되었습니다.',
        status: NoShowReportStatus.CONFIRMED,
      };
    }

    return {
      ok: true,
      message: `노쇼 신고가 접수되었습니다. (${pendingDistinct}/${this.noshowReportsToConfirm})`,
      status: NoShowReportStatus.PENDING,
    };
  }

  private async confirmNoShow(
    party: { id: string; pickupName: string; destinationName: string },
    reportedUserId: string,
  ) {
    await this.prisma.noShowReport.updateMany({
      where: {
        partyId: party.id,
        reportedUserId,
        status: NoShowReportStatus.PENDING,
      },
      data: { status: NoShowReportStatus.CONFIRMED },
    });

    await this.prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id: reportedUserId } });
      if (!target) return;
      const next = Math.max(0, target.mannerTemperature - this.noshowMannerDelta);
      await tx.user.update({
        where: { id: reportedUserId },
        data: { mannerTemperature: next },
      });
      await tx.mannerChangeLog.create({
        data: {
          userId: reportedUserId,
          partyId: party.id,
          delta: -this.noshowMannerDelta,
          reason: 'NO_SHOW_REPORT',
        },
      });

      const lifetime = await tx.noShowReport.count({
        where: {
          reportedUserId,
          status: NoShowReportStatus.CONFIRMED,
        },
      });

      if (lifetime >= this.noshowSuspensionCount) {
        const until = new Date();
        until.setDate(until.getDate() + this.suspensionDays);
        await tx.user.update({
          where: { id: reportedUserId },
          data: { suspendedUntil: until },
        });
      }
    });

    await this.notificationsService.notify(
      reportedUserId,
      NotificationType.PARTY_SETTLED,
      '노쇼 확정',
      `${party.pickupName} → ${party.destinationName} 파티에서 노쇼로 확정되었습니다.`,
      party.id,
    );
  }

  async transferHost(user: JwtUserPayload, partyId: string, targetUserId: string) {
    await this.assertActiveUser(user.userId);
    const party = await this.prisma.party.findUnique({
      where: { id: partyId },
      include: {
        members: { where: { leftAt: null } },
      },
    });
    if (!party) throw new NotFoundException('Party not found.');
    if (party.hostId !== user.userId) {
      throw new ForbiddenException('Only the host can transfer ownership.');
    }
    if (party.status !== PartyStatus.PENDING) {
      throw new BadRequestException('Can only transfer host before departure.');
    }

    const target = party.members.find((m) => m.userId === targetUserId && m.leftAt === null);
    if (!target || target.role === 'HOST') {
      throw new BadRequestException('Invalid target member.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.party.update({
        where: { id: partyId },
        data: { hostId: targetUserId },
      });
      await tx.partyMember.updateMany({
        where: { partyId, userId: user.userId },
        data: { role: 'MEMBER' },
      });
      await tx.partyMember.updateMany({
        where: { partyId, userId: targetUserId },
        data: { role: 'HOST' },
      });
    });

    await this.notificationsService.notify(
      targetUserId,
      NotificationType.MEMBER_JOINED,
      '방장 위임',
      '파티 방장으로 지정되었습니다.',
      partyId,
    );

    return { ok: true };
  }

  private async requireCompletedParty(partyId: string) {
    const party = await this.prisma.party.findUnique({ where: { id: partyId } });
    if (!party) throw new NotFoundException('Party not found.');
    if (party.status !== PartyStatus.COMPLETED && party.status !== PartyStatus.CANCELLED) {
      throw new BadRequestException('Party is not finished yet.');
    }
    return party;
  }

  private async requireWasMember(userId: string, partyId: string) {
    const m = await this.prisma.partyMember.findFirst({
      where: { partyId, userId },
    });
    if (!m) throw new ForbiddenException('You were not a member of this party.');
  }
}
