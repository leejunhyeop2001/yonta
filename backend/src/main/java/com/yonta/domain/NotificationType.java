package com.yonta.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationType {
    MEMBER_JOINED("파티 참여"),
    MEMBER_LEFT("파티 탈퇴"),
    DEPARTURE_SOON("출발 임박"),
    PARTY_DEPARTED("출발 완료"),
    PARTY_SETTLED("파티 종료");

    private final String label;
}
