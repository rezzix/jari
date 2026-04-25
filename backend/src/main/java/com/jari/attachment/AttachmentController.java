package com.jari.attachment;

import com.jari.common.dto.ApiResponse;
import com.jari.issue.IssueDto;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/issues/{issueId}/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<IssueDto.AttachmentDto>>> list(@PathVariable Long issueId) {
        List<IssueDto.AttachmentDto> attachments = attachmentService.getByIssueId(issueId).stream()
                .map(a -> new IssueDto.AttachmentDto(a.getId(), a.getFileName(), a.getContentType(),
                        a.getFileSize(), a.getUploadedBy(), a.getCreatedAt().toString()))
                .toList();
        return ResponseEntity.ok(ApiResponse.of(attachments));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IssueDto.AttachmentDto>> upload(
            @PathVariable Long issueId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = Long.parseLong(currentUser.getUsername());
        Attachment attachment = attachmentService.upload(issueId, file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(
                new IssueDto.AttachmentDto(attachment.getId(), attachment.getFileName(),
                        attachment.getContentType(), attachment.getFileSize(),
                        attachment.getUploadedBy(), attachment.getCreatedAt().toString())
        ));
    }

    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> delete(@PathVariable Long attachmentId) {
        attachmentService.delete(attachmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/download/{attachmentId}")
    public ResponseEntity<Resource> download(@PathVariable Long attachmentId) {
        Resource resource = attachmentService.download(attachmentId);
        Attachment attachment = attachmentService.getById(attachmentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }
}