package com.astraval.ecommercebackend.modules.user.role;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.modules.user.User;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final UserRoleMapRepository userRoleMapRepository;

    public RoleService(RoleRepository roleRepository, UserRoleMapRepository userRoleMapRepository) {
        this.roleRepository = roleRepository;
        this.userRoleMapRepository = userRoleMapRepository;
    }

    @Transactional
    public void ensureDefaultRolesExist() {
        upsertRole(RoleCode.ADMIN, "Administrator", "/admin/products");
        upsertRole(RoleCode.USER, "Customer", "/shop");
    }

    @Transactional
    public void assignDefaultUserRole(User user) {
        ensureDefaultRolesExist();
        assignRole(user, RoleCode.USER, user.getUserId());
    }

    @Transactional
    public void assignRole(User user, RoleCode roleCode, Long actorUserId) {
        Role role = roleRepository.findById(roleCode.name())
                .orElseThrow(() -> new BadRequestException("Role " + roleCode + " is not configured"));

        UserRoleMap roleMap = userRoleMapRepository
                .findByUserUserIdAndRoleRoleCode(user.getUserId(), roleCode.name())
                .orElseGet(() -> {
                    UserRoleMap map = new UserRoleMap();
                    map.setUser(user);
                    map.setRole(role);
                    map.setCreatedBy(resolveActor(actorUserId, user.getUserId()));
                    return map;
                });

        roleMap.setIsActive(true);
        roleMap.setModifiedBy(resolveActor(actorUserId, user.getUserId()));
        userRoleMapRepository.save(roleMap);
    }

    @Transactional(readOnly = true)
    public List<String> getActiveRoleCodesForUser(Long userId) {
        return userRoleMapRepository.findByUserUserIdAndIsActiveTrue(userId).stream()
                .map(roleMap -> roleMap.getRole().getRoleCode())
                .filter(Objects::nonNull)
                .map(roleCode -> roleCode.trim().toUpperCase(Locale.ROOT))
                .filter(roleCode -> !roleCode.isBlank())
                .distinct()
                .toList();
    }

    public List<GrantedAuthority> toAuthorities(Collection<String> roleCodes) {
        return normalizeRoleCodes(roleCodes).stream()
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .map(SimpleGrantedAuthority::new)
                .map(GrantedAuthority.class::cast)
                .toList();
    }

    public List<String> normalizeRoleCodes(Collection<String> roleCodes) {
        if (roleCodes == null) {
            return List.of();
        }
        return roleCodes.stream()
                .filter(Objects::nonNull)
                .map(code -> code.trim().toUpperCase(Locale.ROOT))
                .filter(code -> !code.isBlank())
                .map(code -> code.startsWith("ROLE_") ? code.substring(5) : code)
                .distinct()
                .toList();
    }

    private void upsertRole(RoleCode roleCode, String roleName, String landingUrl) {
        Role role = roleRepository.findById(roleCode.name())
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setRoleCode(roleCode.name());
                    return newRole;
                });
        role.setRoleName(roleName);
        role.setLandingUrl(landingUrl);
        roleRepository.save(role);
    }

    private Long resolveActor(Long actorUserId, Long fallbackUserId) {
        if (actorUserId != null && actorUserId > 0) {
            return actorUserId;
        }
        if (fallbackUserId != null && fallbackUserId > 0) {
            return fallbackUserId;
        }
        return 0L;
    }
}
