package com.yonta.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "party_review",
        uniqueConstraints = @UniqueConstraint(columnNames = {"taxi_party_id", "reviewer_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PartyReview extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taxi_party_id", nullable = false)
    private TaxiParty taxiParty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @Column(nullable = false)
    private int rating;

    @Column(length = 300)
    private String comment;

    @Builder
    public PartyReview(TaxiParty taxiParty, User reviewer, int rating, String comment) {
        this.taxiParty = taxiParty;
        this.reviewer = reviewer;
        this.rating = rating;
        this.comment = comment;
    }
}
