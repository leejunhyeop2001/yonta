package com.yonta.service;

import com.yonta.domain.*;
import com.yonta.dto.request.MemberReviewRequest;
import com.yonta.dto.request.NoShowReportRequest;
import com.yonta.dto.response.*;
import com.yonta.exception.CustomException;
import com.yonta.exception.ErrorCode;
import com.yonta.repository.*;
import com.yonta.util.TrustLevelUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrustService {

    private static final int NO_SHOW_SUSPEND_DAYS = 7;
    private static final int NO_SHOW_CONFIRM_THRESHOLD = 2;

    private final UserRepository userRepository;
    private final TaxiPartyRepository taxiPartyRepository;
    private final ParticipantRepository participantRepository;
    private final PartyReviewRepository partyReviewRepository;
    private final MemberReviewRepository memberReviewRepository;
    private final NoShowReportRepository noShowReportRepository;

    public void ensureUserCanParticipate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (user.isSuspended()) {
            throw new CustomException(ErrorCode.USER_SUSPENDED);
        }
    }

    @Transactional(readOnly = true)
    public TrustDashboardResponse getDashboard(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Double avgRating = memberReviewRepository.findAverageRatingByRevieweeId(userId).orElse(null);
        long reviewCount = memberReviewRepository.countByRevieweeId(userId);
        TrustLevelUtil.TrustLevel level = TrustLevelUtil.resolve(user.getMannerTemp(), avgRating);

        List<ReceivedReviewResponse> recentReviews = memberReviewRepository
                .findByRevieweeIdOrderByCreatedAtDesc(userId).stream()
                .limit(10)
                .map(r -> ReceivedReviewResponse.from(r, "익명 탑승자"))
                .toList();

        List<PartyHistoryResponse> history = buildPartyHistory(userId);

        long joinedCount = participantRepository.findByUserId(userId).size();

        return TrustDashboardResponse.builder()
                .mannerTemp(user.getMannerTemp())
                .trustLevel(level.name())
                .trustLevelLabel(level.getLabel())
                .averageRatingReceived(avgRating)
                .totalReviewsReceived(reviewCount)
                .totalPartiesJoined(joinedCount)
                .noShowCount(user.getNoShowCount())
                .suspended(user.isSuspended())
                .suspendedUntil(user.getSuspendedUntil())
                .recentReviewsReceived(recentReviews)
                .partyHistory(history)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PartyHistoryResponse> buildPartyHistory(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<TaxiParty> pastParties = participantRepository.findByUserId(userId).stream()
                .map(Participant::getTaxiParty)
                .filter(p -> !p.getDepartureTime().isAfter(now))
                .sorted(Comparator.comparing(TaxiParty::getDepartureTime).reversed())
                .toList();

        if (pastParties.isEmpty()) {
            return List.of();
        }

        List<Long> partyIds = pastParties.stream().map(TaxiParty::getId).toList();
        List<PartyReview> myPartyReviews = partyReviewRepository.findByReviewerIdAndTaxiPartyIdIn(userId, partyIds);
        var partyReviewMap = myPartyReviews.stream()
                .collect(Collectors.toMap(r -> r.getTaxiParty().getId(), r -> r));

        return pastParties.stream()
                .map(party -> enrichHistory(party, userId, partyReviewMap.get(party.getId())))
                .toList();
    }

    private PartyHistoryResponse enrichHistory(TaxiParty party, Long userId, PartyReview partyReview) {
        List<Participant> participants = participantRepository.findByTaxiPartyId(party.getId());
        Map<Long, String> aliasMap = buildAliasMap(participants);

        List<MemberReview> myMemberReviews = memberReviewRepository.findByReviewerIdAndTaxiPartyId(userId, party.getId());
        Set<Long> reviewedIds = myMemberReviews.stream()
                .map(r -> r.getReviewee().getId())
                .collect(Collectors.toSet());

        Set<Long> reportedByMe = participants.stream()
                .filter(p -> !p.getUser().getId().equals(userId))
                .filter(p -> noShowReportRepository.existsByTaxiPartyIdAndReporterIdAndReportedUserId(
                        party.getId(), userId, p.getUser().getId()))
                .map(p -> p.getUser().getId())
                .collect(Collectors.toSet());

        List<HistoryMemberResponse> others = participants.stream()
                .filter(p -> !p.getUser().getId().equals(userId))
                .map(p -> HistoryMemberResponse.builder()
                        .userId(p.getUser().getId())
                        .alias(aliasMap.getOrDefault(p.getUser().getId(), "탑승자"))
                        .reviewedByMe(reviewedIds.contains(p.getUser().getId()))
                        .noShowReportedByMe(reportedByMe.contains(p.getUser().getId()))
                        .build())
                .toList();

        List<ReceivedReviewResponse> received = memberReviewRepository
                .findByTaxiPartyIdAndRevieweeId(party.getId(), userId).stream()
                .map(r -> ReceivedReviewResponse.from(r, aliasMap.getOrDefault(r.getReviewer().getId(), "익명")))
                .toList();

        return PartyHistoryResponse.builder()
                .party(PartyResponse.from(party, participants, true, userId))
                .reviewed(partyReview != null)
                .myRating(partyReview != null ? partyReview.getRating() : null)
                .myComment(partyReview != null ? partyReview.getComment() : null)
                .reviewedAt(partyReview != null ? partyReview.getCreatedAt() : null)
                .otherMembers(others)
                .receivedReviews(received)
                .build();
    }

    @Transactional
    public MemberReviewResponse submitMemberReview(Long partyId, Long userId, MemberReviewRequest request) {
        ensurePastPartyMember(partyId, userId);
        ensureUserCanParticipate(userId);

        if (memberReviewRepository.existsByTaxiPartyIdAndReviewerIdAndRevieweeId(
                partyId, userId, request.getRevieweeId())) {
            throw new CustomException(ErrorCode.MEMBER_ALREADY_REVIEWED);
        }

        TaxiParty party = getParty(partyId);
        User reviewer = getUser(userId);
        User reviewee = getUser(request.getRevieweeId());

        if (!participantRepository.existsByTaxiPartyIdAndUserId(partyId, request.getRevieweeId())) {
            throw new CustomException(ErrorCode.REVIEW_TARGET_NOT_IN_PARTY);
        }

        MemberReview saved = memberReviewRepository.save(MemberReview.builder()
                .taxiParty(party)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(request.getRating())
                .comment(request.getComment())
                .build());

        double delta = (request.getRating() - 3) * 1.0;
        reviewee.updateMannerTemp(delta);

        List<Participant> participants = participantRepository.findByTaxiPartyId(partyId);
        String alias = buildAliasMap(participants).getOrDefault(userId, "익명");

        return MemberReviewResponse.from(saved, alias);
    }

    @Transactional
    public NoShowReportResponse submitNoShowReport(Long partyId, Long userId, NoShowReportRequest request) {
        ensurePastPartyMember(partyId, userId);
        ensureUserCanParticipate(userId);

        if (userId.equals(request.getReportedUserId())) {
            throw new CustomException(ErrorCode.CANNOT_REPORT_SELF);
        }

        if (!participantRepository.existsByTaxiPartyIdAndUserId(partyId, request.getReportedUserId())) {
            throw new CustomException(ErrorCode.REVIEW_TARGET_NOT_IN_PARTY);
        }

        if (noShowReportRepository.existsByTaxiPartyIdAndReporterIdAndReportedUserId(
                partyId, userId, request.getReportedUserId())) {
            throw new CustomException(ErrorCode.NO_SHOW_ALREADY_REPORTED);
        }

        TaxiParty party = getParty(partyId);
        User reporter = getUser(userId);
        User reported = getUser(request.getReportedUserId());

        NoShowReport report = noShowReportRepository.save(NoShowReport.builder()
                .taxiParty(party)
                .reporter(reporter)
                .reportedUser(reported)
                .reason(request.getReason())
                .build());

        long pendingCount = noShowReportRepository.countByTaxiPartyIdAndReportedUserIdAndStatus(
                partyId, request.getReportedUserId(), NoShowReportStatus.PENDING);
        if (pendingCount >= NO_SHOW_CONFIRM_THRESHOLD) {
            confirmNoShowReports(partyId, request.getReportedUserId());
            report = noShowReportRepository.findById(report.getId()).orElse(report);
        }

        return NoShowReportResponse.from(report);
    }

    private void confirmNoShowReports(Long partyId, Long reportedUserId) {
        List<NoShowReport> pending = noShowReportRepository.findByTaxiPartyIdAndReportedUserId(partyId, reportedUserId)
                .stream()
                .filter(r -> r.getStatus() == NoShowReportStatus.PENDING)
                .toList();

        if (pending.isEmpty()) {
            return;
        }

        User reported = getUser(reportedUserId);
        boolean alreadyConfirmed = noShowReportRepository
                .countByTaxiPartyIdAndReportedUserIdAndStatus(
                        partyId, reportedUserId, NoShowReportStatus.CONFIRMED) > 0;
        if (alreadyConfirmed) {
            pending.forEach(NoShowReport::confirm);
            return;
        }

        pending.forEach(NoShowReport::confirm);
        reported.recordNoShow(NO_SHOW_SUSPEND_DAYS);
    }

    private void ensurePastPartyMember(Long partyId, Long userId) {
        TaxiParty party = getParty(partyId);
        if (!participantRepository.existsByTaxiPartyIdAndUserId(partyId, userId)) {
            throw new CustomException(ErrorCode.PARTY_NOT_JOINABLE);
        }
        if (party.getDepartureTime().isAfter(LocalDateTime.now())) {
            throw new CustomException(ErrorCode.PARTY_REVIEW_NOT_AVAILABLE);
        }
    }

    private Map<Long, String> buildAliasMap(List<Participant> participants) {
        Map<Long, String> map = new HashMap<>();
        int idx = 1;
        for (Participant p : participants) {
            map.put(p.getUser().getId(), p.isHost() ? "방장" : "탑승자 " + idx);
            if (!p.isHost()) {
                idx++;
            }
        }
        return map;
    }

    private TaxiParty getParty(Long partyId) {
        return taxiPartyRepository.findById(partyId)
                .orElseThrow(() -> new CustomException(ErrorCode.PARTY_NOT_FOUND));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }
}
