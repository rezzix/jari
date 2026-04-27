package com.jari.pmo;

import com.jari.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pmo")
public class PmoController {

    private final PmoService pmoService;

    public PmoController(PmoService pmoService) {
        this.pmoService = pmoService;
    }

    @GetMapping("/evm/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<PmoService.EvmMetrics>> getEvmMetrics(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.of(pmoService.computeEvm(projectId)));
    }

    @GetMapping("/portfolio")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<PmoService.PortfolioSummary>> getPortfolioSummary() {
        return ResponseEntity.ok(ApiResponse.of(pmoService.getPortfolioSummary()));
    }
}