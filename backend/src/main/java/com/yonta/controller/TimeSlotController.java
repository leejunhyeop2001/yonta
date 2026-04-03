package com.yonta.controller;

import com.yonta.domain.TimeSlot;
import com.yonta.dto.response.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/time-slots")
public class TimeSlotController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, List<SlotDto>>>> getAllSlots(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        List<TimeSlot> available = TimeSlot.availableSlots(targetDate);

        Map<String, List<SlotDto>> grouped = new LinkedHashMap<>();
        for (TimeSlot.Period period : TimeSlot.Period.values()) {
            List<SlotDto> slots = TimeSlot.slotsForPeriod(period).stream()
                    .map(s -> new SlotDto(
                            s.getIndex(),
                            s.getLabel(),
                            available.contains(s)))
                    .toList();
            grouped.put(period.getDisplayName(), slots);
        }

        return ResponseEntity.ok(ApiResponse.ok(grouped));
    }

    private record SlotDto(int index, String label, boolean available) {}
}
