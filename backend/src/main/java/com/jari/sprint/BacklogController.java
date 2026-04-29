package com.jari.sprint;

import com.jari.common.dto.ApiResponse;
import com.jari.common.dto.PaginatedResponse;
import com.jari.common.dto.PaginatedResponse.PaginationInfo;
import com.jari.issue.Issue;
import com.jari.issue.IssueDto;
import com.jari.issue.IssueMapper;
import com.jari.issue.IssueRepository;
import com.jari.security.AuthHelper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects/{projectId}/backlog")
public class BacklogController {

    private final IssueRepository issueRepository;
    private final IssueMapper issueMapper;
    private final AuthHelper authHelper;

    public BacklogController(IssueRepository issueRepository, IssueMapper issueMapper, AuthHelper authHelper) {
        this.issueRepository = issueRepository;
        this.issueMapper = issueMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<IssueDto>> getBacklog(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "position,asc") String sort,
            @AuthenticationPrincipal UserDetails currentUser) {

        authHelper.requireProjectReadAccess(currentUser, projectId);
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Issue> result = issueRepository.findByProjectIdAndSprintIdIsNull(projectId, pageRequest);
        return ResponseEntity.ok(PaginatedResponse.of(
                issueMapper.toDtoList(result.getContent()),
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }
}