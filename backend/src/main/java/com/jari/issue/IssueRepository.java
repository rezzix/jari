package com.jari.issue;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    long countByProjectIdAndStatusId(Long projectId, Long statusId);

    Page<Issue> findByProjectId(Long projectId, Pageable pageable);

    long countByProjectId(Long projectId);

    @Query("SELECT MAX(CAST(SUBSTRING(i.issueKey, LOCATE('-', i.issueKey) + 1) AS int)) FROM Issue i WHERE i.project.id = :projectId")
    Integer findMaxSequenceByProjectId(Long projectId);

    @Query("SELECT i FROM Issue i WHERE " +
           "i.project.id = :projectId AND " +
           "(:search IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:statusId IS NULL OR i.status.id = :statusId) AND " +
           "(:assigneeId IS NULL OR i.assignee.id = :assigneeId) AND " +
           "(:typeId IS NULL OR i.type.id = :typeId) AND " +
           "(:priority IS NULL OR i.priority = :priority) AND " +
           "(:sprintId IS NULL OR i.sprint.id = :sprintId) AND " +
           "(:labelId IS NULL OR :labelId IN (SELECT l.id FROM i.labels l)) AND " +
           "(:createdAfter IS NULL OR i.createdAt >= :createdAfter) AND " +
           "(:createdBefore IS NULL OR i.createdAt <= :createdBefore)")
    Page<Issue> search(Long projectId, String search, Long statusId, Long assigneeId, Long typeId,
                       Issue.Priority priority, Long sprintId, Long labelId, Instant createdAfter, Instant createdBefore, Pageable pageable);

    Page<Issue> findByProjectIdAndSprintIdIsNull(Long projectId, Pageable pageable);
}