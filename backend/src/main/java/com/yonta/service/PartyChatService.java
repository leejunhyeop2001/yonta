package com.yonta.service;

import com.yonta.domain.PartyMessage;
import com.yonta.domain.Participant;
import com.yonta.domain.TaxiParty;
import com.yonta.domain.User;
import com.yonta.dto.response.ChatMessageResponse;
import com.yonta.exception.CustomException;
import com.yonta.exception.ErrorCode;
import com.yonta.repository.ParticipantRepository;
import com.yonta.repository.PartyMessageRepository;
import com.yonta.repository.TaxiPartyRepository;
import com.yonta.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class PartyChatService {

    private final PartyMessageRepository messageRepository;
    private final TaxiPartyRepository taxiPartyRepository;
    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final RealtimeEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long partyId, Long userId) {
        verifyMember(partyId, userId);
        List<PartyMessage> messages = messageRepository.findTop50ByTaxiPartyIdOrderByCreatedAtAsc(partyId);
        List<Participant> participants = participantRepository.findByTaxiPartyId(partyId);
        return messages.stream()
                .map(m -> ChatMessageResponse.from(m, resolveAlias(m.getSender().getId(), participants)))
                .toList();
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long partyId, Long userId, String content) {
        verifyMember(partyId, userId);
        TaxiParty party = taxiPartyRepository.findById(partyId)
                .orElseThrow(() -> new CustomException(ErrorCode.PARTY_NOT_FOUND));
        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        PartyMessage saved = messageRepository.save(
                PartyMessage.builder()
                        .taxiParty(party)
                        .sender(sender)
                        .content(content)
                        .build()
        );

        List<Participant> participants = participantRepository.findByTaxiPartyId(partyId);
        ChatMessageResponse response = ChatMessageResponse.from(
                saved,
                resolveAlias(sender.getId(), participants)
        );
        eventPublisher.publishChatMessage(partyId, response);
        return response;
    }

    private void verifyMember(Long partyId, Long userId) {
        if (!participantRepository.existsByTaxiPartyIdAndUserId(partyId, userId)) {
            throw new CustomException(ErrorCode.CHAT_NOT_MEMBER);
        }
    }

    private String resolveAlias(Long userId, List<Participant> participants) {
        AtomicInteger index = new AtomicInteger(1);
        for (Participant p : participants) {
            if (p.getUser().getId().equals(userId)) {
                return p.isHost() ? "방장" : "탑승자 " + index.get();
            }
            index.incrementAndGet();
        }
        return "탑승자";
    }
}
