package com.astraval.ecommercebackend.modules.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = { "user" })
    List<Order> findByUserUserIdOrderByCreatedDtDesc(Long userId);

    @EntityGraph(attributePaths = { "items", "user" })
    Optional<Order> findWithDetailsByOrderId(Long orderId);

    @Override
    @EntityGraph(attributePaths = { "user" })
    List<Order> findAll();

    @EntityGraph(attributePaths = { "user" })
    @Query(
            value = """
            select distinct o from Order o
            join o.items i
            join i.product p
            left join p.sellerProfile sp
            where (
                    sp.sellerProfileId = :sellerProfileId
                    or (sp is null and p.createdBy = :userId)
                  )
            """,
            countQuery = """
            select count(distinct o.orderId) from Order o
            join o.items i
            join i.product p
            left join p.sellerProfile sp
            where (
                    sp.sellerProfileId = :sellerProfileId
                    or (sp is null and p.createdBy = :userId)
                  )
            """)
    org.springframework.data.domain.Page<Order> findBySellerProfileIdOrCreatedBy(
            @Param("sellerProfileId") Long sellerProfileId,
            @Param("userId") Long userId,
            org.springframework.data.domain.Pageable pageable);

    @EntityGraph(attributePaths = { "user" })
    @Query("""
            select distinct o from Order o
            join o.items i
            join i.product p
            left join p.sellerProfile sp
            where (
                    sp.sellerProfileId = :sellerProfileId
                    or (sp is null and p.createdBy = :userId)
                  )
            """)
    List<Order> findAllBySellerProfileIdOrCreatedBy(
            @Param("sellerProfileId") Long sellerProfileId,
            @Param("userId") Long userId);
}
