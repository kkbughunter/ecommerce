package com.astraval.ecommercebackend.modules.user.role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "roles")
public class Role {

    @Id
    @Column(name = "role_code", length = 50, nullable = false)
    private String roleCode;

    @Column(name = "landing_url", length = 200)
    private String landingUrl;

    @Column(name = "role_name", length = 100, nullable = false)
    private String roleName;
}
