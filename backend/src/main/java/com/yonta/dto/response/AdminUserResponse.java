package com.yonta.dto.response;

import com.yonta.domain.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminUserResponse {

    private Long id;
    private String studentId;
    private String name;
    private String email;
    private String gender;
    private double mannerTemp;
    private boolean verified;
    private String role;
    private LocalDateTime createdAt;

    public static AdminUserResponse from(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .studentId(user.getStudentId())
                .name(user.getName())
                .email(user.getEmail())
                .gender(user.getGender().getDisplayName())
                .mannerTemp(user.getMannerTemp())
                .verified(user.isVerified())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
