package com.jari.config;

public record PublicConfigDto(
        OrganizationConfig organization,
        boolean devmode,
        String version,
        String build,
        String currency
) {}