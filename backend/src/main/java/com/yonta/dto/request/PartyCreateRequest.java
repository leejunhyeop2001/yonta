package com.yonta.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PartyCreateRequest {

    @NotBlank(message = "출발지는 필수입니다.")
    private String departure;

    @NotBlank(message = "목적지는 필수입니다.")
    private String destination;

    @NotBlank(message = "출발 시간은 필수입니다.")
    private String departureTime;

    @NotNull(message = "최대 인원은 필수입니다.")
    @Min(value = 2, message = "최대 인원은 2~4명이어야 합니다.")
    @Max(value = 4, message = "최대 인원은 2~4명이어야 합니다.")
    private Integer maxCount;

    @NotBlank(message = "성별 옵션은 필수입니다.")
    private String genderOption;
}
