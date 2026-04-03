package com.yonta.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class VerificationStore {

    private static final long TTL_MINUTES = 5;
    private static final long RESEND_COOLDOWN_SECONDS = 60;

    private final ConcurrentHashMap<String, VerificationEntry> store = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LocalDateTime> verifiedEmails = new ConcurrentHashMap<>();

    public void save(String email, String code) {
        store.put(email.toLowerCase(), new VerificationEntry(
                code,
                LocalDateTime.now().plusMinutes(TTL_MINUTES),
                LocalDateTime.now()
        ));
        log.debug("인증 코드 저장: {} (만료: {}분 후)", email, TTL_MINUTES);
    }

    public boolean verify(String email, String code) {
        VerificationEntry entry = store.get(email.toLowerCase());
        if (entry == null) {
            return false;
        }
        if (entry.isExpired()) {
            store.remove(email.toLowerCase());
            return false;
        }
        if (entry.code().equals(code)) {
            store.remove(email.toLowerCase());
            verifiedEmails.put(email.toLowerCase(), LocalDateTime.now().plusMinutes(30));
            return true;
        }
        return false;
    }

    public boolean canResend(String email) {
        VerificationEntry entry = store.get(email.toLowerCase());
        if (entry == null) {
            return true;
        }
        return entry.sentAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isBefore(LocalDateTime.now());
    }

    public boolean hasValidCode(String email) {
        VerificationEntry entry = store.get(email.toLowerCase());
        return entry != null && !entry.isExpired();
    }

    public boolean isVerified(String email) {
        LocalDateTime expiry = verifiedEmails.get(email.toLowerCase());
        if (expiry == null) return false;
        if (LocalDateTime.now().isAfter(expiry)) {
            verifiedEmails.remove(email.toLowerCase());
            return false;
        }
        return true;
    }

    public void clearVerified(String email) {
        verifiedEmails.remove(email.toLowerCase());
    }

    @Scheduled(fixedRate = 60_000)
    public void cleanupExpired() {
        store.entrySet().removeIf(e -> e.getValue().isExpired());
        verifiedEmails.entrySet().removeIf(e -> LocalDateTime.now().isAfter(e.getValue()));
    }

    private record VerificationEntry(String code, LocalDateTime expiresAt, LocalDateTime sentAt) {
        boolean isExpired() {
            return LocalDateTime.now().isAfter(expiresAt);
        }
    }
}
