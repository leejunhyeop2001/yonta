package com.yonta.controller;

import com.yonta.dto.response.ApiResponse;
import com.yonta.dto.response.NotificationResponse;
import com.yonta.exception.CustomException;
import com.yonta.exception.ErrorCode;
import com.yonta.security.JwtTokenProvider;
import com.yonta.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractRequiredUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getMyNotifications(userId)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractRequiredUserId(authHeader);
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", count)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractRequiredUserId(authHeader);
        notificationService.markAsRead(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractRequiredUserId(authHeader);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.ok(null));
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
