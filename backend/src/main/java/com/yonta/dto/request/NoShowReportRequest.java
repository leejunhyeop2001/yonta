package com.yonta.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class NoShowReportRequest {

    @NotNull(message = "신고 대상이 필요합니다.")
    private Long reportedUserId;

    @NotBlank(message = "신고 사유를 입력해주세요.")
    @Size(max = 500, message = "신고 사유는 500자 이하로 입력해주세요.")
    private String reason;
}
