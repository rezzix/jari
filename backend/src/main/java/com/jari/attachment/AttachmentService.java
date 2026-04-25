package com.jari.attachment;

import com.jari.common.exception.EntityNotFoundException;
import com.jari.common.storage.StorageService;
import com.jari.issue.Issue;
import com.jari.issue.IssueRepository;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final IssueRepository issueRepository;
    private final StorageService storageService;

    public AttachmentService(AttachmentRepository attachmentRepository, IssueRepository issueRepository, StorageService storageService) {
        this.attachmentRepository = attachmentRepository;
        this.issueRepository = issueRepository;
        this.storageService = storageService;
    }

    @Transactional(readOnly = true)
    public List<Attachment> getByIssueId(Long issueId) {
        return attachmentRepository.findByIssueId(issueId);
    }

    @Transactional
    public Attachment upload(Long issueId, MultipartFile file, Long userId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new EntityNotFoundException("Issue", issueId));

        String storedPath;
        try {
            storedPath = storageService.store(file.getBytes(), file.getOriginalFilename(), file.getContentType());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }

        Attachment attachment = new Attachment();
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFilePath(storedPath);
        attachment.setContentType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setIssue(issue);
        attachment.setUploadedBy(userId);

        return attachmentRepository.save(attachment);
    }

    @Transactional
    public void delete(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment", attachmentId));
        storageService.delete(attachment.getFilePath());
        attachmentRepository.delete(attachment);
    }

    public Resource download(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment", attachmentId));
        return storageService.load(attachment.getFilePath());
    }

    public Attachment getById(Long id) {
        return attachmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Attachment", id));
    }
}