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
    private List<MemberSummary> members;
    private boolean mine;
    private boolean isHost;

    @Getter
    @Builder
    public static class HostSummary {
        private Long id;
        private String name;
        private double mannerTemp;
    }

    @Getter
    @Builder
    public static class MemberSummary {
        private Long userId;
        private String alias;
        private boolean isHost;
    }

    /** 목록·간단 응답 (멤버 상세 없음) */
    public static PartyResponse from(TaxiParty party, boolean mine) {
        return build(party, null, mine, null);
    }

    /** 상세: 멤버 목록 + 현재 사용자 방장 여부 */
    public static PartyResponse from(TaxiParty party, List<Participant> participants, boolean mine, Long userId) {
        return build(party, participants, mine, userId);
    }

    private static PartyResponse build(TaxiParty party, List<Participant> participants, boolean mine, Long userId) {
        Long hostUserId = party.getHost().getId();
        int count = participants != null ? participants.size() : party.getCurrentCount();

        var b = PartyResponse.builder()
                .id(party.getId())
                .departure(party.getDeparture().name())
                .destination(party.getDestination().name())
                .departureTime(party.getDepartureTime())
                .currentCount(party.getCurrentCount())
                .maxCount(party.getMaxCount())
                .genderOption(party.getGenderOption().name())
                .status(party.getStatus().name())
                .host(HostSummary.builder()
                        .id(hostUserId)
                        .name(maskName(party.getHost().getName()))
                        .mannerTemp(party.getHost().getMannerTemp())
                        .build())
                .anonymousParticipants(buildAnonymousParticipants(count))
                .mine(mine);

        if (participants != null) {
            b.members(buildMembers(participants))
                    .isHost(userId != null && userId.equals(hostUserId));
        } else {
            b.isHost(false);
        }

        return b.build();
    }

    private static List<MemberSummary> buildMembers(List<Participant> participants) {
        return IntStream.range(0, participants.size())
                .mapToObj(i -> {
                    Participant p = participants.get(i);
                    return MemberSummary.builder()
                            .userId(p.getUser().getId())
                            .alias("탑승자 " + (i + 1))
                            .isHost(p.isHost())
                            .build();
                })
                .toList();
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
