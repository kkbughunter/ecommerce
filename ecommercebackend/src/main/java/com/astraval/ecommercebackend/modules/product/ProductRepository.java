package com.astraval.ecommercebackend.modules.product;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByIsActiveTrue();
    Page<Product> findByIsActiveTrue(Pageable pageable);
    
    @Query("""
            select p from Product p
            where p.isActive = true
              and (
                    coalesce(:q, '') = ''
                    or lower(p.name) like lower(concat('%', :q, '%'))
                    or lower(coalesce(p.description, '')) like lower(concat('%', :q, '%'))
                    or lower(coalesce(p.category.categoryName, '')) like lower(concat('%', :q, '%'))
              )
            """)
    Page<Product> searchActiveProducts(@Param("q") String q, Pageable pageable);

    List<Product> findByCategoryCategoryId(Integer categoryId);
    Page<Product> findByCategoryCategoryId(Integer categoryId, Pageable pageable);
    
    @Query("""
            select p from Product p
            where p.category.categoryId = :categoryId
              and (
                    coalesce(:q, '') = ''
                    or lower(p.name) like lower(concat('%', :q, '%'))
                    or lower(coalesce(p.description, '')) like lower(concat('%', :q, '%'))
                    or lower(coalesce(p.category.categoryName, '')) like lower(concat('%', :q, '%'))
              )
            """)
    Page<Product> searchProductsByCategory(@Param("categoryId") Integer categoryId, @Param("q") String q, Pageable pageable);

    List<Product> findByCategoryCategoryIdAndIsActiveTrue(Integer categoryId);
    Page<Product> findByCategoryCategoryIdAndIsActiveTrue(Integer categoryId, Pageable pageable);

    @Query("""
            select p from Product p
            where p.isActive = true
              and p.category.categoryId = :categoryId
              and (
                    coalesce(:q, '') = ''
                    or lower(p.name) like lower(concat('%', :q, '%'))
                    or lower(coalesce(p.description, '')) like lower(concat('%', :q, '%'))
                    or lower(coalesce(p.category.categoryName, '')) like lower(concat('%', :q, '%'))
              )
            """)
    Page<Product> searchActiveProductsByCategory(@Param("categoryId") Integer categoryId, @Param("q") String q, Pageable pageable);

    @Query("""
            select p from Product p
            where (
                    coalesce(:q, '') = ''
                    or lower(p.name) like lower(concat('%', :q, '%'))
                    or lower(coalesce(p.description, '')) like lower(concat('%', :q, '%'))
                    or lower(coalesce(p.category.categoryName, '')) like lower(concat('%', :q, '%'))
                  )
            """)
    Page<Product> searchAllProducts(@Param("q") String q, Pageable pageable);

    List<Product> findByCategoryCategoryIdIn(List<Integer> categoryIds);

    List<Product> findByCategoryCategoryIdInAndIsActiveTrue(List<Integer> categoryIds);
}
