package com.astraval.ecommercebackend.module.auth.service;

import com.astraval.ecommercebackend.module.user.entity.Admin;
import com.astraval.ecommercebackend.module.user.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrapService implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String email;
    private final String password;
    private final String fullName;

    public AdminBootstrapService(
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder,
            @Value("${bootstrap.admin.username:admin}") String username,
            @Value("${bootstrap.admin.email:admin@yourstore.com}") String email,
            @Value("${bootstrap.admin.password:Admin@123}") String password,
            @Value("${bootstrap.admin.full-name:Store Admin}") String fullName
    ) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    @Override
    public void run(String... args) {
        if (adminRepository.existsByUsername(username) || adminRepository.existsByEmail(email)) {
            return;
        }

        Admin admin = new Admin();
        admin.setUsername(username);
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setFullName(fullName);
        adminRepository.save(admin);
    }
}
