package com.jari.timetracking;

import com.jari.common.dto.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/timesheets")
public class TimesheetController {

    private final TimeLogService timeLogService;
    private final TimeLogMapper timeLogMapper;

    public TimesheetController(TimeLogService timeLogService, TimeLogMapper timeLogMapper) {
        this.timeLogService = timeLogService;
        this.timeLogMapper = timeLogMapper;
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<Object>> weekly(
            @RequestParam Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            @AuthenticationPrincipal UserDetails currentUser) {
        LocalDate weekEnd = weekStart.plusDays(6);
        List<TimeLog> logs = timeLogService.getWeeklyTimesheet(userId, weekStart, weekEnd);

        Map<LocalDate, List<TimeLogDto>> byDate = logs.stream()
                .map(timeLogMapper::toDto)
                .collect(Collectors.groupingBy(TimeLogDto::logDate));

        return ResponseEntity.ok(ApiResponse.of(Map.of(
                "userId", userId,
                "weekStart", weekStart,
                "weekEnd", weekEnd,
                "days", byDate
        )));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<Object>> daily(
            @RequestParam Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserDetails currentUser) {
        List<TimeLog> logs = timeLogService.getDailyTimesheet(userId, date);
        return ResponseEntity.ok(ApiResponse.of(Map.of(
                "userId", userId,
                "date", date,
                "entries", timeLogMapper.toDtoList(logs)
        )));
    }
}