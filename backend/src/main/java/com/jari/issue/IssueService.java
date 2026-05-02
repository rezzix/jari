package com.jari.issue;

import com.jari.common.exception.EntityNotFoundException;
import com.jari.common.exception.ForbiddenException;
import com.jari.config.IssueStatus;
import com.jari.config.IssueStatusRepository;
import com.jari.config.IssueType;
import com.jari.config.IssueTypeRepository;
import com.jari.project.Label;
import com.jari.project.LabelRepository;
import com.jari.project.Project;
import com.jari.project.ProjectRepository;
import com.jari.sprint.Sprint;
import com.jari.sprint.SprintRepository;
import com.jari.user.User;
import com.jari.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class IssueService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final IssueStatusRepository statusRepository;
    private final IssueTypeRepository typeRepository;
    private final LabelRepository labelRepository;
    private final CommentRepository commentRepository;
    private final SprintRepository sprintRepository;

    public IssueService(IssueRepository issueRepository, ProjectRepository projectRepository,
                        UserRepository userRepository, IssueStatusRepository statusRepository,
                        IssueTypeRepository typeRepository, LabelRepository labelRepository,
                        CommentRepository commentRepository, SprintRepository sprintRepository) {
        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.statusRepository = statusRepository;
        this.typeRepository = typeRepository;
        this.labelRepository = labelRepository;
        this.commentRepository = commentRepository;
        this.sprintRepository = sprintRepository;
    }

    @Transactional(readOnly = true)
    public Page<Issue> search(Long projectId, String search, Long statusId, Long assigneeId,
                              Long typeId, String priority, Long sprintId, Long labelId,
                              Instant createdAfter, Instant createdBefore, Boolean external,
                              int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);
        return issueRepository.search(projectId, search, statusId, assigneeId, typeId,
                priority != null ? Issue.Priority.valueOf(priority) : null,
                sprintId, labelId, createdAfter, createdBefore, external, pageRequest);
    }

    @Transactional(readOnly = true)
    public Issue getById(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Issue", id));
    }

    @Transactional
    public Issue create(Long projectId, IssueDto.CreateRequest request, Long reporterId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project", projectId));
        IssueType type = typeRepository.findById(request.typeId())
                .orElseThrow(() -> new EntityNotFoundException("IssueType", request.typeId()));
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new EntityNotFoundException("User", reporterId));

        Issue issue = new Issue();
        issue.setTitle(request.title());
        issue.setDescription(request.description());
        issue.setPriority(Issue.Priority.valueOf(request.priority()));
        issue.setType(type);
        issue.setProject(project);
        issue.setReporter(reporter);
        issue.setStatus(statusRepository.findByIsDefaultTrue()
                .orElseThrow(() -> new EntityNotFoundException("No default issue status found")));

        if (request.assigneeId() != null) {
            User assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.assigneeId()));
            issue.setAssignee(assignee);
        }

        // Generate issue key
        Integer maxSeq = issueRepository.findMaxSequenceByProjectId(projectId);
        int nextSeq = (maxSeq != null ? maxSeq : 0) + 1;
        issue.setIssueKey(project.getKey() + "-" + nextSeq);

        // Set labels
        if (request.labelIds() != null) {
            for (Long labelId : request.labelIds()) {
                Label label = labelRepository.findById(labelId)
                        .orElseThrow(() -> new EntityNotFoundException("Label", labelId));
                issue.getLabels().add(label);
            }
        }

        if (request.external() != null && request.external()) {
            issue.setExternal(true);
        }

        return issueRepository.save(issue);
    }

    @Transactional
    public Issue update(Long id, IssueDto.UpdateRequest request) {
        Issue issue = getById(id);

        if (request.title() != null) issue.setTitle(request.title());
        if (request.description() != null) issue.setDescription(request.description());
        if (request.priority() != null) issue.setPriority(Issue.Priority.valueOf(request.priority()));
        if (request.typeId() != null) {
            IssueType type = typeRepository.findById(request.typeId())
                    .orElseThrow(() -> new EntityNotFoundException("IssueType", request.typeId()));
            issue.setType(type);
        }
        if (request.assigneeId() != null) {
            User assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.assigneeId()));
            issue.setAssignee(assignee);
        }
        if (request.statusId() != null) {
            IssueStatus status = statusRepository.findById(request.statusId())
                    .orElseThrow(() -> new EntityNotFoundException("IssueStatus", request.statusId()));
            issue.setStatus(status);
        }
        if (request.sprintId() != null) {
            Sprint sprint = sprintRepository.findById(request.sprintId())
                    .orElseThrow(() -> new EntityNotFoundException("Sprint", request.sprintId()));
            issue.setSprint(sprint);
        }
        if (request.labelIds() != null) {
            issue.getLabels().clear();
            for (Long labelId : request.labelIds()) {
                Label label = labelRepository.findById(labelId)
                        .orElseThrow(() -> new EntityNotFoundException("Label", labelId));
                issue.getLabels().add(label);
            }
        }
        if (request.external() != null) issue.setExternal(request.external());

        return issueRepository.save(issue);
    }

    @Transactional
    public void delete(Long id) {
        Issue issue = getById(id);
        issueRepository.delete(issue);
    }

    @Transactional
    public Issue updatePosition(Long id, IssueDto.PositionRequest request) {
        Issue issue = getById(id);
        issue.setPosition(request.position());
        // If sprintId is explicitly set, update it; null moves to backlog
        if (request.sprintId() != null) {
            Sprint sprint = sprintRepository.findById(request.sprintId())
                    .orElseThrow(() -> new EntityNotFoundException("Sprint", request.sprintId()));
            issue.setSprint(sprint);
        }
        return issueRepository.save(issue);
    }

    // Comments
    @Transactional(readOnly = true)
    public List<Comment> getComments(Long issueId) {
        return commentRepository.findByIssueIdOrderByCreatedAtAsc(issueId);
    }

    @Transactional
    public Comment addComment(Long issueId, IssueDto.CommentDto.CreateRequest request, Long authorId) {
        Issue issue = getById(issueId);
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new EntityNotFoundException("User", authorId));
        Comment comment = new Comment();
        comment.setContent(request.content());
        comment.setIssue(issue);
        comment.setAuthor(author);
        return commentRepository.save(comment);
    }

    @Transactional(readOnly = true)
    public Comment getComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment", commentId));
    }

    @Transactional
    public Comment updateComment(Long commentId, IssueDto.CommentDto.UpdateRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment", commentId));
        comment.setContent(request.content());
        return commentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        commentRepository.deleteById(commentId);
    }
}