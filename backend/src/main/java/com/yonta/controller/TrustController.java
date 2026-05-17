package com.yonta.controller;

import com.yonta.dto.request.MemberReviewRequest;
import com.yonta.dto.request.NoShowReportRequest;
import com.yonta.dto.response.*;
import com.yonta.exception.CustomException;
import com.yonta.exception.ErrorCode;
import com.yonta.security.JwtTokenProvider;
import com.yonta.service.TrustService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class TrustController {

    private final TrustService trustService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/api/users/me/dashboard")
    public ResponseEntity<ApiResponse<TrustDashboardResponse>> getDashboard(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.ok(trustService.getDashboard(userId)));
    }

    @PostMapping("/api/parties/{partyId}/member-reviews")
    public ResponseEntity<ApiResponse<MemberReviewResponse>> submitMemberReview(
            @PathVariable Long partyId,
            @Valid @RequestBody MemberReviewRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        MemberReviewResponse result = trustService.submitMemberReview(partyId, userId, request);
        return ResponseEntity.ok(ApiResponse.ok(result, "멤버 평가가 저장되었습니다."));
    }

    @PostMapping("/api/parties/{partyId}/no-show-reports")
    public ResponseEntity<ApiResponse<NoShowReportResponse>> submitNoShowReport(
            @PathVariable Long partyId,
            @Valid @RequestBody NoShowReportRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        NoShowReportResponse result = trustService.submitNoShowReport(partyId, userId, request);
        return ResponseEntity.ok(ApiResponse.ok(result, result.getMessage()));
    }

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new CustomException(ErrorCode.INVALID_AUTH_HEADER);
        }
        String token = authHeader.replace("Bearer ", "");
        if (!jwtTokenProvider.validate(token)) {
            throw new CustomException(ErrorCode.INVALID_AUTH_HEADER);
        }
        return jwtTokenProvider.getUserId(token);
    }
}
