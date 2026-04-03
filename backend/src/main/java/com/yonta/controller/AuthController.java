package com.yonta.controller;

import com.yonta.dto.request.EmailSendRequest;
import com.yonta.dto.request.EmailVerifyRequest;
import com.yonta.dto.request.LoginRequest;
import com.yonta.dto.request.SignupRequest;
import com.yonta.dto.response.ApiResponse;
import com.yonta.dto.response.LoginResponse;
import com.yonta.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/send-email")
    public ResponseEntity<ApiResponse<Void>> sendVerification(
            @Valid @RequestBody EmailSendRequest request) {
        authService.sendVerificationCode(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(null, "인증번호가 발송되었습니다."));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Boolean>> verifyEmail(
            @Valid @RequestBody EmailVerifyRequest request) {
        boolean result = authService.verifyCode(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.ok(result, "이메일 인증 성공!"));
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<LoginResponse>> signup(
            @Valid @RequestBody SignupRequest request) {
        LoginResponse response = authService.signup(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "회원가입이 완료되었습니다!"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "로그인 성공!"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse>> getMyInfo(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        LoginResponse response = authService.getMyInfo(token);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
