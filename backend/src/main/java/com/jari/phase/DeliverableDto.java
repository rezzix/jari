package com.jari.phase;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DeliverableDto(
        Long id,
        String name,
        String description,
        Long phaseId,
        String phaseName,
        String state,
        String dueDate,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotBlank String name,
            String description,
            @NotNull Long phaseId,
            String dueDate
    ) {}

    public record UpdateRequest(
            String name,
            String description,
            String state,
            String dueDate
    ) {}
}