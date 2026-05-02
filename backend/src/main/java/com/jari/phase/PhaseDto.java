package com.jari.phase;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record PhaseDto(
        Long id,
        String name,
        String description,
        Long projectId,
        LocalDate startDate,
        LocalDate endDate,
        int position,
        long deliverableCount,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotBlank String name,
            String description,
            LocalDate startDate,
            LocalDate endDate
    ) {}

    public record UpdateRequest(
            String name,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            Integer position
    ) {}
}