package com.yonta.repository;

import com.yonta.domain.PartyMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartyMessageRepository extends JpaRepository<PartyMessage, Long> {

    List<PartyMessage> findTop50ByTaxiPartyIdOrderByCreatedAtAsc(Long taxiPartyId);
}
