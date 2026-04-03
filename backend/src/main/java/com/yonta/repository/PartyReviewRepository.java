package com.yonta.repository;

import com.yonta.domain.PartyReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PartyReviewRepository extends JpaRepository<PartyReview, Long> {

    Optional<PartyReview> findByTaxiPartyIdAndReviewerId(Long taxiPartyId, Long reviewerId);

    boolean existsByTaxiPartyIdAndReviewerId(Long taxiPartyId, Long reviewerId);

    List<PartyReview> findByReviewerIdAndTaxiPartyIdIn(Long reviewerId, List<Long> partyIds);
}
