package com.yonta.dto.response;

import com.yonta.domain.PartyMessage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {

    private final Long id;
    private final Long partyId;
    private final Long senderId;
    private final String senderAlias;
    private final String content;
    private final LocalDateTime sentAt;

    public static ChatMessageResponse from(PartyMessage message, String senderAlias) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .partyId(message.getTaxiParty().getId())
                .senderId(message.getSender().getId())
                .senderAlias(senderAlias)
                .content(message.getContent())
                .sentAt(message.getCreatedAt())
                .build();
    }
}
