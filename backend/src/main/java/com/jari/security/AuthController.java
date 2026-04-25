package com.jari.security;

import com.jari.common.dto.ApiResponse;
import com.jari.common.exception.BadRequestException;
import com.jari.user.User;
import com.jari.user.UserDto;
import com.jari.user.UserMapper;
import com.jari.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository, UserMapper userMapper) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserDto>> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Explicitly create session
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.getUsername());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        return ResponseEntity.ok(ApiResponse.of(userMapper.toDto(user)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Object>> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponse.of("Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> me(@AuthenticationPrincipal UserDetails currentUser) {
        Long userId = Long.parseLong(currentUser.getUsername());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        return ResponseEntity.ok(ApiResponse.of(userMapper.toDto(user)));
    }
}