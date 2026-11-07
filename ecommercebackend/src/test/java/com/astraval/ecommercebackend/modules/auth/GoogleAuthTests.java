package com.astraval.ecommercebackend.modules.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.modules.customer.*;
import com.astraval.ecommercebackend.modules.user.*;
import com.astraval.ecommercebackend.modules.user.role.RoleService;

class GoogleAuthTests {
    private final GoogleIdentityVerifier verifier = mock(GoogleIdentityVerifier.class);
    private final UserRepository users = mock(UserRepository.class);
    private final CustomerRepository customers = mock(CustomerRepository.class);
    private final PasswordEncoder passwords = mock(PasswordEncoder.class);
    private final RoleService roles = mock(RoleService.class);
    private final AuthService auth = mock(AuthService.class);
    private final GoogleLoginService service = new GoogleLoginService(verifier, users, customers, passwords, roles, auth);

    private void identity(boolean authoritative) {
        when(verifier.verify("token", "nonce")).thenReturn(new GoogleIdentityVerifier.Identity("google-sub", "person@gmail.com", "Person", "Test", authoritative));
    }

    private User existing() {
        User user = new User(); user.setUserId(7L); user.setEmail("person@gmail.com");
        user.setPassword("existing-password-hash"); user.setVerified(true); user.setIsActive(true);
        when(users.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        return user;
    }

    @Test void newUserReceivesOnlyDefaultRoleAndCustomerProfile() {
        identity(true);
        when(users.save(any())).thenAnswer(call -> { User u = call.getArgument(0); u.setUserId(8L); return u; });
        when(passwords.encode(any())).thenReturn("random-hash");
        service.login("token", "nonce");
        verify(roles).assignDefaultUserRole(argThat(u -> u.isVerified() && "google-sub".equals(u.getGoogleSubject())));
        verify(customers).save(argThat(c -> "Person".equals(c.getFirstName()) && c.getUser().getUserId() == 8L));
        verify(auth).buildAuthTokens(any());
    }

    @Test void verifiedExistingUserKeepsPasswordAndRoles() {
        identity(true); User user = existing();
        service.login("token", "nonce");
        assertEquals("existing-password-hash", user.getPassword());
        assertEquals("google-sub", user.getGoogleSubject());
        verifyNoInteractions(roles, customers, passwords);
        verify(auth).buildAuthTokens(user);
    }

    @Test void unverifiedAccountCannotBeClaimedWithKnownPassword() {
        identity(true); existing().setVerified(false);
        assertThrows(UnauthorizedException.class, () -> service.login("token", "nonce"));
        verifyNoInteractions(auth, roles); verify(users, never()).save(any());
    }

    @Test void inactiveAccountCannotBeReactivated() {
        identity(true); existing().setIsActive(false);
        assertThrows(UnauthorizedException.class, () -> service.login("token", "nonce"));
        verifyNoInteractions(auth); verify(users, never()).save(any());
    }

    @Test void differentSubjectCannotReplaceExistingLink() {
        identity(true); existing().setGoogleSubject("different-sub");
        assertThrows(UnauthorizedException.class, () -> service.login("token", "nonce"));
        verifyNoInteractions(auth);
    }

    @Test void nonAuthoritativeEmailCannotAutoLink() {
        identity(false);
        assertThrows(UnauthorizedException.class, () -> service.login("token", "nonce"));
        verify(users, never()).findByEmailIgnoreCase(any()); verifyNoInteractions(auth);
    }

    @Test void stableSubjectSelectsAccountEvenIfGoogleEmailChanges() {
        identity(true); User user = new User(); user.setVerified(true); user.setIsActive(true);
        when(users.findByGoogleSubject("google-sub")).thenReturn(Optional.of(user));
        service.login("token", "nonce");
        verify(users, never()).findByEmailIgnoreCase(any()); verify(auth).buildAuthTokens(user);
    }

    private Jwt.Builder claims() {
        return Jwt.withTokenValue("token").header("alg", "RS256").issuer("https://accounts.google.com")
                .subject("google-sub").audience(java.util.List.of("client"))
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600))
                .claim("email", "person@gmail.com").claim("email_verified", true).claim("nonce", "nonce");
    }

    @Test void validClaimsAccepted() {
        JwtDecoder decoder = mock(JwtDecoder.class); when(decoder.decode("token")).thenReturn(claims().build());
        assertEquals("google-sub", new GoogleIdentityVerifier("client", decoder).verify("token", "nonce").subject());
    }

    @Test void invalidClaimsRejected() {
        var invalid = java.util.List.of(
            claims().issuer("https://attacker.example").build(),
            claims().audience(java.util.List.of("other-client")).build(),
            claims().claim("azp", "other-client").build(),
            claims().claim("nonce", "other-browser").build(),
            claims().claim("email_verified", false).build(),
            claims().issuedAt(Instant.now().minusSeconds(700)).expiresAt(Instant.now().minusSeconds(1)).build(),
            claims().issuedAt(Instant.now().minusSeconds(400)).build());
        for (Jwt jwt : invalid) {
            JwtDecoder decoder = mock(JwtDecoder.class); when(decoder.decode("token")).thenReturn(jwt);
            assertThrows(UnauthorizedException.class, () -> new GoogleIdentityVerifier("client", decoder).verify("token", "nonce"));
        }
    }

    @Test void invalidSignatureRejected() {
        JwtDecoder decoder = mock(JwtDecoder.class); when(decoder.decode("token")).thenThrow(new JwtException("Invalid signature"));
        assertThrows(UnauthorizedException.class, () -> new GoogleIdentityVerifier("client", decoder).verify("token", "nonce"));
    }

    @Test void realRsaSignatureIsVerifiedAndWrongSigningKeyRejected() throws Exception {
        var generator = java.security.KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        var trusted = generator.generateKeyPair();
        var attacker = generator.generateKeyPair();
        var decoder = NimbusJwtDecoder.withPublicKey((java.security.interfaces.RSAPublicKey) trusted.getPublic()).build();
        var verifier = new GoogleIdentityVerifier("client", decoder);
        assertEquals("google-sub", verifier.verify(signedToken(trusted), "nonce").subject());
        assertThrows(UnauthorizedException.class, () -> verifier.verify(signedToken(attacker), "nonce"));
    }

    private String signedToken(java.security.KeyPair key) throws Exception {
        var claims = new com.nimbusds.jwt.JWTClaimsSet.Builder()
                .issuer("https://accounts.google.com").subject("google-sub").audience("client")
                .issueTime(java.util.Date.from(Instant.now())).expirationTime(java.util.Date.from(Instant.now().plusSeconds(600)))
                .claim("email", "person@gmail.com").claim("email_verified", true).claim("nonce", "nonce").build();
        var token = new com.nimbusds.jwt.SignedJWT(new com.nimbusds.jose.JWSHeader(com.nimbusds.jose.JWSAlgorithm.RS256), claims);
        token.sign(new com.nimbusds.jose.crypto.RSASSASigner(key.getPrivate()));
        return token.serialize();
    }

    @Test void originAndCookieRequiredBeforeLogin() {
        GoogleLoginService login = mock(GoogleLoginService.class);
        var controller = new GoogleAuthController(verifier, login, "http://localhost:5173", false, "Lax");
        var response = new MockHttpServletResponse();
        assertThrows(UnauthorizedException.class, () -> controller.config("https://attacker.example", response));
        assertThrows(UnauthorizedException.class, () -> controller.config(null, response));
        assertThrows(UnauthorizedException.class, () -> controller.login("http://localhost:5173", null, new GoogleAuthController.LoginRequest("token"), response));
        verifyNoInteractions(login);
    }

    @Test void configIssuesHttpOnlyNonceCookieAndNoCache() {
        when(verifier.clientId()).thenReturn("client");
        var controller = new GoogleAuthController(verifier, service, "http://localhost:5173", true, "None");
        var response = new MockHttpServletResponse();
        controller.config("http://localhost:5173", response);
        String cookie = response.getHeader("Set-Cookie");
        assertTrue(cookie.contains("HttpOnly")); assertTrue(cookie.contains("Secure"));
        assertTrue(cookie.contains("Max-Age=300")); assertEquals("no-store", response.getHeader("Cache-Control"));
    }
}
