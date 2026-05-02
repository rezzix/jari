package com.jari.phase;

import com.jari.common.dto.ApiResponse;
import com.jari.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/deliverables")
public class DeliverableController {

    private final DeliverableService deliverableService;
    private final DeliverableMapper deliverableMapper;
    private final AuthHelper authHelper;

    public DeliverableController(DeliverableService deliverableService,
                                  DeliverableMapper deliverableMapper,
                                  AuthHelper authHelper) {
        this.deliverableService = deliverableService;
        this.deliverableMapper = deliverableMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DeliverableDto>>> list(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long phaseId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        List<Deliverable> deliverables = phaseId != null
                ? deliverableService.getByPhaseId(phaseId)
                : deliverableService.getByProjectId(projectId);
        return ResponseEntity.ok(ApiResponse.of(deliverableMapper.toDtoList(deliverables)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliverableDto>> get(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.of(deliverableMapper.toDto(deliverableService.getById(id))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<DeliverableDto>> create(
            @PathVariable Long projectId,
            @Valid @RequestBody DeliverableDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Deliverable created = deliverableService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(deliverableMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<DeliverableDto>> update(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @RequestBody DeliverableDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Deliverable updated = deliverableService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(deliverableMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        deliverableService.delete(id);
        return ResponseEntity.noContent().build();
    }
}