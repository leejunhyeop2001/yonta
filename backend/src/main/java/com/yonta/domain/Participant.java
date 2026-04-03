package com.yonta.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "participant",
    uniqueConstraints = @UniqueConstraint(columnNames = {"taxi_party_id", "user_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Participant extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taxi_party_id", nullable = false)
    private TaxiParty taxiParty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private boolean isHost;

    @Builder
    public Participant(TaxiParty taxiParty, User user, boolean isHost) {
        this.taxiParty = taxiParty;
        this.user = user;
        this.isHost = isHost;
    }

    public static Participant createHost(TaxiParty taxiParty, User user) {
        return Participant.builder()
                .taxiParty(taxiParty)
                .user(user)
                .isHost(true)
                .build();
    }

    public static Participant createGuest(TaxiParty taxiParty, User user) {
        return Participant.builder()
                .taxiParty(taxiParty)
                .user(user)
                .isHost(false)
                .build();
    }
}
