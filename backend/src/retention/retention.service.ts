import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Remove old OTP rows and completed parties beyond retention (best-effort). */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async runDailyPurge() {
    const otpDays = Number(process.env.OTP_RETENTION_DAYS ?? 7);
    const partyDays = Number(process.env.PARTY_RETENTION_DAYS ?? 90);
    const otpCutoff = new Date(Date.now() - otpDays * 24 * 60 * 60 * 1000);
    const partyCutoff = new Date(Date.now() - partyDays * 24 * 60 * 60 * 1000);

    const otp = await this.prisma.emailOtp.deleteMany({
      where: { createdAt: { lt: otpCutoff } },
    });
    const parties = await this.prisma.party.deleteMany({
      where: {
        status: { in: ['COMPLETED', 'CANCELLED'] },
        departureAt: { not: null, lt: partyCutoff },
      },
    });
    this.logger.log(`Retention: deleted ${otp.count} OTP rows, ${parties.count} old parties`);
  }

  /** 출발 후 일정 시간이 지난 ACTIVE 파티를 COMPLETED 로 전환 */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async autoCompleteParties() {
    const hours = Number(process.env.PARTY_AUTO_COMPLETE_HOURS ?? 3);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const parties = await this.prisma.party.findMany({
      where: {
        status: 'ACTIVE',
        departureAt: { not: null, lt: cutoff },
      },
      include: {
        members: { where: { leftAt: null }, select: { userId: true } },
      },
    });

    for (const p of parties) {
      await this.prisma.party.update({
        where: { id: p.id },
        data: { status: 'COMPLETED' },
      });
      const userIds = p.members.map((m) => m.userId);
      await this.notificationsService.notifyPartyMembers(
        p.id,
        userIds,
        NotificationType.PARTY_SETTLED,
        '파티 종료',
        `${p.pickupName} → ${p.destinationName} 이용이 종료되었습니다. 평가를 남겨주세요.`,
      );
    }

    if (parties.length > 0) {
      this.logger.log(`Auto-completed ${parties.length} parties`);
    }
  }
}
