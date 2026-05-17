package com.yonta.service;

import com.yonta.domain.*;
import com.yonta.dto.response.NotificationResponse;
import com.yonta.exception.CustomException;
import com.yonta.exception.ErrorCode;
import com.yonta.repository.ParticipantRepository;
import com.yonta.repository.UserNotificationRepository;
import com.yonta.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final UserNotificationRepository notificationRepository;
    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final RealtimeEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(Long userId) {
        return notificationRepository.findTop30ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        UserNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOTIFICATION_NOT_FOUND));
        if (!notification.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.NOTIFICATION_NOT_FOUND);
        }
        notification.markRead();
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.findTop30ByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(n -> !n.isRead())
                .forEach(UserNotification::markRead);
    }

    @Transactional
    public void notifyUser(User user, TaxiParty party, NotificationType type, String title, String body) {
        UserNotification saved = notificationRepository.save(
                UserNotification.builder()
                        .user(user)
                        .taxiParty(party)
                        .type(type)
                        .title(title)
                        .body(body)
                        .build()
        );
        eventPublisher.publishNotification(user.getId(), NotificationResponse.from(saved));
    }

    @Transactional
    public void notifyPartyMembers(TaxiParty party, Long excludeUserId, NotificationType type, String title, String body) {
        participantRepository.findByTaxiPartyId(party.getId()).forEach(participant -> {
            User member = participant.getUser();
            if (excludeUserId != null && member.getId().equals(excludeUserId)) {
                return;
            }
            notifyUser(member, party, type, title, body);
        });
    }

    public boolean hasDepartureReminder(Long partyId) {
        return notificationRepository.existsByTaxiPartyIdAndType(partyId, NotificationType.DEPARTURE_SOON);
    }
}
