package com.astraval.ecommercebackend.modules.auth;

import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.common.util.*;
import com.astraval.ecommercebackend.modules.auth.dto.AuthTokenResponse;

@RestController
@RequestMapping("/api/auth/google")
public class GoogleAuthController {
    private static final String COOKIE = "google_login_nonce";
    private final GoogleIdentityVerifier verifier;
    private final GoogleLoginService login;
    private final Set<String> allowedOrigins;
    private final boolean secure;
    private final String sameSite;
    private final SecureRandom random = new SecureRandom();

    public GoogleAuthController(GoogleIdentityVerifier verifier, GoogleLoginService login,
            @Value("${auth.google.allowed-origins}") String origins,
            @Value("${auth.google.cookie-secure:false}") boolean secure,
            @Value("${auth.google.cookie-same-site:Lax}") String sameSite) {
        this.verifier = verifier; this.login = login; this.secure = secure; this.sameSite = sameSite;
        this.allowedOrigins = Arrays.stream(origins.split(",")).map(String::trim).collect(Collectors.toSet());
        if (!Set.of("Lax", "Strict", "None").contains(sameSite) || (sameSite.equals("None") && !secure)) {
            throw new IllegalArgumentException("Google cookies require a valid SameSite value and Secure for SameSite=None");
        }
    }

    @PostMapping("/config")
    public ApiResponse<Config> config(@RequestHeader(value = "Origin", required = false) String origin, HttpServletResponse response) {
        checkOrigin(origin);
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        if (verifier.clientId().isBlank()) return ApiResponseFactory.ok(new Config(false, "", ""), "Google sign-in is not configured");
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        String nonce = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(nonce, 300).toString());
        return ApiResponseFactory.ok(new Config(true, verifier.clientId(), nonce), "Google sign-in configuration");
    }

    @PostMapping("/login")
    public ApiResponse<AuthTokenResponse> login(@RequestHeader(value = "Origin", required = false) String origin,
            @CookieValue(value = COOKIE, required = false) String nonce,
            @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        checkOrigin(origin);
        if (nonce == null || nonce.length() != 43) throw new UnauthorizedException("Google sign-in session expired. Reload this page and try again.");
        var tokens = login.login(request.credential(), nonce);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie("", 0).toString());
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return ApiResponseFactory.ok(tokens, "Login successful");
    }

    private void checkOrigin(String origin) {
        if (origin == null || !allowedOrigins.contains(origin)) throw new UnauthorizedException("Google sign-in origin is not allowed.");
    }

    private ResponseCookie cookie(String value, long age) {
        return ResponseCookie.from(COOKIE, value).httpOnly(true).secure(secure).sameSite(sameSite)
                .path("/api/auth/google").maxAge(age).build();
    }

    public record Config(boolean enabled, String clientId, String nonce) {}
    public record LoginRequest(@NotBlank @Size(max = 16384) String credential) {}
}
