package com.yonta.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "party_message", indexes = {
        @Index(name = "idx_party_message_party_created", columnList = "taxi_party_id, created_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PartyMessage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taxi_party_id", nullable = false)
    private TaxiParty taxiParty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User sender;

    @Column(nullable = false, length = 500)
    private String content;

    @Builder
    public PartyMessage(TaxiParty taxiParty, User sender, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("메시지 내용이 비어 있습니다.");
        }
        if (content.length() > 500) {
            throw new IllegalArgumentException("메시지는 500자 이하여야 합니다.");
        }
        this.taxiParty = taxiParty;
        this.sender = sender;
        this.content = content.trim();
    }
}
