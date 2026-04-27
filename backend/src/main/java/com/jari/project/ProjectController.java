package com.jari.project;

import com.jari.common.dto.ApiResponse;
import com.jari.common.dto.PaginatedResponse;
import com.jari.common.dto.PaginatedResponse.PaginationInfo;
import com.jari.common.exception.ForbiddenException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectMapper projectMapper;

    public ProjectController(ProjectService projectService, ProjectMapper projectMapper) {
        this.projectService = projectService;
        this.projectMapper = projectMapper;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<ProjectDto>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long programId,
            @RequestParam(required = false) Long managerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserDetails currentUser) {

        Long userId = Long.parseLong(currentUser.getUsername());
        boolean isAdminOrManagerOrExecutive = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER") || a.getAuthority().equals("ROLE_EXECUTIVE"));

        Page<Project> result;
        if (isAdminOrManagerOrExecutive) {
            result = projectService.search(search, programId, managerId, page, size, sort);
        } else {
            result = projectService.searchByMember(userId, page, size);
        }

        Set<Long> favoriteIds = projectService.getFavoriteProjectIds(userId);
        List<ProjectDto> dtos = projectMapper.toDtoList(result.getContent()).stream()
                .map(dto -> new ProjectDto(dto.id(), dto.name(), dto.key(), dto.description(),
                        dto.programId(), dto.programName(), dto.managerId(), dto.managerName(),
                        dto.stage(), dto.strategicScore(), dto.plannedValue(), dto.budget(), dto.budgetSpent(),
                        dto.targetStartDate(), dto.targetEndDate(),
                        favoriteIds.contains(dto.id()),
                        dto.createdAt(), dto.updatedAt()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(PaginatedResponse.of(
                dtos,
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDto>> get(@PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = Long.parseLong(currentUser.getUsername());
        ProjectDto dto = projectMapper.toDto(projectService.getById(id));
        Set<Long> favoriteIds = projectService.getFavoriteProjectIds(userId);
        ProjectDto enriched = new ProjectDto(dto.id(), dto.name(), dto.key(), dto.description(),
                dto.programId(), dto.programName(), dto.managerId(), dto.managerName(),
                dto.stage(), dto.strategicScore(), dto.plannedValue(), dto.budget(), dto.budgetSpent(),
                dto.targetStartDate(), dto.targetEndDate(),
                favoriteIds.contains(dto.id()),
                dto.createdAt(), dto.updatedAt());
        return ResponseEntity.ok(ApiResponse.of(enriched));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto>> create(@Valid @RequestBody ProjectDto.CreateRequest request) {
        Project created = projectService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(projectMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto>> update(@PathVariable Long id, @RequestBody ProjectDto.UpdateRequest request) {
        Project updated = projectService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(projectMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Favorites
    @PostMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<ProjectDto>> toggleFavorite(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = Long.parseLong(currentUser.getUsername());
        boolean isFavorite = projectService.toggleFavorite(id, userId);
        return get(id, currentUser);
    }

    // Members
    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<ProjectDto.MemberDto>>> getMembers(@PathVariable Long id) {
        List<ProjectDto.MemberDto> members = projectService.getMembers(id).stream()
                .map(projectMapper::toMemberDto).toList();
        return ResponseEntity.ok(ApiResponse.of(members));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Object>> addMembers(@PathVariable Long id, @RequestBody MemberRequest request) {
        projectService.addMembers(id, request.userIds());
        return ResponseEntity.ok(ApiResponse.of("Members added"));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        projectService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }

    // Labels
    @GetMapping("/{id}/labels")
    public ResponseEntity<ApiResponse<List<ProjectDto.LabelDto>>> getLabels(@PathVariable Long id) {
        List<ProjectDto.LabelDto> labels = projectService.getLabels(id).stream()
                .map(l -> new ProjectDto.LabelDto(l.getId(), l.getName(), l.getColor())).toList();
        return ResponseEntity.ok(ApiResponse.of(labels));
    }

    @PostMapping("/{id}/labels")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto.LabelDto>> createLabel(
            @PathVariable Long id, @Valid @RequestBody ProjectDto.LabelCreateRequest request) {
        Label label = projectService.createLabel(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.of(new ProjectDto.LabelDto(label.getId(), label.getName(), label.getColor())));
    }

    @PutMapping("/{id}/labels/{labelId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto.LabelDto>> updateLabel(
            @PathVariable Long id, @PathVariable Long labelId, @Valid @RequestBody ProjectDto.LabelCreateRequest request) {
        Label label = projectService.updateLabel(id, labelId, request);
        return ResponseEntity.ok(ApiResponse.of(new ProjectDto.LabelDto(label.getId(), label.getName(), label.getColor())));
    }

    @DeleteMapping("/{id}/labels/{labelId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteLabel(@PathVariable Long id, @PathVariable Long labelId) {
        projectService.deleteLabel(labelId);
        return ResponseEntity.noContent().build();
    }

    // Board
    @GetMapping("/{id}/board")
    public ResponseEntity<ApiResponse<ProjectDto.BoardConfigDto>> getBoard(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(projectService.getBoardConfig(id)));
    }

    @PutMapping("/{id}/board")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto.BoardConfigDto>> updateBoard(
            @PathVariable Long id, @RequestBody ProjectDto.BoardUpdateRequest request) {
        projectService.updateBoardConfig(id, request.columns());
        return ResponseEntity.ok(ApiResponse.of(projectService.getBoardConfig(id)));
    }

    public record MemberRequest(List<Long> userIds) {}
}