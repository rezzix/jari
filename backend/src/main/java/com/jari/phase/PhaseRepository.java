package com.jari.phase;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhaseRepository extends JpaRepository<Phase, Long> {

    List<Phase> findByProjectIdOrderByPositionAsc(Long projectId);

    long countByProjectId(Long projectId);
}