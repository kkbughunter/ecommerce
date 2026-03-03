package com.astraval.ecommercebackend.modules.cart;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.astraval.ecommercebackend.modules.user.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

@Data
@Entity
@Table(name = "carts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_carts_user", columnNames = "user_id")
})
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_id")
    private Long cartId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "currency", length = 3, nullable = false)
    private String currency = "INR";

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_dt", nullable = false)
    private LocalDateTime createdDt;

    @Column(name = "modified_by")
    private Long modifiedBy;

    @Column(name = "modified_dt")
    private LocalDateTime modifiedDt;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (createdDt == null) {
            createdDt = LocalDateTime.now();
        }
        if (currency == null || currency.isBlank()) {
            currency = "INR";
        }
    }

    @PreUpdate
    void onUpdate() {
        modifiedDt = LocalDateTime.now();
    }
}
