package com.astraval.ecommercebackend.modules.payment;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.order.Order;
import com.astraval.ecommercebackend.modules.order.OrderRepository;
import com.astraval.ecommercebackend.modules.order.OrderStatus;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/payments/test")
@Tag(name = "Payment Test APIs", description = "Temporary endpoints for testing without webhook")
public class PaymentTestController {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;

    public PaymentTestController(
            PaymentTransactionRepository paymentTransactionRepository,
            OrderRepository orderRepository,
            InventoryService inventoryService) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.orderRepository = orderRepository;
        this.inventoryService = inventoryService;
    }

    @PostMapping("/confirm-payment/{orderId}")
    @Operation(summary = "Manually confirm payment (TEST ONLY)", 
               description = "Simulates webhook payment confirmation for local testing")
    @Transactional
    public ResponseEntity<ApiResponse<String>> confirmPayment(@PathVariable Long orderId) {
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PAYMENT_PENDING) {
            throw new BadRequestException("Order is not in PAYMENT_PENDING status");
        }

        PaymentTransaction transaction = paymentTransactionRepository.findByOrderOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found"));

        if (transaction.getRazorpayPaymentId() == null) {
            throw new BadRequestException("Payment not completed yet");
        }

        transaction.setStatus(PaymentStatus.SUCCESS);
        paymentTransactionRepository.save(transaction);

        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentStatus(com.astraval.ecommercebackend.modules.order.PaymentStatus.PAID);
        orderRepository.save(order);

        inventoryService.commitReservation(order);

        log.info("TEST: Manually confirmed payment for orderId={}", orderId);

        return ResponseEntity.ok(ApiResponseFactory.ok(
                "Payment confirmed successfully", 
                "Order status updated to CONFIRMED"));
    }
}
