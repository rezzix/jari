package com.jari.documentation;

import com.jari.common.dto.ApiResponse;
import com.jari.issue.Issue;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/wiki")
public class WikiPageController {

    private final WikiPageService wikiPageService;

    public WikiPageController(WikiPageService wikiPageService) {
        this.wikiPageService = wikiPageService;
    }

    @GetMapping("/pages")
    public ResponseEntity<ApiResponse<List<WikiPageDto.TreeItem>>> getPageTree(@PathVariable Long projectId) {
        List<WikiPage> rootPages = wikiPageService.getPageTree(projectId);
        List<WikiPageDto.TreeItem> tree = rootPages.stream().map(p -> toTreeItem(p)).toList();
        return ResponseEntity.ok(ApiResponse.of(tree));
    }

    @GetMapping("/pages/{pageId}")
    public ResponseEntity<ApiResponse<WikiPageDto>> getPage(@PathVariable Long projectId, @PathVariable Long pageId) {
        WikiPage page = wikiPageService.getById(pageId);
        return ResponseEntity.ok(ApiResponse.of(toDto(page)));
    }

    @PostMapping("/pages")
    public ResponseEntity<ApiResponse<WikiPageDto>> createPage(
            @PathVariable Long projectId,
            @Valid @RequestBody WikiPageDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = Long.parseLong(currentUser.getUsername());
        WikiPage created = wikiPageService.create(projectId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(toDto(created)));
    }

    @PutMapping("/pages/{pageId}")
    public ResponseEntity<ApiResponse<WikiPageDto>> updatePage(
            @PathVariable Long projectId, @PathVariable Long pageId,
            @RequestBody WikiPageDto.UpdateRequest request) {
        WikiPage updated = wikiPageService.update(pageId, request);
        return ResponseEntity.ok(ApiResponse.of(toDto(updated)));
    }

    @DeleteMapping("/pages/{pageId}")
    public ResponseEntity<Void> deletePage(@PathVariable Long projectId, @PathVariable Long pageId) {
        wikiPageService.delete(pageId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/pages/{pageId}/position")
    public ResponseEntity<ApiResponse<WikiPageDto>> updatePosition(
            @PathVariable Long projectId, @PathVariable Long pageId,
            @RequestBody WikiPageDto.PositionRequest request) {
        WikiPage updated = wikiPageService.updatePosition(pageId, request);
        return ResponseEntity.ok(ApiResponse.of(toDto(updated)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<WikiPageDto.SearchHit>>> search(
            @PathVariable Long projectId, @RequestParam String q) {
        List<WikiPageDto.SearchHit> hits = wikiPageService.search(projectId, q).stream()
                .map(p -> new WikiPageDto.SearchHit(p.getId(), p.getTitle(), p.getSlug()))
                .toList();
        return ResponseEntity.ok(ApiResponse.of(hits));
    }

    private WikiPageDto toDto(WikiPage page) {
        return new WikiPageDto(
                page.getId(), page.getTitle(), page.getSlug(), page.getContent(),
                page.getProject().getId(),
                page.getParent() != null ? page.getParent().getId() : null,
                page.getPosition(),
                page.getAuthor().getId(),
                page.getAuthor().getFirstName() + " " + page.getAuthor().getLastName(),
                page.getLinkedIssues().stream().map(Issue::getId).toList(),
                page.getUpdatedAt().toString(),
                null
        );
    }

    private WikiPageDto.TreeItem toTreeItem(WikiPage page) {
        List<WikiPage> children = wikiPageService.getChildren(page.getId());
        return new WikiPageDto.TreeItem(
                page.getId(), page.getTitle(), page.getSlug(),
                page.getParent() != null ? page.getParent().getId() : null,
                page.getPosition(),
                children.stream().map(this::toTreeItem).toList()
        );
    }
}