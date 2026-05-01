package com.jari.company;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompanyDto(
        Long id,
        String name,
        String key,
        String description,
        boolean active,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotBlank @Size(min = 1, max = 255) String name,
            @NotBlank @Size(min = 1, max = 10) String key,
            String description
    ) {}

    public record UpdateRequest(
            String name,
            String description,
            Boolean active
    ) {}
}