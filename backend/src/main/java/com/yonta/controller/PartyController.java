package com.yonta.controller;

import com.yonta.domain.Location;
import com.yonta.dto.request.PartyCreateRequest;
import com.yonta.dto.request.PartyReviewRequest;
import com.yonta.dto.response.ApiResponse;
import com.yonta.dto.response.PartyHistoryResponse;
import com.yonta.dto.response.PartyResponse;
import com.yonta.exception.CustomException;
import com.yonta.exception.ErrorCode;
import com.yonta.security.JwtTokenProvider;
import com.yonta.service.PartyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parties")
@RequiredArgsConstructor
public class PartyController {

    private final PartyService partyService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PartyResponse>>> getAvailableParties(
            @RequestParam(required = false) Location departure,
            @RequestParam(required = false) Location destination,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = extractUserIdOrNull(authHeader);
        List<PartyResponse> parties = partyService.getAvailableParties(departure, destination, userId);
        return ResponseEntity.ok(ApiResponse.ok(parties));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PartyResponse>> getPartyDetail(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = extractUserIdOrNull(authHeader);
        PartyResponse party = partyService.getPartyDetail(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(party));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PartyResponse>> createParty(
            @Valid @RequestBody PartyCreateRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractRequiredUserId(authHeader);
        PartyResponse created = partyService.createParty(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(created, "파티가 생성되었습니다."));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ApiResponse<PartyResponse>> joinParty(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractRequiredUserId(authHeader);
        PartyResponse updated = partyService.joinParty(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(updated, "파티에 참여했습니다."));
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<PartyResponse>> leaveParty(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractRequiredUserId(authHeader);
        PartyResponse updated = partyService.leaveParty(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(updated, "파티에서 나왔습니다."));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<PartyResponse>>> getMyParties(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractRequiredUserId(authHeader);
        List<PartyResponse> parties = partyService.getMyParties(userId);
        return ResponseEntity.ok(ApiResponse.ok(parties));
    }

    @GetMapping("/me/history")
    public ResponseEntity<ApiResponse<List<PartyHistoryResponse>>> getMyPartyHistory(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractRequiredUserId(authHeader);
        List<PartyHistoryResponse> history = partyService.getMyPartyHistory(userId);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<ApiResponse<PartyHistoryResponse>> reviewPastParty(
            @PathVariable Long id,
            @Valid @RequestBody PartyReviewRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractRequiredUserId(authHeader);
        PartyHistoryResponse reviewed = partyService.reviewPastParty(id, userId, request);
        return ResponseEntity.ok(ApiResponse.ok(reviewed, "평가를 저장했습니다."));
    }

    private Long extractRequiredUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new CustomException(ErrorCode.INVALID_AUTH_HEADER);
        }
        String token = authHeader.replace("Bearer ", "");
        if (!jwtTokenProvider.validate(token)) {
            throw new CustomException(ErrorCode.INVALID_AUTH_HEADER);
        }
        return jwtTokenProvider.getUserId(token);
    }

    private Long extractUserIdOrNull(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.replace("Bearer ", "");
        if (!jwtTokenProvider.validate(token)) {
            return null;
        }
        return jwtTokenProvider.getUserId(token);
    }
}
