package com.yonta.controller;

import com.yonta.dto.response.AdminUserResponse;
import com.yonta.dto.response.ApiResponse;
import com.yonta.security.AdminOnly;
import com.yonta.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@AdminOnly
public class AdminUserController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> getAllUsers() {
        List<AdminUserResponse> users = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/users/search")
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> searchUsers(
            @RequestParam String keyword) {
        List<AdminUserResponse> users = adminService.searchUsers(keyword);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStats() {
        Map<String, Long> stats = Map.of(
                "totalUsers", adminService.getTotalUserCount(),
                "verifiedUsers", adminService.getVerifiedUserCount()
        );
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
