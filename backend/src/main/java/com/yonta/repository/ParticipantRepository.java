package com.yonta.repository;

import com.yonta.domain.Participant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    List<Participant> findByTaxiPartyId(Long taxiPartyId);

    List<Participant> findByUserId(Long userId);

    Optional<Participant> findByTaxiPartyIdAndUserId(Long taxiPartyId, Long userId);

    boolean existsByTaxiPartyIdAndUserId(Long taxiPartyId, Long userId);
}
