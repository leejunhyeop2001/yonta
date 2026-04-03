package com.yonta.domain;

import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Getter
public class TimeSlot {

    private static final int SLOT_INTERVAL_MINUTES = 10;
    private static final int SLOTS_PER_HOUR = 60 / SLOT_INTERVAL_MINUTES;
    private static final int TOTAL_SLOTS = 24 * SLOTS_PER_HOUR; // 144

    private final LocalTime time;
    private final int index;

    private TimeSlot(LocalTime time, int index) {
        this.time = time;
        this.index = index;
    }

    public static List<TimeSlot> allSlots() {
        List<TimeSlot> slots = new ArrayList<>(TOTAL_SLOTS);
        for (int i = 0; i < TOTAL_SLOTS; i++) {
            int hour = i / SLOTS_PER_HOUR;
            int minute = (i % SLOTS_PER_HOUR) * SLOT_INTERVAL_MINUTES;
            slots.add(new TimeSlot(LocalTime.of(hour, minute), i));
        }
        return slots;
    }

    public static List<TimeSlot> slotsForPeriod(Period period) {
        return allSlots().stream()
                .filter(s -> period.contains(s.time))
                .toList();
    }

    public static List<TimeSlot> availableSlots(LocalDate date) {
        LocalDateTime now = LocalDateTime.now();
        return allSlots().stream()
                .filter(s -> date.atTime(s.time).isAfter(now))
                .toList();
    }

    public static boolean isValidSlotTime(LocalTime time) {
        return time.getMinute() % SLOT_INTERVAL_MINUTES == 0
                && time.getSecond() == 0
                && time.getNano() == 0;
    }

    public static LocalTime snapToSlot(LocalTime time) {
        int snappedMinute = (time.getMinute() / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
        return LocalTime.of(time.getHour(), snappedMinute);
    }

    public static int toIndex(LocalTime time) {
        return time.getHour() * SLOTS_PER_HOUR + time.getMinute() / SLOT_INTERVAL_MINUTES;
    }

    public String getLabel() {
        return String.format("%02d:%02d", time.getHour(), time.getMinute());
    }

    @Getter
    public enum Period {
        EARLY_MORNING("새벽", LocalTime.of(0, 0), LocalTime.of(5, 50)),
        MORNING("오전", LocalTime.of(6, 0), LocalTime.of(11, 50)),
        AFTERNOON("오후", LocalTime.of(12, 0), LocalTime.of(17, 50)),
        EVENING("저녁/밤", LocalTime.of(18, 0), LocalTime.of(23, 50));

        private final String displayName;
        private final LocalTime start;
        private final LocalTime end;

        Period(String displayName, LocalTime start, LocalTime end) {
            this.displayName = displayName;
            this.start = start;
            this.end = end;
        }

        public boolean contains(LocalTime time) {
            return !time.isBefore(start) && !time.isAfter(end);
        }
    }
}
