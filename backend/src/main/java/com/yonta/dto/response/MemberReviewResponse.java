package com.yonta.dto.response;

import com.yonta.domain.MemberReview;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MemberReviewResponse {

    private final Long id;
    private final Long partyId;
    private final Long revieweeId;
    private final String reviewerAlias;
    private final int rating;
    private final String comment;
    private final LocalDateTime createdAt;

    public static MemberReviewResponse from(MemberReview review, String reviewerAlias) {
        return MemberReviewResponse.builder()
                .id(review.getId())
                .partyId(review.getTaxiParty().getId())
                .revieweeId(review.getReviewee().getId())
                .reviewerAlias(reviewerAlias)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
