package com.yonta.config;

import com.yonta.domain.GenderOption;
import com.yonta.domain.Location;
import com.yonta.domain.Participant;
import com.yonta.domain.TaxiParty;
import com.yonta.domain.User;
import com.yonta.repository.ParticipantRepository;
import com.yonta.repository.TaxiPartyRepository;
import com.yonta.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@Profile("!prod")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TaxiPartyRepository taxiPartyRepository;
    private final ParticipantRepository participantRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        String encoded = passwordEncoder.encode("test1234");

        userRepository.save(User.builder()
                .studentId("20210001").name("김연세").email("yonsei01@yonsei.ac.kr")
                .password(encoded).gender(User.Gender.MALE).build());
        userRepository.save(User.builder()
                .studentId("20210002").name("이미래").email("yonsei02@yonsei.ac.kr")
                .password(encoded).gender(User.Gender.FEMALE).build());
        userRepository.save(User.builder()
                .studentId("20220003").name("박원주").email("yonsei03@yonsei.ac.kr")
                .password(encoded).gender(User.Gender.MALE).build());
        userRepository.save(User.builder()
                .studentId("20220004").name("정캠퍼").email("yonsei04@yonsei.ac.kr")
                .password(encoded).gender(User.Gender.FEMALE).build());
        userRepository.save(User.builder()
                .studentId("20230005").name("최합승").email("yonsei05@yonsei.ac.kr")
                .password(encoded).gender(User.Gender.MALE).build());
        userRepository.save(User.builder()
                .studentId("20230006").name("한택시").email("yonsei06@yonsei.ac.kr")
                .password(encoded).gender(User.Gender.FEMALE).build());
        userRepository.save(User.builder()
                .studentId("20240007").name("강연타").email("yonsei07@yonsei.ac.kr")
                .password(encoded).gender(User.Gender.MALE).build());
        userRepository.save(User.builder()
                .studentId("20240008").name("윤흥업").email("yonsei08@yonsei.ac.kr")
                .password(encoded).gender(User.Gender.FEMALE).build());

        // 일부 사용자 인증 처리
        userRepository.findByStudentId("20210001").ifPresent(u -> { u.verify(); userRepository.save(u); });
        userRepository.findByStudentId("20210002").ifPresent(u -> { u.verify(); userRepository.save(u); });
        userRepository.findByStudentId("20220003").ifPresent(u -> { u.verify(); userRepository.save(u); });
        userRepository.findByStudentId("20230005").ifPresent(u -> { u.verify(); userRepository.save(u); });

        // 매너 온도 차등
        userRepository.findByStudentId("20210001").ifPresent(u -> { u.updateMannerTemp(3.5); userRepository.save(u); });
        userRepository.findByStudentId("20220003").ifPresent(u -> { u.updateMannerTemp(-1.2); userRepository.save(u); });
        userRepository.findByStudentId("20230006").ifPresent(u -> { u.updateMannerTemp(5.0); userRepository.save(u); });

        seedDemoParties();
        log.info("개발용 데모 유저/파티 데이터 생성 완료");
    }

    private void seedDemoParties() {
        if (taxiPartyRepository.count() > 0) {
            return;
        }

        User host1 = userRepository.findByStudentId("20210001").orElseThrow();
        User host2 = userRepository.findByStudentId("20210002").orElseThrow();
        User guest1 = userRepository.findByStudentId("20220003").orElseThrow();
        User guest2 = userRepository.findByStudentId("20220004").orElseThrow();
        User guest3 = userRepository.findByStudentId("20230005").orElseThrow();

        TaxiParty p1 = taxiPartyRepository.save(TaxiParty.builder()
                .departure(Location.CAMPUS)
                .destination(Location.WONJU_STATION)
                .departureTime(nextTenMinuteSlot(40))
                .maxCount(4)
                .genderOption(GenderOption.ANY)
                .host(host1)
                .build());
        participantRepository.save(Participant.createHost(p1, host1));
        participantRepository.save(Participant.createGuest(p1, guest1));
        p1.incrementCount();

        TaxiParty p2 = taxiPartyRepository.save(TaxiParty.builder()
                .departure(Location.CAMPUS)
                .destination(Location.TERMINAL)
                .departureTime(nextTenMinuteSlot(70))
                .maxCount(4)
                .genderOption(GenderOption.FEMALE_ONLY)
                .host(host2)
                .build());
        participantRepository.save(Participant.createHost(p2, host2));
        participantRepository.save(Participant.createGuest(p2, guest2));
        participantRepository.save(Participant.createGuest(p2, guest3));
        p2.incrementCount();
        p2.incrementCount();
    }

    private LocalDateTime nextTenMinuteSlot(int plusMinutes) {
        LocalDateTime base = LocalDateTime.now().plusMinutes(plusMinutes).withSecond(0).withNano(0);
        int minute = base.getMinute();
        int rounded = ((minute + 9) / 10) * 10;

        if (rounded == 60) {
            return base.plusHours(1).withMinute(0);
        }
        return base.withMinute(rounded);
    }
}
