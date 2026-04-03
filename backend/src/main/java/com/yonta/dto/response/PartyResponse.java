package com.yonta.dto.response;

import com.yonta.domain.Participant;
import com.yonta.domain.TaxiParty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.IntStream;

@Getter
@Builder
public class PartyResponse {

    private Long id;
    private String departure;
    private String destination;
    private LocalDateTime departureTime;
    private int currentCount;
    private int maxCount;
    private String genderOption;
    private String status;
    private HostSummary host;
    private List<String> anonymousParticipants;
    private boolean mine;

    @Getter
    @Builder
    public static class HostSummary {
        private Long id;
        private String name;
        private double mannerTemp;
    }

    public static PartyResponse from(TaxiParty party, boolean mine) {
        return PartyResponse.builder()
                .id(party.getId())
                .departure(party.getDeparture().name())
                .destination(party.getDestination().name())
                .departureTime(party.getDepartureTime())
                .currentCount(party.getCurrentCount())
                .maxCount(party.getMaxCount())
                .genderOption(party.getGenderOption().name())
                .status(party.getStatus().name())
                .host(HostSummary.builder()
                        .id(party.getHost().getId())
                        .name(maskName(party.getHost().getName()))
                        .mannerTemp(party.getHost().getMannerTemp())
                        .build())
                .anonymousParticipants(buildAnonymousParticipants(party.getCurrentCount()))
                .mine(mine)
                .build();
    }

    public static PartyResponse from(TaxiParty party, List<Participant> participants, boolean mine) {
        return PartyResponse.builder()
                .id(party.getId())
                .departure(party.getDeparture().name())
                .destination(party.getDestination().name())
                .departureTime(party.getDepartureTime())
                .currentCount(party.getCurrentCount())
                .maxCount(party.getMaxCount())
                .genderOption(party.getGenderOption().name())
                .status(party.getStatus().name())
                .host(HostSummary.builder()
                        .id(party.getHost().getId())
                        .name(maskName(party.getHost().getName()))
                        .mannerTemp(party.getHost().getMannerTemp())
                        .build())
                .anonymousParticipants(buildAnonymousParticipants(participants.size()))
                .mine(mine)
                .build();
    }

    private static List<String> buildAnonymousParticipants(int count) {
        return IntStream.range(0, count)
                .mapToObj(i -> "익명 " + (i + 1))
                .toList();
    }

    private static String maskName(String name) {
        if (name == null || name.isBlank()) {
            return "익명";
        }
        if (name.length() == 1) {
            return name + "*";
        }
        return name.charAt(0) + "*".repeat(name.length() - 1);
    }
}
