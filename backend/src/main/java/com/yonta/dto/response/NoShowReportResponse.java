package com.yonta.dto.response;

import com.yonta.domain.NoShowReport;
import com.yonta.domain.NoShowReportStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NoShowReportResponse {

    private final Long id;
    private final Long partyId;
    private final Long reportedUserId;
    private final NoShowReportStatus status;
    private final String statusLabel;
    private final String message;
    private final LocalDateTime createdAt;

    public static NoShowReportResponse from(NoShowReport report) {
        String message = report.getStatus() == NoShowReportStatus.CONFIRMED
                ? "노쇼가 확정되었습니다. 해당 사용자의 매너 온도가 하락했습니다."
                : "신고가 접수되었습니다. 다른 파티원 1명의 추가 신고 시 확정됩니다.";
        return NoShowReportResponse.builder()
                .id(report.getId())
                .partyId(report.getTaxiParty().getId())
                .reportedUserId(report.getReportedUser().getId())
                .status(report.getStatus())
                .statusLabel(report.getStatus().getLabel())
                .message(message)
                .createdAt(report.getCreatedAt())
                .build();
    }
}
