package com.astraval.ecommercebackend.modules.auth;

import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.modules.auth.dto.AuthTokenResponse;
import com.astraval.ecommercebackend.modules.customer.*;
import com.astraval.ecommercebackend.modules.user.*;
import com.astraval.ecommercebackend.modules.user.role.RoleService;

@Service
public class GoogleLoginService {
    private final GoogleIdentityVerifier verifier;
    private final UserRepository users;
    private final CustomerRepository customers;
    private final PasswordEncoder passwords;
    private final RoleService roles;
    private final AuthService auth;

    public GoogleLoginService(GoogleIdentityVerifier verifier, UserRepository users, CustomerRepository customers,
            PasswordEncoder passwords, RoleService roles, AuthService auth) {
        this.verifier = verifier; this.users = users; this.customers = customers;
        this.passwords = passwords; this.roles = roles; this.auth = auth;
    }

    @Transactional
    public AuthTokenResponse login(String credential, String nonce) {
        var identity = verifier.verify(credential, nonce);
        User user = users.findByGoogleSubject(identity.subject()).orElse(null);
        if (user == null) {
            // Do not trust third-party email ownership merely because Google verified it in the past.
            if (!identity.authoritativeEmail()) {
                throw new UnauthorizedException("Use a Gmail or Google Workspace account, or sign in with email and password.");
            }
            user = users.findByEmailIgnoreCase(identity.email()).orElse(null);
            if (user != null) {
                requireActiveVerified(user);
                if (user.getGoogleSubject() != null && !user.getGoogleSubject().equals(identity.subject())) {
                    throw new UnauthorizedException("This email is linked to another Google account. Use email and password.");
                }
                user.setGoogleSubject(identity.subject());
                users.save(user);
            } else {
                user = new User();
                user.setEmail(identity.email());
                user.setGoogleSubject(identity.subject());
                user.setPassword(passwords.encode(UUID.randomUUID().toString() + UUID.randomUUID()));
                user.setVerified(true);
                user.setIsActive(true);
                user = users.save(user);
                roles.assignDefaultUserRole(user);
                Customer customer = new Customer();
                customer.setUser(user);
                customer.setFirstName(name(identity.firstName(), "Google user"));
                customer.setLastName(name(identity.lastName(), null));
                customer.setIsActive(true);
                customers.save(customer);
            }
        }
        requireActiveVerified(user);
        return auth.buildAuthTokens(user);
    }

    private void requireActiveVerified(User user) {
        if (!Boolean.TRUE.equals(user.getIsActive())) throw new UnauthorizedException("This account is inactive. Contact support.");
        if (!user.isVerified()) throw new UnauthorizedException("Verify your existing account using the email OTP before signing in with Google.");
    }

    private String name(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return value.trim().substring(0, Math.min(value.trim().length(), 100));
    }
}
