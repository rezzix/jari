package com.jari.pmo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RaidItemRepository extends JpaRepository<RaidItem, Long> {

    List<RaidItem> findByProjectId(Long projectId);

    List<RaidItem> findByProjectIdAndType(Long projectId, RaidItem.RaidType type);

    long countByProjectIdAndType(Long projectId, RaidItem.RaidType type);

    long countByProjectIdAndStatus(Long projectId, RaidItem.RaidStatus status);
}