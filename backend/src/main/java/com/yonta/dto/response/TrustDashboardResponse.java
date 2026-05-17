package com.yonta.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class TrustDashboardResponse {

    private final double mannerTemp;
    private final String trustLevel;
    private final String trustLevelLabel;
    private final Double averageRatingReceived;
    private final long totalReviewsReceived;
    private final long totalPartiesJoined;
    private final int noShowCount;
    private final boolean suspended;
    private final LocalDateTime suspendedUntil;
    private final List<ReceivedReviewResponse> recentReviewsReceived;
    private final List<PartyHistoryResponse> partyHistory;
}
