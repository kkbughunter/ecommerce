package com.astraval.ecommercebackend.module.order.service;

import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.module.order.dto.OrderItemResponse;
import com.astraval.ecommercebackend.module.order.dto.OrderResponse;
import com.astraval.ecommercebackend.module.order.entity.Order;
import com.astraval.ecommercebackend.module.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderQueryService {

    private final OrderRepository orderRepository;

    public OrderQueryService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public OrderResponse getByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));
        var items = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getOrderItemId(),
                        item.getProduct().getProductId(),
                        item.getSku(),
                        item.getProductName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getTaxAmount(),
                        item.getTotalPrice()
                ))
                .toList();

        return new OrderResponse(
                order.getOrderId(),
                order.getOrderNumber(),
                order.getCustomer() != null ? order.getCustomer().getCustomerId() : null,
                order.getStatus(),
                order.getPaymentStatus(),
                order.getSubtotalAmount(),
                order.getTaxAmount(),
                order.getShippingAmount(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getShippingAddress(),
                order.getBillingAddress(),
                items,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
