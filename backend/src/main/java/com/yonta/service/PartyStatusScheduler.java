package com.yonta.service;

import com.yonta.domain.PartyStatus;
import com.yonta.domain.TaxiParty;
import com.yonta.dto.response.PartyUpdateEvent;
import com.yonta.repository.TaxiPartyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PartyStatusScheduler {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final TaxiPartyRepository taxiPartyRepository;
    private final NotificationService notificationService;
    private final RealtimeEventPublisher eventPublisher;

    @Scheduled(cron = "0 */1 * * * *")
    @Transactional
    public void processPartyLifecycle() {
        LocalDateTime now = LocalDateTime.now();
        autoDepartParties(now);
        autoSettleParties(now);
        sendDepartureReminders(now);
    }

    private void autoDepartParties(LocalDateTime now) {
        List<TaxiParty> parties = taxiPartyRepository.findByStatusInAndDepartureTimeBefore(
                List.of(PartyStatus.RECRUITING, PartyStatus.FULL),
                now
        );
        for (TaxiParty party : parties) {
            party.depart();
            log.info("파티 {} 자동 출발 처리 (DEPARTED)", party.getId());
            eventPublisher.publishPartyUpdate(
                    party.getId(),
                    PartyUpdateEvent.statusChanged(
                            party.getId(), party.getStatus(),
                            party.getCurrentCount(), party.getMaxCount()
                    )
            );
            notificationService.notifyPartyMembers(
                    party,
                    null,
                    com.yonta.domain.NotificationType.PARTY_DEPARTED,
                    "출발 시간이 되었습니다",
                    String.format("%s → %s 파티가 출발 처리되었습니다.",
                            party.getDeparture().getDisplayName(),
                            party.getDestination().getDisplayName())
            );
        }
    }

    private void autoSettleParties(LocalDateTime now) {
        LocalDateTime cutoff = now.minusHours(2);
        List<TaxiParty> parties = taxiPartyRepository.findByStatusAndDepartureTimeBefore(
                PartyStatus.DEPARTED,
                cutoff
        );
        for (TaxiParty party : parties) {
            party.settle();
            log.info("파티 {} 자동 종료 처리 (SETTLED)", party.getId());
            eventPublisher.publishPartyUpdate(
                    party.getId(),
                    PartyUpdateEvent.statusChanged(
                            party.getId(), party.getStatus(),
                            party.getCurrentCount(), party.getMaxCount()
                    )
            );
        }
    }

    private void sendDepartureReminders(LocalDateTime now) {
        LocalDateTime from = now.plusMinutes(9);
        LocalDateTime to = now.plusMinutes(11);
        List<TaxiParty> parties = taxiPartyRepository.findPartiesDepartingBetween(
                List.of(PartyStatus.RECRUITING, PartyStatus.FULL),
                from,
                to
        );
        for (TaxiParty party : parties) {
            if (notificationService.hasDepartureReminder(party.getId())) {
                continue;
            }
            String timeLabel = party.getDepartureTime().format(TIME_FMT);
            notificationService.notifyPartyMembers(
                    party,
                    null,
                    com.yonta.domain.NotificationType.DEPARTURE_SOON,
                    "출발 10분 전입니다",
                    String.format("%s 출발 예정 파티입니다. (%s → %s)",
                            timeLabel,
                            party.getDeparture().getDisplayName(),
                            party.getDestination().getDisplayName())
            );
        }
    }
}
