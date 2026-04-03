package com.yonta.repository;

import com.yonta.domain.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    List<Participant> findByTaxiPartyId(Long taxiPartyId);

    List<Participant> findByUserId(Long userId);

    Optional<Participant> findByTaxiPartyIdAndUserId(Long taxiPartyId, Long userId);

    boolean existsByTaxiPartyIdAndUserId(Long taxiPartyId, Long userId);

    @Query("SELECT p FROM Participant p " +
           "JOIN FETCH p.taxiParty tp " +
           "WHERE p.user.id = :userId " +
           "AND tp.status IN ('RECRUITING', 'FULL') " +
           "ORDER BY tp.departureTime ASC")
    List<Participant> findActivePartiesByUserId(@Param("userId") Long userId);

    void deleteByTaxiPartyIdAndUserId(Long taxiPartyId, Long userId);
}
