package com.yonta.controller;

import com.yonta.dto.request.ChatMessageRequest;
import com.yonta.service.PartyChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class PartyChatStompController {

    private final PartyChatService partyChatService;

    @MessageMapping("/party.{partyId}.chat")
    public void sendChatMessage(
            @DestinationVariable Long partyId,
            @Payload ChatMessageRequest request,
            SimpMessageHeaderAccessor headerAccessor) {
        Long userId = extractUserId(headerAccessor);
        partyChatService.sendMessage(partyId, userId, request.getContent());
    }

    private Long extractUserId(SimpMessageHeaderAccessor accessor) {
        if (accessor.getUser() instanceof Authentication auth) {
            return (Long) auth.getPrincipal();
        }
        throw new IllegalArgumentException("인증되지 않은 WebSocket 연결입니다.");
    }
}
