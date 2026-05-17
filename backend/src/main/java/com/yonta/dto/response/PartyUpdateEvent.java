package com.yonta.dto.response;

import com.yonta.domain.PartyStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PartyUpdateEvent {

    private final Long partyId;
    private final PartyStatus status;
    private final int currentCount;
    private final int maxCount;
    private final String eventType;

    public static PartyUpdateEvent joined(Long partyId, PartyStatus status, int currentCount, int maxCount) {
        return PartyUpdateEvent.builder()
                .partyId(partyId)
                .status(status)
                .currentCount(currentCount)
                .maxCount(maxCount)
                .eventType("JOINED")
                .build();
    }

    public static PartyUpdateEvent left(Long partyId, PartyStatus status, int currentCount, int maxCount) {
        return PartyUpdateEvent.builder()
                .partyId(partyId)
                .status(status)
                .currentCount(currentCount)
                .maxCount(maxCount)
                .eventType("LEFT")
                .build();
    }

    public static PartyUpdateEvent statusChanged(Long partyId, PartyStatus status, int currentCount, int maxCount) {
        return PartyUpdateEvent.builder()
                .partyId(partyId)
                .status(status)
                .currentCount(currentCount)
                .maxCount(maxCount)
                .eventType("STATUS_CHANGED")
                .build();
    }
}
