package com.jari.company;

import com.jari.common.exception.DuplicateKeyException;
import com.jari.common.exception.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public Page<Company> search(String search, int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);
        if (search == null || search.isBlank()) {
            return companyRepository.findAll(pageRequest);
        }
        return companyRepository.findByNameContainingIgnoreCaseOrKeyContainingIgnoreCase(search, search, pageRequest);
    }

    @Transactional(readOnly = true)
    public Company getById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Company", id));
    }

    @Transactional
    public Company create(CompanyDto.CreateRequest request) {
        if (companyRepository.existsByKey(request.key())) {
            throw new DuplicateKeyException("Company key already exists: " + request.key());
        }
        if (companyRepository.existsByName(request.name())) {
            throw new DuplicateKeyException("Company name already exists: " + request.name());
        }
        Company company = new Company();
        company.setName(request.name());
        company.setKey(request.key().toUpperCase());
        company.setDescription(request.description());
        return companyRepository.save(company);
    }

    @Transactional
    public Company update(Long id, CompanyDto.UpdateRequest request) {
        Company company = getById(id);
        if (request.name() != null) {
            if (!request.name().equals(company.getName()) && companyRepository.existsByName(request.name())) {
                throw new DuplicateKeyException("Company name already exists: " + request.name());
            }
            company.setName(request.name());
        }
        if (request.description() != null) company.setDescription(request.description());
        if (request.active() != null) company.setActive(request.active());
        return companyRepository.save(company);
    }

    @Transactional
    public void deactivate(Long id) {
        Company company = getById(id);
        company.setActive(false);
        companyRepository.save(company);
    }
}