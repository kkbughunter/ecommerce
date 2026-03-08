package com.astraval.ecommercebackend.modules.auth;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.modules.user.User;
import com.astraval.ecommercebackend.modules.user.UserRepository;
import com.astraval.ecommercebackend.modules.user.role.RoleCode;
import com.astraval.ecommercebackend.modules.user.role.RoleService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class AdminBootstrapService implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleService roleService;

    @Value("${bootstrap.admin.email:admin@yourstore.com}")
    private String bootstrapAdminEmail;

    @Value("${bootstrap.admin.password:Admin@123}")
    private String bootstrapAdminPassword;

    @Value("${bootstrap.super-admin.email:superadmin@yourstore.com}")
    private String bootstrapSuperAdminEmail;

    @Value("${bootstrap.super-admin.password:SuperAdmin@123}")
    private String bootstrapSuperAdminPassword;

    public AdminBootstrapService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            RoleService roleService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleService = roleService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        roleService.ensureDefaultRolesExist();
        ensureBootstrapUserWithRole(bootstrapAdminEmail, bootstrapAdminPassword, RoleCode.ADMIN, "admin");
        ensureBootstrapUserWithRole(
                bootstrapSuperAdminEmail,
                bootstrapSuperAdminPassword,
                RoleCode.SUPER_ADMIN,
                "super-admin");
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private void ensureBootstrapUserWithRole(
            String rawEmail,
            String rawPassword,
            RoleCode roleCode,
            String roleLabel) {
        String email = normalizeEmail(rawEmail);
        if (email.isBlank() || rawPassword == null || rawPassword.isBlank()) {
            return;
        }

        User bootstrapUser = userRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> {
                    User user = new User();
                    user.setEmail(email);
                    user.setPassword(passwordEncoder.encode(rawPassword));
                    user.setVerified(true);
                    user.setIsActive(true);
                    return userRepository.save(user);
                });

        boolean userUpdated = false;
        if (!Boolean.TRUE.equals(bootstrapUser.getIsActive())) {
            bootstrapUser.setIsActive(true);
            userUpdated = true;
        }
        if (!bootstrapUser.isVerified()) {
            bootstrapUser.setVerified(true);
            userUpdated = true;
        }
        if (userUpdated) {
            userRepository.save(bootstrapUser);
        }

        roleService.assignRole(bootstrapUser, roleCode, 0L);
        log.info("Bootstrap {} role ensured for email {}", roleLabel, email);
    }
}
