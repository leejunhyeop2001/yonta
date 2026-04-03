package com.yonta.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PartyReviewRequest {

    @NotNull(message = "평점은 필수입니다.")
    @Min(value = 1, message = "평점은 1~5점이어야 합니다.")
    @Max(value = 5, message = "평점은 1~5점이어야 합니다.")
    private Integer rating;

    @Size(max = 300, message = "평가 메모는 300자 이하로 입력해주세요.")
    private String comment;
}
