package com.astraval.ecommercebackend.modules.product;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.astraval.ecommercebackend.modules.category.Category;

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
import lombok.Data;

@Data
@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long productId;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "price", precision = 10, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "max_price", precision = 10, scale = 2)
    private BigDecimal maxPrice;

    @Column(name = "gst_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal gstPercentage = BigDecimal.ZERO;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    @Column(name = "main_image_upload_id", length = 36)
    private String mainImageUploadId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_dt", nullable = false)
    private LocalDateTime createdDt;

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
        if (stockQuantity == null) {
            stockQuantity = 0;
        }
        if (gstPercentage == null) {
            gstPercentage = BigDecimal.ZERO;
        }
        if (maxPrice == null) {
            maxPrice = price;
        }
    }

    @PreUpdate
    void onUpdate() {
        modifiedDt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
        if (stockQuantity == null) {
            stockQuantity = 0;
        }
        if (gstPercentage == null) {
            gstPercentage = BigDecimal.ZERO;
        }
        if (maxPrice == null) {
            maxPrice = price;
        }
    }
}
