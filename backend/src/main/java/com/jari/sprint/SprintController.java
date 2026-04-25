package com.jari.sprint;

import com.jari.common.dto.ApiResponse;
import com.jari.issue.Issue;
import com.jari.issue.IssueDto;
import com.jari.issue.IssueMapper;
import com.jari.issue.IssueRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/sprints")
public class SprintController {

    private final SprintService sprintService;
    private final SprintMapper sprintMapper;
    private final IssueRepository issueRepository;
    private final IssueMapper issueMapper;

    public SprintController(SprintService sprintService, SprintMapper sprintMapper,
                            IssueRepository issueRepository, IssueMapper issueMapper) {
        this.sprintService = sprintService;
        this.sprintMapper = sprintMapper;
        this.issueRepository = issueRepository;
        this.issueMapper = issueMapper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SprintDto>>> list(
            @PathVariable Long projectId,
            @RequestParam(required = false) String status) {
        Sprint.SprintStatus statusEnum = status != null ? Sprint.SprintStatus.valueOf(status) : null;
        return ResponseEntity.ok(ApiResponse.of(sprintMapper.toDtoList(sprintService.getByProjectId(projectId, statusEnum))));
    }

    @GetMapping("/{sprintId}")
    public ResponseEntity<ApiResponse<SprintDto>> get(@PathVariable Long projectId, @PathVariable Long sprintId) {
        return ResponseEntity.ok(ApiResponse.of(sprintMapper.toDto(sprintService.getById(sprintId))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<SprintDto>> create(
            @PathVariable Long projectId, @Valid @RequestBody SprintDto.CreateRequest request) {
        Sprint created = sprintService.create(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(sprintMapper.toDto(created)));
    }

    @PutMapping("/{sprintId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<SprintDto>> update(
            @PathVariable Long projectId, @PathVariable Long sprintId,
            @RequestBody SprintDto.UpdateRequest request) {
        Sprint updated = sprintService.update(sprintId, request);
        return ResponseEntity.ok(ApiResponse.of(sprintMapper.toDto(updated)));
    }

    @PatchMapping("/{sprintId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<SprintDto>> updateStatus(
            @PathVariable Long projectId, @PathVariable Long sprintId,
            @Valid @RequestBody SprintDto.StatusUpdateRequest request) {
        Sprint updated = sprintService.updateStatus(sprintId, request);
        return ResponseEntity.ok(ApiResponse.of(sprintMapper.toDto(updated)));
    }
}