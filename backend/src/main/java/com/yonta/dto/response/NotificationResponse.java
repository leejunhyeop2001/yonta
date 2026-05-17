package com.yonta.dto.response;

import com.yonta.domain.NotificationType;
import com.yonta.domain.UserNotification;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponse {

    private final Long id;
    private final NotificationType type;
    private final String title;
    private final String body;
    private final Long partyId;
    private final boolean read;
    private final LocalDateTime createdAt;

    public static NotificationResponse from(UserNotification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .body(notification.getBody())
                .partyId(notification.getTaxiParty() != null ? notification.getTaxiParty().getId() : null)
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
