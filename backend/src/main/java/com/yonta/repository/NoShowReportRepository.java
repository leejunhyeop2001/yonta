package com.yonta.repository;

import com.yonta.domain.NoShowReport;
import com.yonta.domain.NoShowReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoShowReportRepository extends JpaRepository<NoShowReport, Long> {

    boolean existsByTaxiPartyIdAndReporterIdAndReportedUserId(Long taxiPartyId, Long reporterId, Long reportedUserId);

    long countByTaxiPartyIdAndReportedUserIdAndStatus(Long taxiPartyId, Long reportedUserId, NoShowReportStatus status);

    List<NoShowReport> findByTaxiPartyIdAndReportedUserId(Long taxiPartyId, Long reportedUserId);

    List<NoShowReport> findByReportedUserIdOrderByCreatedAtDesc(Long reportedUserId);

    Optional<NoShowReport> findByTaxiPartyIdAndReporterIdAndReportedUserId(
            Long taxiPartyId, Long reporterId, Long reportedUserId);
}
