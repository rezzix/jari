package com.jari.issue;

import com.jari.config.IssueStatus;
import com.jari.config.IssueType;
import com.jari.project.Label;
import com.jari.project.Project;
import com.jari.sprint.Sprint;
import com.jari.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "issue")
public class Issue {

    public enum Priority { CRITICAL, HIGH, MEDIUM, LOW }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "issue_key", nullable = false, unique = true)
    private String issueKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private IssueStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    private IssueType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id")
    private Sprint sprint;

    @Column(nullable = false)
    private int position = 0;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "issue_label",
            joinColumns = @JoinColumn(name = "issue_id"),
            inverseJoinColumns = @JoinColumn(name = "label_id"))
    private Set<Label> labels = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Issue() {}

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIssueKey() { return issueKey; }
    public void setIssueKey(String issueKey) { this.issueKey = issueKey; }
    public IssueStatus getStatus() { return status; }
    public void setStatus(IssueStatus status) { this.status = status; }
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public IssueType getType() { return type; }
    public void setType(IssueType type) { this.type = type; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public User getAssignee() { return assignee; }
    public void setAssignee(User assignee) { this.assignee = assignee; }
    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }
    public Sprint getSprint() { return sprint; }
    public void setSprint(Sprint sprint) { this.sprint = sprint; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    public Set<Label> getLabels() { return labels; }
    public void setLabels(Set<Label> labels) { this.labels = labels; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}