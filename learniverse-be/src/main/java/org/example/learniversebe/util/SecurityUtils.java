package org.example.learniversebe.util;

import lombok.extern.slf4j.Slf4j;
import org.example.learniversebe.model.CustomUserDetails;
import org.example.learniversebe.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Slf4j
public final class SecurityUtils {

    private SecurityUtils() {
        throw new IllegalStateException("Utility class");
    }

    public static User getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()) {
                log.error("User is not authenticated");
                return null;
            }

            Object principal = authentication.getPrincipal();

            if (principal instanceof CustomUserDetails) {
                log.debug("User details: {}", ((CustomUserDetails) principal).getUser().getId());
                return ((CustomUserDetails) principal).getUser();
            }

            return null;
        } catch (Exception e) {
            log.error("Error getting current user", e);
            return null;
        }
    }
}
