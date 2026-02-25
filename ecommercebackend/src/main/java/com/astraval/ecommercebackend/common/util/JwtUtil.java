package com.astraval.ecommercebackend.common.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:3600}")
    private int jwtExpiration;

    @Value("${jwt.refresh.expiration:86400}")
    private int refreshExpiration;

    public String generateToken(Long userId, String email, Collection<String> roleCodes) {

        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("email", email)
                .claim("roles", normalizeRoles(roleCodes))
                .claim("type", "access")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration * 1000L))
                .setId(UUID.randomUUID().toString())
                .signWith(Keys.hmacShaKeyFor(getKeyBytes()))
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("type", "refresh")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration * 1000L))
                .setId(UUID.randomUUID().toString())
                .signWith(Keys.hmacShaKeyFor(getKeyBytes()))
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(getKeyBytes()))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = parseClaims(token);
        return Long.parseLong(claims.getSubject());
    }

    public int getJwtExpirationSeconds() {
        return jwtExpiration;
    }

    public int getRefreshExpirationSeconds() {
        return refreshExpiration;
    }

    @SuppressWarnings("unchecked")
    public List<String> getRoleCodes(Claims claims) {
        Object rawRoles = claims.get("roles");
        if (!(rawRoles instanceof List<?> roles)) {
            return List.of();
        }
        return normalizeRoles((Collection<String>) roles);
    }

    private byte[] getKeyBytes() {
        byte[] keyBytes = jwtSecret.getBytes();
        if (keyBytes.length < 32) {
            byte[] paddedKey = new byte[32];
            System.arraycopy(keyBytes, 0, paddedKey, 0, keyBytes.length);
            return paddedKey;
        }
        return keyBytes;
    }

    private List<String> normalizeRoles(Collection<String> roleCodes) {
        if (roleCodes == null) {
            return List.of();
        }
        return roleCodes.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .map(roleCode -> roleCode.toUpperCase(Locale.ROOT))
                .filter(roleCode -> !roleCode.isBlank())
                .map(roleCode -> roleCode.startsWith("ROLE_") ? roleCode.substring(5) : roleCode)
                .distinct()
                .toList();
    }
}
