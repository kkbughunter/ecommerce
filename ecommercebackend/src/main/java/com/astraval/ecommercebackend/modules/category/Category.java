package com.astraval.ecommercebackend.modules.category;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@jakarta.persistence.EntityListeners(com.astraval.ecommercebackend.modules.catalog.CatalogCacheInvalidator.class)
@Table(name = "categories")
public class Category {

    @Column(name = "image_object_key", length = 500)
    private String imageObjectKey;

    @Column(name = "category_image_url", length = 1000)
    private String categoryImageUrl;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "category_name", length = 100, nullable = false)
    private String categoryName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_category_id")
    private Category parentCategory;
}
