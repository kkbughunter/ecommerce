package com.astraval.ecommercebackend.config;

import java.io.IOException;
import java.util.Collection;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.astraval.ecommercebackend.common.util.JwtUtil;
import com.astraval.ecommercebackend.modules.user.role.RoleService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final RoleService roleService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, RoleService roleService) {
        this.jwtUtil = jwtUtil;
        this.roleService = roleService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/auth/")
                || path.startsWith("/api/test/")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/error");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = getTokenFromRequest(request);

        try {
            if (token != null
                    && SecurityContextHolder.getContext().getAuthentication() == null
                    && jwtUtil.isTokenValid(token)) {
                Claims claims = jwtUtil.parseClaims(token);
                String userId = claims.getSubject();
                String tokenType = claims.get("type", String.class);

                if (userId != null && "access".equals(tokenType)) {
                    Collection<String> roleCodes = jwtUtil.getRoleCodes(claims);
                    if (roleCodes.isEmpty()) {
                        try {
                            roleCodes = roleService.getActiveRoleCodesForUser(Long.parseLong(userId));
                        } catch (NumberFormatException ignored) {
                            roleCodes = List.of();
                        }
                    }

                    UserDetails principal = User.withUsername(userId)
                            .password("N/A")
                            .authorities(roleService.toAuthorities(roleCodes))
                            .build();

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ignored) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
