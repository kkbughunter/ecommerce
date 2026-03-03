package com.astraval.ecommercebackend.modules.product;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByIsActiveTrue();
    Page<Product> findByIsActiveTrue(Pageable pageable);

    List<Product> findByCategoryCategoryId(Integer categoryId);
    Page<Product> findByCategoryCategoryId(Integer categoryId, Pageable pageable);

    List<Product> findByCategoryCategoryIdAndIsActiveTrue(Integer categoryId);
    Page<Product> findByCategoryCategoryIdAndIsActiveTrue(Integer categoryId, Pageable pageable);
}
