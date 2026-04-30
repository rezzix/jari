package com.jari.security;

import com.jari.common.exception.ForbiddenException;
import com.jari.project.ProjectService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class AuthHelper {

    private final ProjectService projectService;

    public AuthHelper(ProjectService projectService) {
        this.projectService = projectService;
    }

    public Long getCurrentUserId(UserDetails currentUser) {
        return Long.parseLong(currentUser.getUsername());
    }

    public boolean hasAnyRole(UserDetails currentUser, String... roles) {
        for (String role : roles) {
            if (currentUser.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_" + role))) {
                return true;
            }
        }
        return false;
    }

    public void requireProjectReadAccess(UserDetails currentUser, Long projectId) {
        if (hasAnyRole(currentUser, "ADMIN", "MANAGER", "EXECUTIVE")) return;
        Long userId = getCurrentUserId(currentUser);
        if (!projectService.isMember(projectId, userId)) {
            throw new ForbiddenException("You do not have access to this project");
        }
    }

    public void requireProjectMemberOrAdminManager(UserDetails currentUser, Long projectId) {
        if (hasAnyRole(currentUser, "ADMIN", "MANAGER")) return;
        Long userId = getCurrentUserId(currentUser);
        if (!projectService.isMember(projectId, userId)) {
            throw new ForbiddenException("You do not have access to this project");
        }
    }

    public void requireSelfOrAdmin(UserDetails currentUser, Long targetUserId) {
        if (hasAnyRole(currentUser, "ADMIN")) return;
        Long userId = getCurrentUserId(currentUser);
        if (!userId.equals(targetUserId)) {
            throw new ForbiddenException("You can only modify your own data");
        }
    }
}