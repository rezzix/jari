package com.jari.issue;

import com.jari.attachment.AttachmentService;
import com.jari.common.dto.ApiResponse;
import com.jari.common.dto.PaginatedResponse;
import com.jari.common.dto.PaginatedResponse.PaginationInfo;
import com.jari.common.exception.ForbiddenException;
import com.jari.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/issues")
public class IssueController {

    private final IssueService issueService;
    private final IssueMapper issueMapper;
    private final AuthHelper authHelper;

    public IssueController(IssueService issueService, IssueMapper issueMapper, AuthHelper authHelper) {
        this.issueService = issueService;
        this.issueMapper = issueMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<IssueDto>> list(
            @PathVariable Long projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long statusId,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) Long typeId,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Long sprintId,
            @RequestParam(required = false) Long labelId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Instant createdAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Instant createdBefore,
            @RequestParam(required = false) Boolean external,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserDetails currentUser) {

        authHelper.requireProjectReadAccess(currentUser, projectId);
        if (authHelper.isExternal(currentUser)) {
            external = true;
        }
        Page<Issue> result = issueService.search(projectId, search, statusId, assigneeId, typeId,
                priority, sprintId, labelId, createdAfter, createdBefore, external, page, size, sort);
        return ResponseEntity.ok(PaginatedResponse.of(
                issueMapper.toDtoList(result.getContent()),
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }

    @GetMapping("/{issueId}")
    public ResponseEntity<ApiResponse<IssueDto>> get(
            @PathVariable Long projectId, @PathVariable Long issueId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        Issue issue = issueService.getById(issueId);
        if (authHelper.isExternal(currentUser) && !issue.isExternal()) {
            throw new ForbiddenException("You do not have access to this issue");
        }
        return ResponseEntity.ok(ApiResponse.of(issueMapper.toDto(issue)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IssueDto>> create(
            @PathVariable Long projectId,
            @Valid @RequestBody IssueDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        Long userId = authHelper.getCurrentUserId(currentUser);
        if (authHelper.isExternal(currentUser)) {
            request = new IssueDto.CreateRequest(request.title(), request.description(),
                    request.priority(), request.typeId(), request.assigneeId(), request.labelIds(), true);
        }
        Issue created = issueService.create(projectId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(issueMapper.toDto(created)));
    }

    @PutMapping("/{issueId}")
    public ResponseEntity<ApiResponse<IssueDto>> update(
            @PathVariable Long projectId, @PathVariable Long issueId,
            @RequestBody IssueDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        if (authHelper.isExternal(currentUser)) {
            Issue issue = issueService.getById(issueId);
            if (!issue.isExternal()) {
                throw new ForbiddenException("You can only edit external issues");
            }
            Long userId = authHelper.getCurrentUserId(currentUser);
            if (!issue.getReporter().getId().equals(userId) &&
                    !(issue.getAssignee() != null && issue.getAssignee().getId().equals(userId))) {
                throw new ForbiddenException("You can only edit your own external issues");
            }
        }
        Issue updated = issueService.update(issueId, request);
        return ResponseEntity.ok(ApiResponse.of(issueMapper.toDto(updated)));
    }

    @DeleteMapping("/{issueId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long projectId, @PathVariable Long issueId) {
        issueService.delete(issueId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{issueId}/position")
    public ResponseEntity<ApiResponse<IssueDto>> updatePosition(
            @PathVariable Long projectId, @PathVariable Long issueId,
            @RequestBody IssueDto.PositionRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        if (authHelper.isExternal(currentUser)) {
            Issue issue = issueService.getById(issueId);
            if (!issue.isExternal()) {
                throw new ForbiddenException("You can only move external issues");
            }
            Long userId = authHelper.getCurrentUserId(currentUser);
            if (!issue.getReporter().getId().equals(userId) &&
                    !(issue.getAssignee() != null && issue.getAssignee().getId().equals(userId))) {
                throw new ForbiddenException("You can only move your own external issues");
            }
        }
        Issue updated = issueService.updatePosition(issueId, request);
        return ResponseEntity.ok(ApiResponse.of(issueMapper.toDto(updated)));
    }

    // Comments
    @GetMapping("/{issueId}/comments")
    public ResponseEntity<ApiResponse<List<IssueDto.CommentDto>>> getComments(
            @PathVariable Long projectId, @PathVariable Long issueId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.of(issueMapper.toCommentDtoList(issueService.getComments(issueId))));
    }

    @PostMapping("/{issueId}/comments")
    public ResponseEntity<ApiResponse<IssueDto.CommentDto>> addComment(
            @PathVariable Long projectId, @PathVariable Long issueId,
            @Valid @RequestBody IssueDto.CommentDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        if (authHelper.isExternal(currentUser)) {
            Issue issue = issueService.getById(issueId);
            if (!issue.isExternal()) {
                throw new ForbiddenException("You can only comment on external issues");
            }
        }
        Long userId = authHelper.getCurrentUserId(currentUser);
        Comment comment = issueService.addComment(issueId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(issueMapper.toCommentDto(comment)));
    }

    @PutMapping("/{issueId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<IssueDto.CommentDto>> updateComment(
            @PathVariable Long projectId, @PathVariable Long issueId, @PathVariable Long commentId,
            @Valid @RequestBody IssueDto.CommentDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        Long userId = authHelper.getCurrentUserId(currentUser);
        Comment comment = issueService.getComment(commentId);
        if (!authHelper.hasAnyRole(currentUser, "ADMIN", "MANAGER") && !comment.getAuthor().getId().equals(userId)) {
            throw new com.jari.common.exception.ForbiddenException("You can only edit your own comments");
        }
        comment = issueService.updateComment(commentId, request);
        return ResponseEntity.ok(ApiResponse.of(issueMapper.toCommentDto(comment)));
    }

    @DeleteMapping("/{issueId}/comments/{commentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteComment(@PathVariable Long projectId, @PathVariable Long issueId, @PathVariable Long commentId) {
        issueService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}