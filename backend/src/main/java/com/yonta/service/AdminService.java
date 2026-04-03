package com.yonta.service;

import com.yonta.domain.User;
import com.yonta.dto.response.AdminUserResponse;
import com.yonta.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;

    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(AdminUserResponse::from)
                .toList();
    }

    public List<AdminUserResponse> searchUsers(String keyword) {
        return userRepository.searchByKeyword(keyword).stream()
                .map(AdminUserResponse::from)
                .toList();
    }

    public long getTotalUserCount() {
        return userRepository.count();
    }

    public long getVerifiedUserCount() {
        return userRepository.countByVerifiedTrue();
    }
}
