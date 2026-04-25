package com.jari.program;

import com.jari.common.dto.ApiResponse;
import com.jari.common.dto.PaginatedResponse;
import com.jari.common.dto.PaginatedResponse.PaginationInfo;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/programs")
public class ProgramController {

    private final ProgramService programService;
    private final ProgramMapper programMapper;

    public ProgramController(ProgramService programService, ProgramMapper programMapper) {
        this.programService = programService;
        this.programMapper = programMapper;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<ProgramDto>> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        Page<Program> result = programService.search(search, page, size, sort);
        return ResponseEntity.ok(PaginatedResponse.of(
                programMapper.toDtoList(result.getContent()),
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProgramDto>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(programMapper.toDto(programService.getById(id))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProgramDto>> create(@Valid @RequestBody ProgramDto.CreateRequest request) {
        Program created = programService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(programMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProgramDto>> update(@PathVariable Long id, @RequestBody ProgramDto.UpdateRequest request) {
        Program updated = programService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(programMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        programService.delete(id);
        return ResponseEntity.noContent().build();
    }
}