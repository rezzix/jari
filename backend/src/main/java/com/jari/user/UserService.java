package com.jari.user;

import com.jari.common.exception.BadRequestException;
import com.jari.common.exception.DuplicateKeyException;
import com.jari.common.exception.EntityNotFoundException;
import com.jari.common.exception.ForbiddenException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<User> search(String search, User.Role role, Boolean active, int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);

        if (search != null) {
            return userRepository.search(search, pageRequest);
        }
        if (role != null) {
            return userRepository.findByRole(role, pageRequest);
        }
        if (active != null) {
            return userRepository.findByActive(active, pageRequest);
        }
        return userRepository.findAll(pageRequest);
    }

    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
    }

    @Transactional
    public User create(UserDto.CreateRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateKeyException("Username already exists: " + request.username());
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateKeyException("Email already exists: " + request.email());
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRole(User.Role.valueOf(request.role()));
        return userRepository.save(user);
    }

    @Transactional
    public User update(Long id, UserDto.UpdateRequest request) {
        User user = getById(id);

        if (request.email() != null) {
            if (userRepository.existsByEmail(request.email()) && !user.getEmail().equals(request.email())) {
                throw new DuplicateKeyException("Email already exists: " + request.email());
            }
            user.setEmail(request.email());
        }
        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());
        if (request.role() != null) user.setRole(User.Role.valueOf(request.role()));
        if (request.active() != null) user.setActive(request.active());

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(Long id, UserDto.PasswordChangeRequest request, boolean isAdmin) {
        User user = getById(id);

        if (!isAdmin && (request.currentPassword() == null ||
                !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash()))) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deactivate(Long id) {
        User user = getById(id);
        user.setActive(false);
        userRepository.save(user);
    }
}