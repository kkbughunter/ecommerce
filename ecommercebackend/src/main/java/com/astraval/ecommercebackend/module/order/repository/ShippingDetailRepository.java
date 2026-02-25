package com.astraval.ecommercebackend.module.order.repository;

import com.astraval.ecommercebackend.module.order.entity.ShippingDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ShippingDetailRepository extends JpaRepository<ShippingDetail, UUID> {
}
