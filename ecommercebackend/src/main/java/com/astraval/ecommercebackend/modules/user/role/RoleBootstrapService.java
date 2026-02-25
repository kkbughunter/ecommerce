package com.astraval.ecommercebackend.modules.user.role;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class RoleBootstrapService implements ApplicationRunner {

    private final RoleService roleService;

    public RoleBootstrapService(RoleService roleService) {
        this.roleService = roleService;
    }

    @Override
    public void run(ApplicationArguments args) {
        roleService.ensureDefaultRolesExist();
    }
}
