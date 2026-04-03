package com.yonta.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PartyStatus {

    RECRUITING("모집중"),
    FULL("모집완료"),
    DEPARTED("출발"),
    SETTLED("정산완료");

    private final String displayName;
}
