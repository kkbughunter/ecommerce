package com.astraval.ecommercebackend.modules.address;

import java.time.LocalDateTime;

import com.astraval.ecommercebackend.modules.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "address")
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "address_id")
    private Long addressId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "address_type", length = 20, nullable = false)
    private AddressType addressType;

    @Column(name = "full_name", length = 150, nullable = false)
    private String fullName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "line1", length = 255, nullable = false)
    private String line1;

    @Column(name = "line2", length = 255)
    private String line2;

    @Column(name = "landmark", length = 150)
    private String landmark;

    @Column(name = "city", length = 100, nullable = false)
    private String city;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "state", length = 100, nullable = false)
    private String state;

    @Column(name = "country", length = 100, nullable = false)
    private String country;

    @Column(name = "postal_code", length = 20, nullable = false)
    private String postalCode;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }
}

