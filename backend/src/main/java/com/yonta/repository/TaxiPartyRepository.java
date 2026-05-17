package com.yonta.repository;

import com.yonta.domain.Location;
import com.yonta.domain.PartyStatus;
import com.yonta.domain.TaxiParty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TaxiPartyRepository extends JpaRepository<TaxiParty, Long> {

    List<TaxiParty> findByStatusOrderByDepartureTimeAsc(PartyStatus status);

    List<TaxiParty> findByDepartureAndStatusOrderByDepartureTimeAsc(Location departure, PartyStatus status);

    @Query("SELECT tp FROM TaxiParty tp " +
           "WHERE tp.status = :status " +
           "AND tp.departureTime > :now " +
           "ORDER BY tp.departureTime ASC")
    List<TaxiParty> findAvailableParties(
            @Param("status") PartyStatus status,
            @Param("now") LocalDateTime now);

    @Query("SELECT tp FROM TaxiParty tp " +
           "WHERE tp.departure = :departure " +
           "AND tp.destination = :destination " +
           "AND tp.status = :status " +
           "AND tp.departureTime > :now " +
           "ORDER BY tp.departureTime ASC")
    List<TaxiParty> findByRouteAndStatus(
            @Param("departure") Location departure,
            @Param("destination") Location destination,
            @Param("status") PartyStatus status,
            @Param("now") LocalDateTime now);

    List<TaxiParty> findByHostIdOrderByCreatedAtDesc(Long hostId);

    @Query("SELECT tp FROM TaxiParty tp " +
           "WHERE tp.status IN :statuses " +
           "AND tp.departureTime <= :now")
    List<TaxiParty> findByStatusInAndDepartureTimeBefore(
            @Param("statuses") List<PartyStatus> statuses,
            @Param("now") LocalDateTime now);

    @Query("SELECT tp FROM TaxiParty tp " +
           "WHERE tp.status = :status " +
           "AND tp.departureTime <= :cutoff")
    List<TaxiParty> findByStatusAndDepartureTimeBefore(
            @Param("status") PartyStatus status,
            @Param("cutoff") LocalDateTime cutoff);

    @Query("SELECT tp FROM TaxiParty tp " +
           "WHERE tp.status IN :statuses " +
           "AND tp.departureTime > :from " +
           "AND tp.departureTime <= :to")
    List<TaxiParty> findPartiesDepartingBetween(
            @Param("statuses") List<PartyStatus> statuses,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
