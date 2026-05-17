package com.yonta.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HistoryMemberResponse {

    private final Long userId;
    private final String alias;
    private final boolean reviewedByMe;
    private final boolean noShowReportedByMe;
}
