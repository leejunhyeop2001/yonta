package com.yonta.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NoShowReportStatus {
    PENDING("검토중"),
    CONFIRMED("확정");

    private final String label;
}
