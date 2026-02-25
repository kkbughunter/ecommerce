package com.astraval.ecommercebackend.common.util;

import java.util.Locale;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class SecurityUtil {

    public String getCurrentSub() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "";
    }

    public boolean hasRole(String roleCode) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || roleCode == null || roleCode.isBlank()) {
            return false;
        }
        String normalizedRole = roleCode.trim().toUpperCase(Locale.ROOT);
        String targetAuthority = normalizedRole.startsWith("ROLE_") ? normalizedRole : "ROLE_" + normalizedRole;
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> targetAuthority.equals(authority.getAuthority()));
    }
}
