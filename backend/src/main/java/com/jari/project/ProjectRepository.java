package com.jari.project;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    boolean existsByKey(String key);

    @Query("SELECT p FROM Project p WHERE " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:programId IS NULL OR p.program.id = :programId) AND " +
           "(:managerId IS NULL OR p.manager.id = :managerId)")
    Page<Project> search(String search, Long programId, Long managerId, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId)")
    Page<Project> findByMemberUserId(Long userId, Pageable pageable);
}