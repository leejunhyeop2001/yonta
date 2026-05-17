package com.yonta.repository;

import com.yonta.domain.NotificationType;
import com.yonta.domain.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    List<UserNotification> findTop30ByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndReadFalse(Long userId);

    boolean existsByTaxiPartyIdAndType(Long taxiPartyId, NotificationType type);
}
