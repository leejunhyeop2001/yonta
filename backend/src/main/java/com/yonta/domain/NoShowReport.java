package com.yonta.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "no_show_report",
        uniqueConstraints = @UniqueConstraint(columnNames = {"taxi_party_id", "reporter_id", "reported_user_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NoShowReport extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taxi_party_id", nullable = false)
    private TaxiParty taxiParty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id", nullable = false)
    private User reportedUser;

    @Column(nullable = false, length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoShowReportStatus status;

    @Builder
    public NoShowReport(TaxiParty taxiParty, User reporter, User reportedUser, String reason) {
        if (reporter.getId().equals(reportedUser.getId())) {
            throw new IllegalArgumentException("본인은 신고할 수 없습니다.");
        }
        this.taxiParty = taxiParty;
        this.reporter = reporter;
        this.reportedUser = reportedUser;
        this.reason = reason.trim();
        this.status = NoShowReportStatus.PENDING;
    }

    public void confirm() {
        this.status = NoShowReportStatus.CONFIRMED;
    }
}
