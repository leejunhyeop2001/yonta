import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

function smtpAuthFailureHint(message: string): string {
  const m = message.toLowerCase();
  if (!m.includes('535') && !m.includes('invalid login') && !m.includes('authentication failed')) {
    return '';
  }
  return (
    '\n  [네이버 535 대응] ' +
    '(1) 웹메일 → 환경설정 → POP3/IMAP 관리 → SMTP 사용 체크 ' +
    '(2) 2단계 인증 사용 중이면 일반 비밀번호가 아니라 「애플리케이션 비밀번호」 16자리를 SMTP_PASS에 입력 ' +
    '(3) SMTP_USER는 전체 이메일(예: id@naver.com) ' +
    '(4) 비밀번호에 # 등 특수문자가 있으면 .env에서 SMTP_PASS="..." 처럼 따옴표로 감싸기 ' +
    '(5) 465 실패 시 SMTP_PORT=587, SMTP_SECURE=false 로 시도'
  );
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const port = Number(this.config.get('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS')?.trim();
    if (host && user && pass) {
      const rawSecure = this.config.get<string>('SMTP_SECURE');
      const secure =
        rawSecure !== undefined && rawSecure !== ''
          ? String(rawSecure).toLowerCase() === 'true'
          : port === 465;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    }
  }

  async onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS')?.trim();
    const debug = String(this.config.get('OTP_DEBUG_LOG') ?? 'false').toLowerCase() === 'true';

    if (!this.transporter) {
      this.logger.warn(
        `SMTP 미설정 — 실제 메일 발송 안 됨 (HOST=${Boolean(host)} USER=${Boolean(user)} PASS=${Boolean(pass)})`,
      );
      if (debug) {
        this.logger.warn(
          'OTP_DEBUG_LOG=true → 인증번호는 서버 터미널에만 출력됩니다. 실제 메일: backend/.env 에 SMTP_* 채우고 OTP_DEBUG_LOG=false',
        );
      }
      return;
    }

    this.logger.log('SMTP 설정됨 — OTP는 메일로 발송됩니다.');
    try {
      await this.transporter.verify();
      this.logger.log('SMTP 서버 연결 검증 성공.');
    } catch (e) {
      const msg = (e as Error).message;
      this.logger.error(`SMTP 연결 검증 실패: ${msg}${smtpAuthFailureHint(msg)}`);
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP is not configured');
    }
    const from = this.config.get<string>('SMTP_FROM')?.trim() ?? 'noreply@yonsei.ac.kr';
    await this.transporter.sendMail({
      from,
      to,
      subject: '[연타] 로그인 인증번호',
      text: `인증번호: ${otp}\n\n10분 이내에 입력해 주세요.\n본인이 요청하지 않았다면 무시하세요.`,
      html: `<p>인증번호: <strong>${otp}</strong></p><p>10분 이내에 입력해 주세요.</p>`,
    });
    this.logger.log(`OTP email queued/sent to ${to}`);
  }
}
