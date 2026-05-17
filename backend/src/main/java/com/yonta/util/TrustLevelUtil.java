package com.yonta.util;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

public final class TrustLevelUtil {

    private TrustLevelUtil() {
    }

    public static TrustLevel resolve(double mannerTemp, Double averageRating) {
        double score = mannerTemp;
        if (averageRating != null && averageRating > 0) {
            score = (mannerTemp * 0.7) + (averageRating * 7.0);
        }
        if (score < 30) return TrustLevel.DANGER;
        if (score < 36) return TrustLevel.WARNING;
        if (score < 40) return TrustLevel.NORMAL;
        if (score < 45) return TrustLevel.GOOD;
        return TrustLevel.EXCELLENT;
    }

    @Getter
    @RequiredArgsConstructor
    public enum TrustLevel {
        DANGER("위험", "text-red-600"),
        WARNING("주의", "text-orange-500"),
        NORMAL("보통", "text-blue-500"),
        GOOD("우수", "text-emerald-600"),
        EXCELLENT("최우수", "text-violet-600");

        private final String label;
        private final String colorClass;
    }
}
