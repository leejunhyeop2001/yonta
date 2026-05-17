package com.yonta.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_notification", indexes = {
        @Index(name = "idx_notification_user_read", columnList = "user_id, read_flag, created_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserNotification extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taxi_party_id")
    private TaxiParty taxiParty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 300)
    private String body;

    @Column(name = "read_flag", nullable = false)
    private boolean read;

    @Builder
    public UserNotification(User user, TaxiParty taxiParty, NotificationType type, String title, String body) {
        this.user = user;
        this.taxiParty = taxiParty;
        this.type = type;
        this.title = title;
        this.body = body;
        this.read = false;
    }

    public void markRead() {
        this.read = true;
    }
}
