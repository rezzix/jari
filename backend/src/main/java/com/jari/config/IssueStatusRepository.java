package com.jari.config;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IssueStatusRepository extends JpaRepository<IssueStatus, Long> {
    Optional<IssueStatus> findByIsDefaultTrue();
    List<IssueStatus> findByCategory(IssueStatus.Category category);
}