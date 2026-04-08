package com.yonta.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "taxi_party")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TaxiParty extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Location departure;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Location destination;

    @Column(nullable = false)
    private LocalDateTime departureTime;

    @Column(nullable = false)
    private int currentCount;

    @Column(nullable = false)
    private int maxCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GenderOption genderOption;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PartyStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @OneToMany(mappedBy = "taxiParty", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Participant> participants = new ArrayList<>();

    @Builder
    public TaxiParty(Location departure, Location destination, LocalDateTime departureTime,
                     int maxCount, GenderOption genderOption, User host) {
        validateTimeSlot(departureTime.toLocalTime());
        validateMaxCount(maxCount);
        this.departure = departure;
        this.destination = destination;
        this.departureTime = departureTime;
        this.maxCount = maxCount;
        this.genderOption = genderOption;
        this.host = host;
        this.currentCount = 1;
        this.status = PartyStatus.RECRUITING;
    }

    private void validateTimeSlot(LocalTime time) {
        if (!TimeSlot.isValidSlotTime(time)) {
            throw new IllegalArgumentException("출발 시간은 10분 단위로만 설정할 수 있습니다.");
        }
    }

    private void validateMaxCount(int count) {
        if (count < 2 || count > 4) {
            throw new IllegalArgumentException("최대 인원은 2~4명이어야 합니다.");
        }
    }

    public void incrementCount() {
        if (this.currentCount >= this.maxCount) {
            throw new IllegalStateException("파티 최대 인원을 초과할 수 없습니다.");
        }
        this.currentCount++;
        if (this.currentCount == this.maxCount) {
            this.status = PartyStatus.FULL;
        }
    }

    public void decrementCount() {
        if (this.currentCount <= 1) {
            throw new IllegalStateException("최소 1명(방장)은 남아있어야 합니다.");
        }
        this.currentCount--;
        if (this.status == PartyStatus.FULL) {
            this.status = PartyStatus.RECRUITING;
        }
    }

    public void depart() {
        this.status = PartyStatus.DEPARTED;
    }

    public void settle() {
        this.status = PartyStatus.SETTLED;
    }

    public boolean isJoinable() {
        return this.status == PartyStatus.RECRUITING
                && this.currentCount < this.maxCount
                && this.departureTime.isAfter(LocalDateTime.now());
    }

    public void changeHost(User newHost) {
        this.host = newHost;
    }
}
