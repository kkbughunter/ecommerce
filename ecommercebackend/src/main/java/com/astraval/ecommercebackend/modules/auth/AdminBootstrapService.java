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
        String adminEmail = normalizeEmail(bootstrapAdminEmail);
        if (adminEmail.isBlank() || bootstrapAdminPassword == null || bootstrapAdminPassword.isBlank()) {
            return;
        }

        roleService.ensureDefaultRolesExist();

        User adminUser = userRepository.findByEmailIgnoreCase(adminEmail)
                .orElseGet(() -> {
                    User user = new User();
                    user.setEmail(adminEmail);
                    user.setPassword(passwordEncoder.encode(bootstrapAdminPassword));
                    user.setVerified(true);
                    user.setIsActive(true);
                    return userRepository.save(user);
                });

        boolean userUpdated = false;
        if (!Boolean.TRUE.equals(adminUser.getIsActive())) {
            adminUser.setIsActive(true);
            userUpdated = true;
        }
        if (!adminUser.isVerified()) {
            adminUser.setVerified(true);
            userUpdated = true;
        }
        if (userUpdated) {
            userRepository.save(adminUser);
        }

        roleService.assignRole(adminUser, RoleCode.ADMIN, 0L);
        log.info("Bootstrap admin role ensured for email {}", adminEmail);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
