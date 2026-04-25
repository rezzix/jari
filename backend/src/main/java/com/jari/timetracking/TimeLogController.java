package com.jari.timetracking;

import com.jari.common.dto.ApiResponse;
import com.jari.common.dto.PaginatedResponse;
import com.jari.common.dto.PaginatedResponse.PaginationInfo;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/time-logs")
public class TimeLogController {

    private final TimeLogService timeLogService;
    private final TimeLogMapper timeLogMapper;

    public TimeLogController(TimeLogService timeLogService, TimeLogMapper timeLogMapper) {
        this.timeLogService = timeLogService;
        this.timeLogMapper = timeLogMapper;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TimeLogDto>> create(
            @Valid @RequestBody TimeLogDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = Long.parseLong(currentUser.getUsername());
        TimeLog created = timeLogService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(timeLogMapper.toDto(created)));
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<TimeLogDto>> list(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long issueId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "logDate,desc") String sort) {

        Page<TimeLog> result = timeLogService.search(userId, issueId, projectId, startDate, endDate, page, size, sort);
        return ResponseEntity.ok(PaginatedResponse.of(
                timeLogMapper.toDtoList(result.getContent()),
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeLogDto>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(timeLogMapper.toDto(timeLogService.getById(id))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeLogDto>> update(@PathVariable Long id, @RequestBody TimeLogDto.UpdateRequest request) {
        TimeLog updated = timeLogService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(timeLogMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        timeLogService.delete(id);
        return ResponseEntity.noContent().build();
    }
}