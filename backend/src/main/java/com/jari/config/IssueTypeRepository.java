package com.jari.config;

import org.springframework.data.jpa.repository.JpaRepository;

public interface IssueTypeRepository extends JpaRepository<IssueType, Long> {
}