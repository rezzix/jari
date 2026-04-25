package com.jari.config;

import com.jari.common.exception.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class IssueConfigController {

    private final IssueTypeRepository typeRepo;
    private final IssueStatusRepository statusRepo;

    public IssueConfigController(IssueTypeRepository typeRepo, IssueStatusRepository statusRepo) {
        this.typeRepo = typeRepo;
        this.statusRepo = statusRepo;
    }

    // --- Issue Types ---

    @GetMapping("/issue-types")
    public ResponseEntity<List<IssueType>> listTypes() {
        return ResponseEntity.ok(typeRepo.findAll());
    }

    public record CreateTypeRequest(@NotBlank String name) {}

    @PostMapping("/issue-types")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IssueType> createType(@Valid @RequestBody CreateTypeRequest request) {
        IssueType type = new IssueType();
        type.setName(request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(typeRepo.save(type));
    }

    @PutMapping("/issue-types/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IssueType> updateType(@PathVariable Long id, @Valid @RequestBody CreateTypeRequest request) {
        IssueType type = typeRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("IssueType", id));
        type.setName(request.name());
        return ResponseEntity.ok(typeRepo.save(type));
    }

    @DeleteMapping("/issue-types/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteType(@PathVariable Long id) {
        typeRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- Issue Statuses ---

    @GetMapping("/issue-statuses")
    public ResponseEntity<List<IssueStatus>> listStatuses() {
        return ResponseEntity.ok(statusRepo.findAll());
    }

    public record CreateStatusRequest(@NotBlank String name, @NotBlank String category, boolean isDefault) {}

    @PostMapping("/issue-statuses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IssueStatus> createStatus(@Valid @RequestBody CreateStatusRequest request) {
        IssueStatus status = new IssueStatus();
        status.setName(request.name());
        status.setCategory(IssueStatus.Category.valueOf(request.category()));
        status.setDefault(request.isDefault());
        return ResponseEntity.status(HttpStatus.CREATED).body(statusRepo.save(status));
    }

    @PutMapping("/issue-statuses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IssueStatus> updateStatus(@PathVariable Long id, @Valid @RequestBody CreateStatusRequest request) {
        IssueStatus status = statusRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("IssueStatus", id));
        status.setName(request.name());
        status.setCategory(IssueStatus.Category.valueOf(request.category()));
        status.setDefault(request.isDefault());
        return ResponseEntity.ok(statusRepo.save(status));
    }

    @DeleteMapping("/issue-statuses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStatus(@PathVariable Long id) {
        statusRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}