package com.astraval.ecommercebackend.modules.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;

@Component
public class GoogleIdentityVerifier {
    private final String clientId;
    private final JwtDecoder decoder;

    @org.springframework.beans.factory.annotation.Autowired
    public GoogleIdentityVerifier(@Value("${auth.google.client-id:}") String clientId) {
        this(clientId, NimbusJwtDecoder.withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs").build());
    }

    GoogleIdentityVerifier(String clientId, JwtDecoder decoder) {
        this.clientId = clientId.trim();
        this.decoder = decoder;
    }

    public String clientId() { return clientId; }

    public Identity verify(String credential, String nonce) {
        try {
            if (clientId.isBlank() || nonce == null || nonce.isBlank()) throw new IllegalArgumentException();
            Jwt jwt = decoder.decode(credential);
            String issuer = jwt.getClaimAsString("iss");
            String email = jwt.getClaimAsString("email");
            String subject = jwt.getSubject();
            String tokenNonce = jwt.getClaimAsString("nonce");
            Instant now = Instant.now();
            if (!Set.of("accounts.google.com", "https://accounts.google.com").contains(issuer)
                    || !jwt.getAudience().contains(clientId)
                    || (jwt.hasClaim("azp") && !clientId.equals(jwt.getClaimAsString("azp")))
                    || jwt.getExpiresAt() == null || !jwt.getExpiresAt().isAfter(now)
                    || jwt.getIssuedAt() == null || jwt.getIssuedAt().isBefore(now.minusSeconds(300))
                    || jwt.getIssuedAt().isAfter(now.plusSeconds(60))
                    || !Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))
                    || subject == null || subject.isBlank() || subject.length() > 255
                    || email == null || email.length() > 100 || !email.contains("@")
                    || tokenNonce == null || !MessageDigest.isEqual(nonce.getBytes(StandardCharsets.UTF_8), tokenNonce.getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException();
            }
            email = email.trim().toLowerCase(Locale.ROOT);
            // Google is authoritative for Gmail and verified Workspace domains only.
            String domain = jwt.getClaimAsString("hd");
            boolean authoritative = email.endsWith("@gmail.com") || (domain != null && !domain.isBlank());
            return new Identity(subject, email, jwt.getClaimAsString("given_name"), jwt.getClaimAsString("family_name"), authoritative);
        } catch (RuntimeException ex) {
            throw new UnauthorizedException("Google sign-in could not be verified. Please try again.");
        }
    }

    public record Identity(String subject, String email, String firstName, String lastName, boolean authoritativeEmail) {}
}
