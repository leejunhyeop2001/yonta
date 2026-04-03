package com.yonta.dto.response;

import com.yonta.domain.PartyReview;
import com.yonta.domain.TaxiParty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PartyHistoryResponse {

    private PartyResponse party;
    private boolean reviewed;
    private Integer myRating;
    private String myComment;
    private LocalDateTime reviewedAt;

    public static PartyHistoryResponse from(TaxiParty party, PartyReview review, boolean mine) {
        return PartyHistoryResponse.builder()
                .party(PartyResponse.from(party, mine))
                .reviewed(review != null)
                .myRating(review != null ? review.getRating() : null)
                .myComment(review != null ? review.getComment() : null)
                .reviewedAt(review != null ? review.getCreatedAt() : null)
                .build();
    }
}
