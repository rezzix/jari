package com.jari.phase;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PhaseMapper {

    @Mapping(target = "projectId", source = "project.id")
    @Mapping(target = "deliverableCount", ignore = true)
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    @Mapping(target = "updatedAt", source = "updatedAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    PhaseDto toDto(Phase phase);

    List<PhaseDto> toDtoList(List<Phase> phases);
}