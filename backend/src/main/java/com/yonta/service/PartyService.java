package com.yonta.service;

import com.yonta.domain.*;
import com.yonta.dto.request.PartyCreateRequest;
import com.yonta.dto.request.PartyReviewRequest;
import com.yonta.dto.response.PartyHistoryResponse;
import com.yonta.dto.response.PartyResponse;
import com.yonta.exception.CustomException;
import com.yonta.exception.ErrorCode;
import com.yonta.repository.ParticipantRepository;
import com.yonta.repository.PartyReviewRepository;
import com.yonta.repository.TaxiPartyRepository;
import com.yonta.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PartyService {

    private final TaxiPartyRepository taxiPartyRepository;
    private final ParticipantRepository participantRepository;
    private final PartyReviewRepository partyReviewRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<PartyResponse> getAvailableParties(Location departure, Location destination, Long userId) {
        List<TaxiParty> parties = getPartiesByFilter(departure, destination);
        Set<Long> joinedPartyIds = getJoinedPartyIds(userId);
        return parties.stream()
                .map(p -> PartyResponse.from(p, joinedPartyIds.contains(p.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public PartyResponse getPartyDetail(Long partyId, Long userId) {
        TaxiParty party = getParty(partyId);
        List<Participant> participants = participantRepository.findByTaxiPartyId(partyId);
        boolean mine = userId != null && participantRepository.existsByTaxiPartyIdAndUserId(partyId, userId);
        return PartyResponse.from(party, participants, mine);
    }

    @Transactional
    public PartyResponse createParty(PartyCreateRequest request, Long userId) {
        User host = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Location departure = parseLocation(request.getDeparture());
        Location destination = parseLocation(request.getDestination());
        GenderOption genderOption = parseGenderOption(request.getGenderOption());
        LocalDateTime departureTime = parseDepartureTime(request.getDepartureTime());

        validateCreateRequest(departure, destination, departureTime, request.getMaxCount());

        TaxiParty party = TaxiParty.builder()
                .departure(departure)
                .destination(destination)
                .departureTime(departureTime)
                .maxCount(request.getMaxCount())
                .genderOption(genderOption)
                .host(host)
                .build();

        TaxiParty saved = taxiPartyRepository.save(party);
        participantRepository.save(Participant.createHost(saved, host));
        return PartyResponse.from(saved, true);
    }

    @Transactional
    public PartyResponse joinParty(Long partyId, Long userId) {
        TaxiParty party = getParty(partyId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (participantRepository.existsByTaxiPartyIdAndUserId(partyId, userId)) {
            throw new CustomException(ErrorCode.ALREADY_JOINED);
        }
        if (!party.isJoinable()) {
            throw new CustomException(ErrorCode.PARTY_NOT_JOINABLE);
        }

        try {
            party.incrementCount();
        } catch (IllegalStateException e) {
            throw new CustomException(ErrorCode.PARTY_FULL);
        }
        participantRepository.save(Participant.createGuest(party, user));
        return PartyResponse.from(party, true);
    }

    @Transactional
    public PartyResponse leaveParty(Long partyId, Long userId) {
        TaxiParty party = getParty(partyId);

        Participant participant = participantRepository.findByTaxiPartyIdAndUserId(partyId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.PARTY_NOT_JOINABLE));

        if (participant.isHost()) {
            throw new CustomException(ErrorCode.PARTY_HOST_CANNOT_LEAVE);
        }

        participantRepository.delete(participant);
        party.decrementCount();
        return PartyResponse.from(party, false);
    }

    @Transactional(readOnly = true)
    public List<PartyResponse> getMyParties(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<Participant> myParticipants = participantRepository.findByUserId(userId);
        return myParticipants.stream()
                .map(Participant::getTaxiParty)
                .filter(p -> p.getDepartureTime().isAfter(now))
                .sorted(Comparator.comparing(TaxiParty::getDepartureTime))
                .map(p -> PartyResponse.from(p, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PartyHistoryResponse> getMyPartyHistory(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<TaxiParty> pastParties = participantRepository.findByUserId(userId).stream()
                .map(Participant::getTaxiParty)
                .filter(p -> !p.getDepartureTime().isAfter(now))
                .sorted(Comparator.comparing(TaxiParty::getDepartureTime).reversed())
                .toList();

        List<Long> partyIds = pastParties.stream().map(TaxiParty::getId).toList();
        if (partyIds.isEmpty()) {
            return List.of();
        }
        List<PartyReview> reviews = partyReviewRepository.findByReviewerIdAndTaxiPartyIdIn(userId, partyIds);
        var reviewMap = reviews.stream().collect(Collectors.toMap(r -> r.getTaxiParty().getId(), r -> r));

        return pastParties.stream()
                .map(p -> PartyHistoryResponse.from(p, reviewMap.get(p.getId()), true))
                .toList();
    }

    @Transactional
    public PartyHistoryResponse reviewPastParty(Long partyId, Long userId, PartyReviewRequest request) {
        TaxiParty party = getParty(partyId);
        User reviewer = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (!participantRepository.existsByTaxiPartyIdAndUserId(partyId, userId)) {
            throw new CustomException(ErrorCode.PARTY_NOT_JOINABLE);
        }
        if (party.getDepartureTime().isAfter(LocalDateTime.now())) {
            throw new CustomException(ErrorCode.PARTY_REVIEW_NOT_AVAILABLE);
        }
        if (partyReviewRepository.existsByTaxiPartyIdAndReviewerId(partyId, userId)) {
            throw new CustomException(ErrorCode.PARTY_ALREADY_REVIEWED);
        }

        PartyReview review = PartyReview.builder()
                .taxiParty(party)
                .reviewer(reviewer)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();
        PartyReview saved = partyReviewRepository.save(review);
        return PartyHistoryResponse.from(party, saved, true);
    }

    private TaxiParty getParty(Long partyId) {
        return taxiPartyRepository.findById(partyId)
                .orElseThrow(() -> new CustomException(ErrorCode.PARTY_NOT_FOUND));
    }

    private List<TaxiParty> getPartiesByFilter(Location departure, Location destination) {
        LocalDateTime now = LocalDateTime.now();
        if (departure != null && destination != null) {
            return taxiPartyRepository.findByRouteAndStatus(departure, destination, PartyStatus.RECRUITING, now);
        }
        if (departure != null) {
            return taxiPartyRepository.findAvailableParties(PartyStatus.RECRUITING, now).stream()
                    .filter(p -> p.getDeparture() == departure)
                    .toList();
        }
        return taxiPartyRepository.findAvailableParties(PartyStatus.RECRUITING, now);
    }

    private Set<Long> getJoinedPartyIds(Long userId) {
        if (userId == null) {
            return Set.of();
        }
        return participantRepository.findByUserId(userId).stream()
                .map(p -> p.getTaxiParty().getId())
                .collect(Collectors.toSet());
    }

    private void validateCreateRequest(Location departure, Location destination, LocalDateTime departureTime, Integer maxCount) {
        if (departure == destination) {
            throw new CustomException(ErrorCode.SAME_DEPARTURE_DESTINATION);
        }
        if (departureTime.isBefore(LocalDateTime.now())) {
            throw new CustomException(ErrorCode.PAST_DEPARTURE_TIME);
        }
        if (maxCount == null || maxCount < 2 || maxCount > 4) {
            throw new CustomException(ErrorCode.INVALID_MAX_COUNT);
        }
    }

    private Location parseLocation(String value) {
        try {
            return Location.valueOf(value.toUpperCase());
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INVALID_PARTY_OPTION);
        }
    }

    private GenderOption parseGenderOption(String value) {
        try {
            return GenderOption.valueOf(value.toUpperCase());
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INVALID_PARTY_OPTION);
        }
    }

    private LocalDateTime parseDepartureTime(String value) {
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException e) {
            throw new CustomException(ErrorCode.INVALID_TIME_SLOT);
        }
    }
}
