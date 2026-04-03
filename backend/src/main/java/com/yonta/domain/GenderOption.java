package com.yonta.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GenderOption {

    ANY("무관"),
    MALE_ONLY("남성만"),
    FEMALE_ONLY("여성만");

    private final String displayName;
}
