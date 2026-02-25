package com.astraval.ecommercebackend.module.inventory.entity;

import com.astraval.ecommercebackend.module.product.entity.Product;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "inventory")
public class Inventory {

    @Id
    @Column(name = "product_id", nullable = false, updatable = false)
    private UUID productId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "available_qty", nullable = false)
    private int availableQty;

    @Column(name = "reserved_qty", nullable = false)
    private int reservedQty;

    @Column(name = "safety_stock", nullable = false)
    private int safetyStock;

    @Column(name = "last_restocked_at")
    private OffsetDateTime lastRestockedAt;

    @Column(name = "last_sold_at")
    private OffsetDateTime lastSoldAt;

    @Version
    @Column(name = "version", nullable = false)
    private int version;
}
