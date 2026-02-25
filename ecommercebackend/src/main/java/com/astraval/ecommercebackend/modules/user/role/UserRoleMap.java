package com.astraval.ecommercebackend.modules.user.role;

import java.time.LocalDateTime;

import com.astraval.ecommercebackend.modules.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

@Data
@Entity
@Table(name = "user_role_map", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_role_map_user_role", columnNames = { "user_id", "role_code" })
})
public class UserRoleMap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_role_map_id")
    private Integer userRoleMapId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_code", referencedColumnName = "role_code", nullable = false)
    private Role role;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_dt", nullable = false)
    private LocalDateTime createdDt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "modified_by")
    private Long modifiedBy;

    @Column(name = "modified_dt")
    private LocalDateTime modifiedDt;

    @PrePersist
    void onCreate() {
        if (createdDt == null) {
            createdDt = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
        if (createdBy == null) {
            createdBy = 0L;
        }
    }

    @PreUpdate
    void onUpdate() {
        modifiedDt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }
}
