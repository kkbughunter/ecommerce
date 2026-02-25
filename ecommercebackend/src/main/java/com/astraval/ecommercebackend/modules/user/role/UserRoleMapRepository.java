package com.astraval.ecommercebackend.modules.user.role;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoleMapRepository extends JpaRepository<UserRoleMap, Integer> {

    List<UserRoleMap> findByUserUserIdAndIsActiveTrue(Long userId);

    Optional<UserRoleMap> findByUserUserIdAndRoleRoleCode(Long userId, String roleCode);
}
