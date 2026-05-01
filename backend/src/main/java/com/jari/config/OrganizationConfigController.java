package com.jari.config;

import com.jari.common.dto.ApiResponse;
import com.jari.common.exception.EntityNotFoundException;
import com.jari.company.Company;
import com.jari.company.CompanyRepository;
import com.jari.security.AuthHelper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/organization")
public class OrganizationConfigController {

    private final OrganizationConfigRepository repository;
    private final CompanyRepository companyRepository;
    private final AuthHelper authHelper;

    public OrganizationConfigController(OrganizationConfigRepository repository, CompanyRepository companyRepository, AuthHelper authHelper) {
        this.repository = repository;
        this.companyRepository = companyRepository;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<OrganizationConfig>> get(@AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        OrganizationConfig config;
        if (companyId != null) {
            config = repository.findByCompanyId(companyId)
                    .orElseGet(() -> repository.findByCompanyIdIsNull()
                            .orElseThrow(() -> new EntityNotFoundException("Organization config not found")));
        } else {
            config = repository.findByCompanyIdIsNull()
                    .orElseThrow(() -> new EntityNotFoundException("Organization config not found"));
        }
        return ResponseEntity.ok(ApiResponse.of(config));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrganizationConfig>> update(
            @RequestBody OrganizationConfig updated,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        OrganizationConfig config;
        if (companyId != null) {
            config = repository.findByCompanyId(companyId).orElse(null);
            if (config == null) {
                config = new OrganizationConfig();
                Company company = companyRepository.findById(companyId)
                        .orElseThrow(() -> new EntityNotFoundException("Company", companyId));
                config.setCompany(company);
            }
        } else {
            config = repository.findByCompanyIdIsNull()
                    .orElseThrow(() -> new EntityNotFoundException("Organization config not found"));
        }
        config.setName(updated.getName());
        config.setAddress(updated.getAddress());
        return ResponseEntity.ok(ApiResponse.of(repository.save(config)));
    }
}