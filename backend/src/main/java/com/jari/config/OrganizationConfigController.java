package com.jari.config;

import com.jari.common.dto.ApiResponse;
import com.jari.common.exception.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/organization")
public class OrganizationConfigController {

    private final OrganizationConfigRepository repository;

    public OrganizationConfigController(OrganizationConfigRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<OrganizationConfig>> get() {
        OrganizationConfig config = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Organization config not found"));
        return ResponseEntity.ok(ApiResponse.of(config));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrganizationConfig>> update(@RequestBody OrganizationConfig updated) {
        OrganizationConfig config = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Organization config not found"));
        config.setName(updated.getName());
        config.setAddress(updated.getAddress());
        return ResponseEntity.ok(ApiResponse.of(repository.save(config)));
    }
}