package com.yonta.dto.response;

import com.yonta.domain.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
    private String studentId;
    private double mannerTemp;

    public static LoginResponse of(String token, User user) {
        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .studentId(user.getStudentId())
                .mannerTemp(user.getMannerTemp())
                .build();
    }
}
