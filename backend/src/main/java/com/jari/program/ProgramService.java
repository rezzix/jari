package com.jari.program;

import com.jari.common.exception.DuplicateKeyException;
import com.jari.common.exception.EntityNotFoundException;
import com.jari.user.User;
import com.jari.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgramService {

    private final ProgramRepository programRepository;
    private final UserRepository userRepository;

    public ProgramService(ProgramRepository programRepository, UserRepository userRepository) {
        this.programRepository = programRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<Program> search(String search, int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);
        if (search != null && !search.isBlank()) {
            return programRepository.search(search, pageRequest);
        }
        return programRepository.findAll(pageRequest);
    }

    @Transactional(readOnly = true)
    public Program getById(Long id) {
        return programRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Program", id));
    }

    @Transactional
    public Program create(ProgramDto.CreateRequest request) {
        if (programRepository.existsByKey(request.key())) {
            throw new DuplicateKeyException("Program key already exists: " + request.key());
        }
        User manager = userRepository.findById(request.managerId())
                .orElseThrow(() -> new EntityNotFoundException("User", request.managerId()));

        Program program = new Program();
        program.setName(request.name());
        program.setKey(request.key().toUpperCase());
        program.setDescription(request.description());
        program.setManager(manager);
        return programRepository.save(program);
    }

    @Transactional
    public Program update(Long id, ProgramDto.UpdateRequest request) {
        Program program = getById(id);
        if (request.name() != null) program.setName(request.name());
        if (request.description() != null) program.setDescription(request.description());
        if (request.managerId() != null) {
            User manager = userRepository.findById(request.managerId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.managerId()));
            program.setManager(manager);
        }
        return programRepository.save(program);
    }

    @Transactional
    public void delete(Long id) {
        Program program = getById(id);
        programRepository.delete(program);
    }
}