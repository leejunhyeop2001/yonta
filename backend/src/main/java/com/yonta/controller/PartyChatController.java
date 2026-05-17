package com.yonta.controller;

import com.yonta.dto.request.ChatMessageRequest;
import com.yonta.dto.response.ApiResponse;
import com.yonta.dto.response.ChatMessageResponse;
import com.yonta.exception.CustomException;
import com.yonta.exception.ErrorCode;
import com.yonta.security.JwtTokenProvider;
import com.yonta.service.PartyChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parties/{partyId}/messages")
@RequiredArgsConstructor
public class PartyChatController {

    private final PartyChatService partyChatService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            @PathVariable Long partyId,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractRequiredUserId(authHeader);
        List<ChatMessageResponse> messages = partyChatService.getMessages(partyId, userId);
        return ResponseEntity.ok(ApiResponse.ok(messages));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @PathVariable Long partyId,
            @Valid @RequestBody ChatMessageRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractRequiredUserId(authHeader);
        ChatMessageResponse sent = partyChatService.sendMessage(partyId, userId, request.getContent());
        return ResponseEntity.ok(ApiResponse.ok(sent));
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
}
