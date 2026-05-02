package com.jari.phase;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliverableRepository extends JpaRepository<Deliverable, Long> {

    List<Deliverable> findByPhaseId(Long phaseId);

    List<Deliverable> findByPhaseProjectId(Long projectId);

    long countByPhaseId(Long phaseId);

    void deleteByPhaseId(Long phaseId);
}