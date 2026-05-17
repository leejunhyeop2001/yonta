package com.yonta.repository;

import com.yonta.domain.MemberReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MemberReviewRepository extends JpaRepository<MemberReview, Long> {

    boolean existsByTaxiPartyIdAndReviewerIdAndRevieweeId(Long taxiPartyId, Long reviewerId, Long revieweeId);

    List<MemberReview> findByRevieweeIdOrderByCreatedAtDesc(Long revieweeId);

    List<MemberReview> findByReviewerIdAndTaxiPartyId(Long reviewerId, Long taxiPartyId);

    List<MemberReview> findByTaxiPartyIdAndRevieweeId(Long taxiPartyId, Long revieweeId);

    @Query("SELECT AVG(r.rating) FROM MemberReview r WHERE r.reviewee.id = :userId")
    Optional<Double> findAverageRatingByRevieweeId(@Param("userId") Long userId);

    long countByRevieweeId(Long revieweeId);
}
