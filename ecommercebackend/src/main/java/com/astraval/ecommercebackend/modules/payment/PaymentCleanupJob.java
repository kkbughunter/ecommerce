package com.astraval.ecommercebackend.modules.payment;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.modules.order.Order;
import com.astraval.ecommercebackend.modules.order.OrderRepository;
import com.astraval.ecommercebackend.modules.order.OrderStatus;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class PaymentCleanupJob {

    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;

    @Value("${PAYMENT_TIMEOUT_MINUTES:30}")
    private int paymentTimeoutMinutes;

    public PaymentCleanupJob(OrderRepository orderRepository, InventoryService inventoryService) {
        this.orderRepository = orderRepository;
        this.inventoryService = inventoryService;
    }

    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    @Transactional
    public void cancelExpiredPayments() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(paymentTimeoutMinutes);
        List<Order> expiredOrders = orderRepository.findByStatusAndCreatedDtBefore(
                OrderStatus.PAYMENT_PENDING, cutoff);

        if (expiredOrders.isEmpty()) {
            return;
        }

        log.info("Found {} expired payment pending orders", expiredOrders.size());

        for (Order order : expiredOrders) {
            try {
                inventoryService.releaseStock(order);
                order.setStatus(OrderStatus.CANCELLED);
                orderRepository.save(order);

                log.info("Cancelled expired order: orderId={}, orderNumber={}", 
                        order.getOrderId(), order.getOrderNumber());
            } catch (Exception e) {
                log.error("Error cancelling expired order: orderId={}", order.getOrderId(), e);
            }
        }
    }
}
