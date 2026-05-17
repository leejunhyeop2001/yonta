package com.yonta.service;

import com.yonta.dto.response.ChatMessageResponse;
import com.yonta.dto.response.NotificationResponse;
import com.yonta.dto.response.PartyUpdateEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RealtimeEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishChatMessage(Long partyId, ChatMessageResponse message) {
        messagingTemplate.convertAndSend("/topic/party." + partyId + ".chat", message);
    }

    public void publishPartyUpdate(Long partyId, PartyUpdateEvent event) {
        messagingTemplate.convertAndSend("/topic/party." + partyId + ".update", event);
    }

    public void publishNotification(Long userId, NotificationResponse notification) {
        messagingTemplate.convertAndSendToUser(
                String.valueOf(userId),
                "/queue/notifications",
                notification
        );
    }
}
