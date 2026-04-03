package com.yonta.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String studentId;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private double mannerTemp;

    @Column(nullable = false)
    private boolean verified;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Role role;

    @Builder
    public User(String studentId, String name, String email, String password, Gender gender) {
        this.studentId = studentId;
        this.name = name;
        this.email = email;
        this.password = password;
        this.gender = gender;
        this.mannerTemp = 36.5;
        this.verified = false;
        this.role = Role.USER;
    }

    public void verify() {
        this.verified = true;
    }

    public void updateMannerTemp(double delta) {
        this.mannerTemp = Math.max(0, Math.min(100, this.mannerTemp + delta));
    }

    public boolean isAdmin() {
        return this.role == Role.ADMIN;
    }

    @Getter
    @RequiredArgsConstructor
    public enum Gender {
        MALE("남성"),
        FEMALE("여성");

        private final String displayName;
    }

    @Getter
    @RequiredArgsConstructor
    public enum Role {
        USER("일반 사용자"),
        ADMIN("관리자");

        private final String displayName;
    }
}
