package com.yonta.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Location {

    WONJU_STATION("원주역"),
    TERMINAL("원주시외버스터미널"),
    HEUNGEOP("흥업"),
    CAMPUS("연세대 미래캠퍼스"),
    WONJU_DOWNTOWN("원주 시내"),
    ENTERPRISE_CITY("기업도시"),
    MUNMAK("문막");

    private final String displayName;
}
