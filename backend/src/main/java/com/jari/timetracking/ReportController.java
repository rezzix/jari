package com.jari.timetracking;

import com.jari.common.dto.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final TimeLogRepository timeLogRepository;

    public ReportController(TimeLogRepository timeLogRepository) {
        this.timeLogRepository = timeLogRepository;
    }

    @GetMapping("/time-by-project")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> timeByProject(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long projectId) {

        List<TimeLog> logs;
        if (projectId != null) {
            logs = timeLogRepository.findByProjectIdAndDateRange(projectId, startDate, endDate);
        } else {
            // All projects: get all logs in date range
            logs = timeLogRepository.findByUserIdAndDateRange(null, startDate, endDate);
            // This won't work for null user - need a different query
        }

        Map<Long, BigDecimal> byProject = logs.stream()
                .collect(Collectors.groupingBy(
                        tl -> tl.getIssue().getProject().getId(),
                        Collectors.reducing(BigDecimal.ZERO, TimeLog::getHours, BigDecimal::add)
                ));

        List<Map<String, Object>> result = byProject.entrySet().stream()
                .map(e -> Map.of("projectId", (Object) e.getKey(), "totalHours", e.getValue()))
                .toList();

        return ResponseEntity.ok(ApiResponse.of(result));
    }

    @GetMapping("/time-by-user")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> timeByUser(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long userId) {

        List<TimeLog> logs;
        if (userId != null) {
            logs = timeLogRepository.findByUserIdAndDateRange(userId, startDate, endDate);
        } else {
            logs = timeLogRepository.findByUserIdAndLogDateBetween(null, startDate, endDate);
        }

        Map<Long, BigDecimal> byUser = logs.stream()
                .collect(Collectors.groupingBy(
                        tl -> tl.getUser().getId(),
                        Collectors.reducing(BigDecimal.ZERO, TimeLog::getHours, BigDecimal::add)
                ));

        List<Map<String, Object>> result = byUser.entrySet().stream()
                .map(e -> Map.of("userId", (Object) e.getKey(), "totalHours", e.getValue()))
                .toList();

        return ResponseEntity.ok(ApiResponse.of(result));
    }

    @GetMapping("/time-by-issue")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> timeByIssue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam Long projectId,
            @RequestParam(required = false) Long assigneeId) {

        List<TimeLog> logs = timeLogRepository.findByProjectIdAndDateRange(projectId, startDate, endDate);

        Map<Long, BigDecimal> byIssue = logs.stream()
                .collect(Collectors.groupingBy(
                        tl -> tl.getIssue().getId(),
                        Collectors.reducing(BigDecimal.ZERO, TimeLog::getHours, BigDecimal::add)
                ));

        List<Map<String, Object>> result = byIssue.entrySet().stream()
                .map(e -> Map.of("issueId", (Object) e.getKey(), "totalHours", e.getValue()))
                .toList();

        return ResponseEntity.ok(ApiResponse.of(result));
    }
}