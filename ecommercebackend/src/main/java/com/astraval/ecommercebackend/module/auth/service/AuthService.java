package com.astraval.ecommercebackend.module.auth.service;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.utils.JwtTokenService;
import com.astraval.ecommercebackend.module.auth.dto.AdminLoginRequest;
import com.astraval.ecommercebackend.module.auth.dto.AdminLoginResponse;
import com.astraval.ecommercebackend.module.user.entity.Admin;
import com.astraval.ecommercebackend.module.user.repository.AdminRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;

@Service
public class AuthService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    public AuthService(
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenService jwtTokenService
    ) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    @Transactional
    public AdminLoginResponse login(AdminLoginRequest request) {
        Admin admin = adminRepository.findByUsername(request.usernameOrEmail())
                .or(() -> adminRepository.findByEmail(request.usernameOrEmail()))
                .orElseThrow(() -> new ResourceNotFoundException("Admin account not found"));

        if (!passwordEncoder.matches(request.password(), admin.getPasswordHash())) {
            throw new BadRequestException("Invalid username/email or password");
        }

        admin.setLastLoginAt(OffsetDateTime.now());
        adminRepository.save(admin);

        String token = jwtTokenService.generateToken(
                admin.getAdminId().toString(),
                Map.of(
                        "username", admin.getUsername(),
                        "email", admin.getEmail(),
                        "role", "ADMIN"
                )
        );
        return new AdminLoginResponse(token, admin.getAdminId(), admin.getUsername(), admin.getEmail());
    }
}
