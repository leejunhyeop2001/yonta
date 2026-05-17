import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Gender, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { TrustService } from '../trust/trust.service';
import { JwtUserPayload } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { haversineDistanceMeters } from '../common/geo';
import { PartiesGateway } from './parties.gateway';
import { CreatePartyDto } from './dto/create-party.dto';
import { SearchPartiesQueryDto } from './dto/search-parties-query.dto';
import { ConfirmArrivalDto } from './dto/confirm-arrival.dto';
import { getFixedPlaceById } from '../places/fixed-places';
import { computePerPersonTaxiFare } from '../common/taxi-fare';

function toTimeSlotMs(date: Date, minutes: number) {
  const slotSizeMs = minutes * 60 * 1000;
  return Math.floor(date.getTime() / slotSizeMs) * slotSizeMs;
}

function toTimeSlotDate(date: Date, minutes: number) {
  return new Date(toTimeSlotMs(date, minutes));
}

type PartySummary = {
  partyId: string;
  startTime: Date;
  startTimeSlotMs: number;
  capacity: number;
  currentMembers: number;
  availableSlots: number;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  pickupName: string;
  destinationName: string;
  preferSameGender: boolean;
  preferQuiet: boolean;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
};

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || !local) return '***';
  return `${local.slice(0, 1)}***@${domain}`;
}

function passesPreferenceFilters(
  me: { gender: Gender; prefersQuiet: boolean },
  host: { gender: Gender },
  party: { preferSameGender: boolean; preferQuiet: boolean },
): boolean {
  if (party.preferSameGender) {
    if (me.gender === Gender.UNSPECIFIED || host.gender === Gender.UNSPECIFIED) return false;
    if (me.gender !== host.gender) return false;
  }
  if (party.preferQuiet && !me.prefersQuiet) return false;
  return true;
}

@Injectable()
export class PartiesService {
  private readonly slotMinutes = 10;

  private readonly matchRadiusMeters: number;
  private readonly arrivalWindowMinutes: number;
  private readonly arrivalRadiusMeters: number;
  private readonly mannerNoshowDelta: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly gateway: PartiesGateway,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly trustService: TrustService,
  ) {
    this.matchRadiusMeters = Number(configService.get('MATCH_RADIUS_METERS') ?? 800);
    this.arrivalWindowMinutes = Number(configService.get('ARRIVAL_WINDOW_MINUTES') ?? 5);
    this.arrivalRadiusMeters = Number(configService.get('ARRIVAL_RADIUS_METERS') ?? 50);
    this.mannerNoshowDelta = Number(configService.get('MANNER_NOSHOW_DELTA') ?? 20);
  }

  async createParty(user: JwtUserPayload, dto: CreatePartyDto) {
    await this.trustService.assertActiveUser(user.userId);
    const startTime = dto.startTime;
    const startTimeSlot = toTimeSlotDate(startTime, this.slotMinutes);

    if (startTime.getTime() <= Date.now()) {
      throw new BadRequestException('startTime must be in the future.');
    }

    if (dto.pickupPlaceId === dto.destinationPlaceId) {
      throw new BadRequestException('Pickup and destination must be different places.');
    }

    const pickupPlace = getFixedPlaceById(dto.pickupPlaceId);
    const destPlace = getFixedPlaceById(dto.destinationPlaceId);
    if (!pickupPlace || !destPlace) {
      throw new BadRequestException('Unknown pickup or destination place id.');
    }
    if (pickupPlace.destOnly) {
      throw new BadRequestException('이 장소는 출발지로 선택할 수 없습니다.');
    }
    if (destPlace.pickupOnly) {
      throw new BadRequestException('이 장소는 도착지로 선택할 수 없습니다.');
    }

    const party = await this.prisma.$transaction(async (tx) => {
      const created = await tx.party.create({
        data: {
          hostId: user.userId,
          startTimeSlot,
          startTime,
          pickupLat: pickupPlace.lat,
          pickupLng: pickupPlace.lng,
          destinationLat: destPlace.lat,
          destinationLng: destPlace.lng,
          pickupName: pickupPlace.label,
          destinationName: destPlace.label,
          capacity: dto.capacity,
          preferSameGender: dto.preferSameGender ?? false,
          preferQuiet: dto.preferQuiet ?? false,
        },
      });

      await tx.partyMember.create({
        data: {
          partyId: created.id,
          userId: user.userId,
          role: 'HOST',
          joinedAt: new Date(),
          arrivalStatus: 'PENDING',
        },
      });

      return created;
    });

    const currentMembers = await this.prisma.partyMember.count({
      where: { partyId: party.id, leftAt: null },
    });

    this.gateway.notifySlot(
      party.startTimeSlot.getTime(),
      'PARTY_CREATED',
      this.summarizeParty(party, currentMembers),
    );

    return this.summarizeParty(party, currentMembers);
  }

  async searchParties(user: JwtUserPayload, dto: SearchPartiesQueryDto) {
    const me = await this.prisma.user.findUnique({ where: { id: user.userId } });
    if (!me) throw new NotFoundException('User not found.');

    const startTimeSlot = toTimeSlotDate(dto.startTime, this.slotMinutes);
    const pickupLat = dto.pickupLat;
    const pickupLng = dto.pickupLng;
    const destinationLat = dto.destinationLat;
    const destinationLng = dto.destinationLng;

    const candidates = await this.prisma.party.findMany({
      where: {
        status: 'PENDING',
        startTimeSlot,
      },
      include: {
        members: {
          where: { leftAt: null },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const hostIds = [...new Set(candidates.map((c) => c.hostId))];
    const hosts = await this.prisma.user.findMany({
      where: { id: { in: hostIds } },
      select: { id: true, gender: true },
    });
    const hostMap = new Map(hosts.map((h) => [h.id, h]));

    const results: PartySummary[] = [];
    for (const p of candidates) {
      const host = hostMap.get(p.hostId);
      if (!host) continue;
      // 내가 만든 파티는 선호(조용히/동성) 필터로 숨기지 않음 — 프로필과 옵션 불일치 시에도 목록에 보여야 함
      if (p.hostId !== user.userId && !passesPreferenceFilters(me, host, p)) continue;

      const pickupDistance = haversineDistanceMeters(p.pickupLat, p.pickupLng, pickupLat, pickupLng);
      if (pickupDistance > this.matchRadiusMeters) continue;

      const destDistance = haversineDistanceMeters(
        p.destinationLat,
        p.destinationLng,
        destinationLat,
        destinationLng,
      );
      if (destDistance > this.matchRadiusMeters) continue;

      const currentMembers = p.members.length;
      const availableSlots = p.capacity - currentMembers;
      if (availableSlots <= 0) continue;

      results.push(this.summarizeParty(p, currentMembers));
    }

    const limit = dto.limit ?? 20;
    return { parties: results.slice(0, limit) };
  }

  async getMyActiveParties(user: JwtUserPayload) {
    const rows = await this.prisma.partyMember.findMany({
      where: {
        userId: user.userId,
        leftAt: null,
        party: { status: { in: ['PENDING', 'ACTIVE'] } },
      },
      include: {
        party: {
          include: {
            members: {
              where: { leftAt: null },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const parties = rows.map((row) => {
      const p = row.party;
      const currentMembers = p.members.length;
      return {
        ...this.summarizeParty(p, currentMembers),
        role: row.role,
        myArrivalStatus: row.arrivalStatus,
      };
    });

    return { parties };
  }

  async leaveParty(user: JwtUserPayload, partyId: string) {
    const membership = await this.prisma.partyMember.findFirst({
      where: { partyId, userId: user.userId, leftAt: null },
      include: { party: true },
    });

    if (!membership) throw new NotFoundException('You are not an active member of this party.');

    const party = membership.party;
    if (party.status !== 'PENDING' && party.status !== 'ACTIVE') {
      throw new BadRequestException('This party is no longer active.');
    }

    if (party.status === 'ACTIVE') {
      throw new BadRequestException('Cannot leave after the party has departed.');
    }

    if (membership.role === 'HOST') {
      const slotMs = party.startTimeSlot.getTime();
      await this.prisma.$transaction(async (tx) => {
        await tx.party.update({
          where: { id: partyId },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
        await tx.partyMember.updateMany({
          where: { partyId, leftAt: null },
          data: { leftAt: new Date() },
        });
      });

      this.gateway.notifySlot(slotMs, 'PARTY_CANCELLED', { partyId });
      const memberIds = await this.activeMemberIds(partyId);
      await this.notificationsService.notifyPartyMembers(
        partyId,
        memberIds.filter((id) => id !== user.userId),
        NotificationType.PARTY_SETTLED,
        '파티 해산',
        `${party.pickupName} → ${party.destinationName} 파티가 해산되었습니다.`,
      );
      return { ok: true, outcome: 'CANCELLED' as const };
    }

    await this.prisma.partyMember.update({
      where: { id: membership.id },
      data: { leftAt: new Date() },
    });

    const updatedMemberCount = await this.prisma.partyMember.count({
      where: { partyId, leftAt: null },
    });

    this.gateway.notifySlot(
      party.startTimeSlot.getTime(),
      'PARTY_JOINED',
      this.summarizeParty(party, updatedMemberCount),
    );

    await this.notificationsService.notify(
      party.hostId,
      NotificationType.MEMBER_LEFT,
      '멤버 탈퇴',
      '파티에서 멤버가 나갔습니다.',
      partyId,
    );

    return { ok: true, outcome: 'LEFT' as const };
  }

  private async activeMemberIds(partyId: string) {
    const rows = await this.prisma.partyMember.findMany({
      where: { partyId, leftAt: null },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  async getMessages(user: JwtUserPayload, partyId: string, cursor?: string) {
    const party = await this.prisma.party.findUnique({
      where: { id: partyId },
      include: {
        members: {
          where: { leftAt: null },
          select: { userId: true },
        },
      },
    });

    if (!party) throw new NotFoundException('Party not found.');
    const isMember =
      party.hostId === user.userId || party.members.some((m) => m.userId === user.userId);
    if (!isMember) throw new ForbiddenException('Not a member of this party.');

    const take = 50;
    const messages = await this.prisma.partyMessage.findMany({
      where: { partyId },
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: {
          select: { fullName: true, email: true },
        },
      },
    });

    const items = messages
      .slice()
      .reverse()
      .map((m) => ({
        id: m.id,
        userId: m.userId,
        content: m.content,
        createdAt: m.createdAt,
        displayName: m.user.fullName && m.user.fullName.trim().length > 0
          ? m.user.fullName.trim()
          : maskEmail(m.user.email),
      }));

    return {
      messages: items,
      nextCursor: messages.length === take ? messages[messages.length - 1].id : null,
    };
  }

  async postMessage(user: JwtUserPayload, partyId: string, content: string) {
    const trimmed = content.trim();
    if (!trimmed) throw new BadRequestException('Empty message.');

    const party = await this.prisma.party.findUnique({
      where: { id: partyId },
      include: {
        members: {
          where: { leftAt: null },
          select: { userId: true },
        },
      },
    });

    if (!party) throw new NotFoundException('Party not found.');
    if (!['PENDING', 'ACTIVE'].includes(party.status)) {
      throw new BadRequestException('Chat is closed for this party.');
    }

    const isMember =
      party.hostId === user.userId || party.members.some((m) => m.userId === user.userId);
    if (!isMember) throw new ForbiddenException('Not a member of this party.');

    const msg = await this.prisma.partyMessage.create({
      data: {
        partyId,
        userId: user.userId,
        content: trimmed,
      },
    });

    const author = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { fullName: true, email: true },
    });

    return {
      id: msg.id,
      userId: msg.userId,
      content: msg.content,
      createdAt: msg.createdAt,
      displayName:
        author && author.fullName && author.fullName.trim().length > 0
          ? author.fullName.trim()
          : author
          ? maskEmail(author.email)
          : '알 수 없음',
    };
  }

  async getPartyDetail(user: JwtUserPayload, partyId: string) {
    const party = await this.prisma.party.findUnique({
      where: { id: partyId },
      include: {
        host: {
          select: { id: true, email: true, gender: true, mannerTemperature: true },
        },
        members: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, email: true, fullName: true, gender: true } },
          },
        },
      },
    });

    if (!party) throw new NotFoundException('Party not found.');

    const isHost = party.hostId === user.userId;
    const isMember =
      isHost || party.members.some((m) => m.userId === user.userId);

    const currentMembers = party.members.length;
    const { perPersonFare, remainder } = computePerPersonTaxiFare(
      party.totalTaxiFare,
      currentMembers,
    );

    const membersForUi = party.members.map((m) => ({
      userId: m.userId,
      role: m.role,
      arrivalStatus: m.arrivalStatus,
      emailMasked: maskEmail(m.user.email),
      gender: m.user.gender,
      alias:
        m.user.fullName && m.user.fullName.trim().length > 0
          ? m.user.fullName.trim()
          : maskEmail(m.user.email),
      isHost: m.userId === party.hostId || m.role === 'HOST',
    }));

    return {
      partyId: party.id,
      startTime: party.startTime,
      startTimeSlotMs: party.startTimeSlot.getTime(),
      capacity: party.capacity,
      currentMembers,
      availableSlots: party.capacity - currentMembers,
      totalTaxiFare: party.totalTaxiFare,
      perPersonFare,
      taxiFareRemainder: remainder,
      canSetTaxiFare:
        isHost && (party.status === 'PENDING' || party.status === 'ACTIVE'),
      pickupLat: party.pickupLat,
      pickupLng: party.pickupLng,
      destinationLat: party.destinationLat,
      destinationLng: party.destinationLng,
      pickupName: party.pickupName,
      destinationName: party.destinationName,
      preferSameGender: party.preferSameGender,
      preferQuiet: party.preferQuiet,
      status: party.status,
      host: {
        id: party.host.id,
        emailMasked: maskEmail(party.host.email),
        gender: party.host.gender,
        mannerTemperature: party.host.mannerTemperature,
      },
      members: membersForUi.filter((m) => !m.isHost),
      allMembers: membersForUi,
      isHost,
      isMember,
      canJoin: party.status === 'PENDING' && party.capacity > party.members.length && !isMember,
      canLeave: isMember && party.status === 'PENDING' && !isHost,
      canDissolve: isHost && party.status === 'PENDING',
    };
  }

  async setTaxiFare(user: JwtUserPayload, partyId: string, totalTaxiFare: number) {
    const party = await this.prisma.party.findUnique({
      where: { id: partyId },
      include: { members: { where: { leftAt: null } } },
    });
    if (!party) throw new NotFoundException('Party not found.');
    if (party.hostId !== user.userId) {
      throw new ForbiddenException('Only the host can set the taxi fare.');
    }
    if (party.status !== 'PENDING' && party.status !== 'ACTIVE') {
      throw new BadRequestException('Fare can only be set for active parties.');
    }

    const value = totalTaxiFare > 0 ? totalTaxiFare : null;
    const updated = await this.prisma.party.update({
      where: { id: partyId },
      data: { totalTaxiFare: value },
    });

    const memberCount = party.members.length;
    const { perPersonFare, remainder } = computePerPersonTaxiFare(value, memberCount);

    this.gateway.notifySlot(updated.startTimeSlot.getTime(), 'PARTY_FARE_UPDATED', {
      partyId,
      totalTaxiFare: value,
      perPersonFare,
      currentMembers: memberCount,
    });

    return {
      partyId,
      totalTaxiFare: value,
      perPersonFare,
      taxiFareRemainder: remainder,
      currentMembers: memberCount,
    };
  }

  async joinParty(user: JwtUserPayload, partyId: string) {
    await this.trustService.assertActiveUser(user.userId);
    const me = await this.prisma.user.findUnique({ where: { id: user.userId } });
    if (!me) throw new NotFoundException('User not found.');

    const party = await this.prisma.party.findUnique({
      where: { id: partyId },
      include: {
        host: { select: { id: true, gender: true } },
        members: { where: { leftAt: null }, select: { userId: true } },
      },
    });

    if (!party) throw new NotFoundException('Party not found.');
    if (party.status !== 'PENDING') throw new BadRequestException('Cannot join an active party.');

    if (!passesPreferenceFilters(me, party.host, party)) {
      throw new ForbiddenException('You do not match this party preferences (gender / quiet ride).');
    }

    const existing = party.members.find((m) => m.userId === user.userId);
    if (existing) {
      return { ok: true, partyId: party.id };
    }

    const currentMembers = party.members.length;
    if (currentMembers >= party.capacity) {
      throw new BadRequestException('No available slots.');
    }

    await this.prisma.partyMember.create({
      data: {
        partyId: party.id,
        userId: user.userId,
        role: 'MEMBER',
        joinedAt: new Date(),
      },
    });

    const updatedMemberCount = await this.prisma.partyMember.count({
      where: { partyId: party.id, leftAt: null },
    });

    this.gateway.notifySlot(
      party.startTimeSlot.getTime(),
      'PARTY_JOINED',
      this.summarizeParty(party, updatedMemberCount),
    );

    await this.notificationsService.notify(
      party.hostId,
      NotificationType.MEMBER_JOINED,
      '새 멤버 참여',
      '파티에 새 멤버가 참여했습니다.',
      party.id,
    );

    return this.summarizeParty(party, updatedMemberCount);
  }

  async confirmArrival(user: JwtUserPayload, partyId: string, dto: ConfirmArrivalDto) {
    const party = await this.prisma.party.findUnique({
      where: { id: partyId },
      include: {
        members: {
          where: { leftAt: null },
        },
      },
    });

    if (!party) throw new NotFoundException('Party not found.');
    if (party.status !== 'PENDING') throw new BadRequestException('Arrival confirmation is closed.');

    const member = party.members.find((m) => m.userId === user.userId);
    if (!member) throw new BadRequestException('You are not a party member.');
    if (member.arrivalStatus === 'ARRIVED') return { ok: true, partyId, status: 'ARRIVED_ALREADY' };

    const now = new Date();
    const windowStart = new Date(party.startTime.getTime() - this.arrivalWindowMinutes * 60 * 1000);
    if (now < windowStart || now > party.startTime) {
      throw new BadRequestException('Arrival confirmation window is not active.');
    }

    const dist = haversineDistanceMeters(
      party.pickupLat,
      party.pickupLng,
      dto.arrivalLat,
      dto.arrivalLng,
    );
    if (dist > this.arrivalRadiusMeters) {
      throw new BadRequestException(`Arrival must be within ${this.arrivalRadiusMeters} meters.`);
    }

    await this.prisma.partyMember.update({
      where: { id: member.id },
      data: {
        arrivalStatus: 'ARRIVED',
        arrivalConfirmedAt: now,
        arrivalLat: dto.arrivalLat,
        arrivalLng: dto.arrivalLng,
      },
    });

    // Re-read updated status to avoid race conditions in a simple MVP approach.
    const fresh = await this.prisma.party.findUnique({
      where: { id: party.id },
      include: { members: { where: { leftAt: null } } },
    });
    if (!fresh) throw new NotFoundException('Party not found.');

    const arrivedCount = fresh.members.filter((m) => m.arrivalStatus === 'ARRIVED').length;
    const totalMembers = fresh.members.length;
    const threshold = Math.floor(totalMembers / 2) + 1;

    if (arrivedCount >= threshold) {
      const departedAt = new Date();

      await this.prisma.$transaction(async (tx) => {
        await tx.party.update({
          where: { id: fresh.id },
          data: { status: 'ACTIVE', departureAt: departedAt },
        });

        const noshowMembers = await tx.partyMember.findMany({
          where: { partyId: fresh.id, leftAt: null, arrivalStatus: 'PENDING' },
        });

        for (const m of noshowMembers) {
          await tx.partyMember.update({
            where: { id: m.id },
            data: { arrivalStatus: 'NOSHOW', arrivalConfirmedAt: departedAt },
          });

          const currentTemp = (await tx.user.findUnique({ where: { id: m.userId } }))?.mannerTemperature ?? 0;
          const nextTemp = Math.max(0, currentTemp - this.mannerNoshowDelta);

          await tx.user.update({
            where: { id: m.userId },
            data: { mannerTemperature: nextTemp },
          });

          await tx.mannerChangeLog.create({
            data: {
              userId: m.userId,
              partyId: fresh.id,
              delta: -this.mannerNoshowDelta,
              reason: 'NO_SHOW',
            },
          });
        }
      });

      this.gateway.notifySlot(
        fresh.startTimeSlot.getTime(),
        'PARTY_DEPARTED',
        { partyId: fresh.id, departureAt: departedAt.toISOString() },
      );

      const memberIds = fresh.members.map((m) => m.userId);
      await this.notificationsService.notifyPartyMembers(
        fresh.id,
        memberIds,
        NotificationType.PARTY_DEPARTED,
        '택시 출발',
        `${fresh.pickupName} → ${fresh.destinationName} 파티가 출발했습니다.`,
      );

      return { ok: true, partyId: fresh.id, status: 'DEPARTED' };
    }

    return {
      ok: true,
      partyId,
      status: 'ARRIVAL_CONFIRMED',
      arrivedCount,
      totalMembers,
      threshold,
    };
  }

  private summarizeParty(party: any, currentMembers: number): PartySummary {
    const availableSlots = party.capacity - currentMembers;
    return {
      partyId: party.id,
      startTime: party.startTime,
      startTimeSlotMs: party.startTimeSlot.getTime(),
      capacity: party.capacity,
      currentMembers,
      availableSlots,
      pickupLat: party.pickupLat,
      pickupLng: party.pickupLng,
      destinationLat: party.destinationLat,
      destinationLng: party.destinationLng,
      pickupName: typeof party.pickupName === 'string' ? party.pickupName : '',
      destinationName: typeof party.destinationName === 'string' ? party.destinationName : '',
      preferSameGender: Boolean(party.preferSameGender),
      preferQuiet: Boolean(party.preferQuiet),
      status: party.status,
    };
  }
}

