package com.yonta.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "member_review",
        uniqueConstraints = @UniqueConstraint(columnNames = {"taxi_party_id", "reviewer_id", "reviewee_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberReview extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taxi_party_id", nullable = false)
    private TaxiParty taxiParty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewee_id", nullable = false)
    private User reviewee;

    @Column(nullable = false)
    private int rating;

    @Column(length = 300)
    private String comment;

    @Builder
    public MemberReview(TaxiParty taxiParty, User reviewer, User reviewee, int rating, String comment) {
        if (reviewer.getId().equals(reviewee.getId())) {
            throw new IllegalArgumentException("본인은 평가할 수 없습니다.");
        }
        this.taxiParty = taxiParty;
        this.reviewer = reviewer;
        this.reviewee = reviewee;
        this.rating = rating;
        this.comment = comment;
    }
}
