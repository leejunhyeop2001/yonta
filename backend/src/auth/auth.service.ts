import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { haversineDistanceMeters } from '../common/geo';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

export type JwtUserPayload = {
  userId: string;
  email: string;
};

@Injectable()
export class AuthService {
  private readonly otpTtlMinutes: number;
  private readonly otpDebugLog: boolean;
  private readonly mannerNoshowDelta: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.otpTtlMinutes = Number(configService.get('OTP_TTL_MINUTES') ?? 10);
    this.otpDebugLog = String(configService.get('OTP_DEBUG_LOG') ?? 'false').toLowerCase() === 'true';
    this.mannerNoshowDelta = Number(configService.get('MANNER_NOSHOW_DELTA') ?? 20);
    void haversineDistanceMeters; // keep for future arrival/manner integration
    void this.mannerNoshowDelta;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private signAccessToken(user: { id: string; email: string }) {
    return this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        expiresIn: this.configService.get('JWT_EXPIRES_IN') ?? '1d',
      },
    );
  }

  private authResponse(user: { id: string; email: string; passwordHash: string | null }) {
    return {
      accessToken: this.signAccessToken(user),
      hasPassword: Boolean(user.passwordHash),
      requiresPasswordSetup: !user.passwordHash,
    };
  }

  async getAccountStatus(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    return {
      registered: Boolean(user?.verifiedAt),
      hasPassword: Boolean(user?.passwordHash),
    };
  }

  async loginWithPassword(email: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user?.verifiedAt || !user.passwordHash) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    return this.authResponse(user);
  }

  async setPassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.verifiedAt) {
      throw new UnauthorizedException('Email verification required.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return {
      ok: true,
      hasPassword: Boolean(updated.passwordHash),
    };
  }

  async requestOtp(email: string) {
    const normalizedEmail = this.normalizeEmail(email);

    // Invalidate all active (unverified) OTPs for this email.
    await this.prisma.emailOtp.updateMany({
      where: { email: normalizedEmail, verifiedAt: null },
      data: { verifiedAt: new Date() },
    });

    const otp = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + this.otpTtlMinutes * 60 * 1000);

    await this.prisma.emailOtp.create({
      data: {
        email: normalizedEmail,
        otpHash,
        expiresAt,
      },
    });

    if (this.mailService.isConfigured()) {
      try {
        await this.mailService.sendOtpEmail(normalizedEmail, otp);
        const echoLog =
          String(this.configService.get('OTP_ECHO_LOG') ?? 'false').toLowerCase() === 'true';
        if (echoLog) {
          // eslint-disable-next-line no-console
          console.warn(
            `[OTP_ECHO] 메일 발송 요청 완료 — 수신 안 되면 아래 번호 사용: ${normalizedEmail} → ${otp}`,
          );
        }
        return {
          ok: true,
          expiresInSeconds: this.otpTtlMinutes * 60,
          delivery: 'email' as const,
        };
      } catch (e) {
        const msg = (e as Error).message;
        // eslint-disable-next-line no-console
        console.error('[OTP] email send failed:', msg);
        const hint =
          msg.includes('535') || msg.toLowerCase().includes('invalid login')
            ? ' 네이버는 SMTP_PASS에 애플리케이션 비밀번호(16자)·POP3/SMTP 사용 설정을 확인하세요.'
            : '';
        throw new BadRequestException(`인증 메일 발송에 실패했습니다.${hint}`);
      }
    }

    if (this.otpDebugLog) {
      // eslint-disable-next-line no-console
      console.warn(
        `[OTP_DEBUG] 실제 메일은 보내지 않았습니다. backend/.env 에 SMTP_HOST, SMTP_USER, SMTP_PASS 설정 후 OTP_DEBUG_LOG=false 로 두세요.\n` +
          `  → ${normalizedEmail} / ${otp}`,
      );
      return {
        ok: true,
        expiresInSeconds: this.otpTtlMinutes * 60,
        delivery: 'debug' as const,
      };
    }

    throw new BadRequestException(
      'OTP delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env (see .env.example), or OTP_DEBUG_LOG=true for development.',
    );
  }

  async verifyOtp(email: string, otp: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const now = new Date();

    const latestOtp = await this.prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        verifiedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp) {
      throw new BadRequestException('OTP is expired or already used.');
    }

    const isMatch = await bcrypt.compare(otp, latestOtp.otpHash);
    if (!isMatch) {
      throw new BadRequestException('Invalid OTP.');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.emailOtp.update({
        where: { id: latestOtp.id },
        data: { verifiedAt: now },
      });

      const existingUser = await tx.user.findUnique({ where: { email: normalizedEmail } });
      if (!existingUser) {
        return tx.user.create({
          data: {
            email: normalizedEmail,
            verifiedAt: now,
            mannerTemperature: 100,
          },
        });
      }

      return tx.user.update({
        where: { id: existingUser.id },
        data: { verifiedAt: now },
      });
    });

    if (!user.verifiedAt) {
      throw new UnauthorizedException('Email verification failed.');
    }

    return this.authResponse(user);
  }
}

