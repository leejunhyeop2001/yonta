package com.yonta.repository;

import com.yonta.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByStudentId(String studentId);

    boolean existsByEmail(String email);

    boolean existsByStudentId(String studentId);

    long countByVerifiedTrue();

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :kw, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :kw, '%')) OR " +
           "u.studentId LIKE CONCAT('%', :kw, '%') " +
           "ORDER BY u.createdAt DESC")
    List<User> searchByKeyword(@Param("kw") String keyword);
}
