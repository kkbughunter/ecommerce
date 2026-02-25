package com.astraval.ecommercebackend.module.payment.service;

import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.module.inventory.repository.InventoryRepository;
import com.astraval.ecommercebackend.module.order.entity.Order;
import com.astraval.ecommercebackend.module.order.entity.OrderPaymentStatus;
import com.astraval.ecommercebackend.module.order.entity.OrderStatus;
import com.astraval.ecommercebackend.module.order.repository.OrderRepository;
import com.astraval.ecommercebackend.module.payment.dto.RazorpayWebhookRequest;
import com.astraval.ecommercebackend.module.payment.dto.RazorpayWebhookResponse;
import com.astraval.ecommercebackend.module.payment.entity.Payment;
import com.astraval.ecommercebackend.module.payment.entity.PaymentStatus;
import com.astraval.ecommercebackend.module.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Locale;

@Service
public class RazorpayWebhookService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryRepository inventoryRepository;

    public RazorpayWebhookService(
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            InventoryRepository inventoryRepository
    ) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Transactional
    public RazorpayWebhookResponse processWebhook(RazorpayWebhookRequest request) {
        Order order = orderRepository.findByOrderNumber(request.orderNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + request.orderNumber()));

        Payment payment = resolvePayment(order, request);
        payment.setProvider("razorpay");
        payment.setMethod(request.method());
        payment.setProviderPaymentId(request.providerPaymentId());
        payment.setMetadata(request.rawPayload());

        String status = request.status().trim().toUpperCase(Locale.ROOT);
        if (status.equals("SUCCESS") || status.equals("PAID") || status.equals("CAPTURED")) {
            settleSuccess(order, payment);
        } else if (status.equals("FAILED") || status.equals("CANCELLED")) {
            settleFailure(order, payment);
        }

        paymentRepository.save(payment);
        orderRepository.save(order);
        return new RazorpayWebhookResponse(
                order.getOrderNumber(),
                order.getStatus().name(),
                order.getPaymentStatus().name()
        );
    }

    private Payment resolvePayment(Order order, RazorpayWebhookRequest request) {
        if (request.providerPaymentId() != null && !request.providerPaymentId().isBlank()) {
            return paymentRepository.findByProviderPaymentId(request.providerPaymentId())
                    .orElseGet(() -> createPayment(order));
        }
        return paymentRepository.findTopByOrderOrderIdOrderByCreatedAtDesc(order.getOrderId())
                .orElseGet(() -> createPayment(order));
    }

    private Payment createPayment(Order order) {
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setCurrency(order.getCurrency());
        payment.setStatus(PaymentStatus.INITIATED);
        payment.setProvider("razorpay");
        return payment;
    }

    private void settleSuccess(Order order, Payment payment) {
        payment.setStatus(PaymentStatus.SUCCESS);
        if (order.getPaymentStatus() == OrderPaymentStatus.PAID) {
            return;
        }

        order.getItems().forEach(item -> {
            var inventory = inventoryRepository.findByProductIdForUpdate(item.getProduct().getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory missing: " + item.getProduct().getProductId()));
            int releaseQty = Math.min(inventory.getReservedQty(), item.getQuantity());
            inventory.setReservedQty(inventory.getReservedQty() - releaseQty);
            inventory.setAvailableQty(Math.max(0, inventory.getAvailableQty() - releaseQty));
            inventory.setLastSoldAt(OffsetDateTime.now());
        });

        order.setPaymentStatus(OrderPaymentStatus.PAID);
        order.setStatus(OrderStatus.PAID);
    }

    private void settleFailure(Order order, Payment payment) {
        payment.setStatus(PaymentStatus.FAILED);
        if (order.getPaymentStatus() == OrderPaymentStatus.PAID) {
            return;
        }

        order.getItems().forEach(item -> {
            var inventory = inventoryRepository.findByProductIdForUpdate(item.getProduct().getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory missing: " + item.getProduct().getProductId()));
            int releaseQty = Math.min(inventory.getReservedQty(), item.getQuantity());
            inventory.setReservedQty(inventory.getReservedQty() - releaseQty);
        });

        order.setPaymentStatus(OrderPaymentStatus.FAILED);
        order.setStatus(OrderStatus.CANCELLED);
    }
}
