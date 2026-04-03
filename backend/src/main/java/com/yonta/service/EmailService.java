package com.yonta.service;

import com.yonta.exception.CustomException;
import com.yonta.exception.ErrorCode;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final boolean smtpEnabled;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.username:}") String mailUsername) {
        this.mailSender = mailSender;
        this.fromAddress = mailUsername;
        this.smtpEnabled = mailUsername != null && !mailUsername.isBlank();

        if (smtpEnabled) {
            log.info("=== 이메일 서비스: SMTP 모드 ({}) ===", mailUsername);
        } else {
            log.warn("=== 이메일 서비스: 콘솔 모드 (MAIL_USERNAME 미설정) ===");
            log.warn("실제 메일 발송을 원하면 --spring.profiles.active=local 로 실행하세요");
        }
    }

    public void sendVerificationEmail(String to, String code) {
        if (!smtpEnabled) {
            printToConsole(to, code);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("[연타] 이메일 인증 번호: " + code);
            helper.setText(buildHtml(code), true);
            mailSender.send(message);
            log.info("인증 메일 발송 완료 → {}", to);
        } catch (MessagingException | MailException e) {
            log.error("SMTP 발송 실패 → {}", to, e);
            throw new CustomException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    private void printToConsole(String to, String code) {
        log.info("╔══════════════════════════════════════╗");
        log.info("║   [연타] 인증 메일 (콘솔 모드)         ║");
        log.info("║   수신자  : {}                        ", to);
        log.info("║   인증번호 : {}                       ", code);
        log.info("║   유효시간 : 5분                       ║");
        log.info("╚══════════════════════════════════════╝");
    }

    private String buildHtml(String code) {
        return """
            <div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
              <div style="background:linear-gradient(135deg,#003876,#0062B8);padding:32px;border-radius:16px 16px 0 0;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:28px;">🚕 연타</h1>
                <p style="color:#B8D4F0;margin:8px 0 0;font-size:14px;">연세 타요 · 택시 합승 플랫폼</p>
              </div>
              <div style="background:#fff;padding:32px;border:1px solid #E5E7EB;border-top:none;">
                <p style="color:#374151;font-size:16px;margin:0 0 8px;">안녕하세요, 연세대학교 재학생님!</p>
                <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">아래 인증 번호를 입력해주세요.</p>
                <div style="background:#F0F7FF;border:2px dashed #003876;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                  <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#003876;">%s</span>
                </div>
                <p style="color:#9CA3AF;font-size:13px;margin:0;text-align:center;">⏱ 이 인증 번호는 <strong>5분간</strong> 유효합니다.</p>
              </div>
              <div style="background:#F9FAFB;padding:16px;border-radius:0 0 16px 16px;border:1px solid #E5E7EB;border-top:none;text-align:center;">
                <p style="color:#9CA3AF;font-size:12px;margin:0;">본인이 요청하지 않으셨다면 이 메일을 무시해주세요.</p>
              </div>
            </div>
            """.formatted(code);
    }
}
