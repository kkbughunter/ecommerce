package com.astraval.ecommercebackend.modules.order;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderTrackingEventRepository extends JpaRepository<OrderTrackingEvent, Long> {

    List<OrderTrackingEvent> findByOrderOrderIdOrderByEventTimeAsc(Long orderId);
}
