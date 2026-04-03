package com.yonta.service;

import com.yonta.domain.User;
import com.yonta.dto.request.LoginRequest;
import com.yonta.dto.request.SignupRequest;
import com.yonta.dto.response.LoginResponse;
import com.yonta.exception.CustomException;
import com.yonta.exception.ErrorCode;
import com.yonta.repository.UserRepository;
import com.yonta.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String YONSEI_DOMAIN = "@yonsei.ac.kr";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final VerificationStore verificationStore;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public void sendVerificationCode(String email) {
        validateYonseiEmail(email);

        if (!verificationStore.canResend(email)) {
            throw new CustomException(ErrorCode.TOO_MANY_REQUESTS);
        }

        String code = generateCode();
        verificationStore.save(email, code);
        emailService.sendVerificationEmail(email, code);

        log.info("인증 코드 발송 완료 → {}", email);
    }

    public boolean verifyCode(String email, String code) {
        validateYonseiEmail(email);

        if (!verificationStore.hasValidCode(email)) {
            throw new CustomException(ErrorCode.VERIFICATION_CODE_EXPIRED);
        }

        boolean matched = verificationStore.verify(email, code);
        if (!matched) {
            throw new CustomException(ErrorCode.VERIFICATION_CODE_MISMATCH);
        }

        log.info("이메일 인증 성공: {}", email);
        return true;
    }

    @Transactional
    public LoginResponse signup(SignupRequest request) {
        validateYonseiEmail(request.getEmail());

        if (!verificationStore.isVerified(request.getEmail())) {
            throw new CustomException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
        }

        if (userRepository.existsByStudentId(request.getStudentId())) {
            throw new CustomException(ErrorCode.DUPLICATE_STUDENT_ID);
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .studentId(request.getStudentId())
                .gender(User.Gender.valueOf(request.getGender().toUpperCase()))
                .build();
        user.verify();

        userRepository.save(user);
        verificationStore.clearVerified(request.getEmail());

        String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole().name());
        log.info("회원가입 완료: {} ({})", user.getName(), user.getEmail());

        return LoginResponse.of(token, user);
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD);
        }

        String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole().name());
        log.info("로그인 성공: {} ({})", user.getName(), user.getEmail());

        return LoginResponse.of(token, user);
    }

    public LoginResponse getMyInfo(String token) {
        Long userId = jwtTokenProvider.getUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return LoginResponse.of(null, user);
    }

    private void validateYonseiEmail(String email) {
        if (email == null || !email.toLowerCase().endsWith(YONSEI_DOMAIN)) {
            throw new CustomException(ErrorCode.INVALID_EMAIL_DOMAIN);
        }
    }

    private String generateCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }
}
