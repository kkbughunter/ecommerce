package com.astraval.ecommercebackend.modules.payment;

import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.modules.order.Order;
import com.astraval.ecommercebackend.modules.order.OrderRepository;
import com.astraval.ecommercebackend.modules.order.OrderStatus;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PaymentWebhookService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderRepository orderRepository;
    private final RazorpayService razorpayService;
    private final InventoryService inventoryService;

    public PaymentWebhookService(
            PaymentTransactionRepository paymentTransactionRepository,
            OrderRepository orderRepository,
            RazorpayService razorpayService,
            InventoryService inventoryService) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.orderRepository = orderRepository;
        this.razorpayService = razorpayService;
        this.inventoryService = inventoryService;
    }

    @Transactional
    public void processWebhook(String payload, String signature) {
        if (!razorpayService.verifyWebhookSignature(payload, signature)) {
            log.error("Invalid webhook signature");
            throw new BadRequestException("Invalid webhook signature");
        }

        JSONObject webhookData = new JSONObject(payload);
        String event = webhookData.getString("event");
        JSONObject paymentData = webhookData.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");

        String razorpayPaymentId = paymentData.getString("id");
        String razorpayOrderId = paymentData.getString("order_id");

        log.info("Processing webhook: event={}, paymentId={}, orderId={}", 
                event, razorpayPaymentId, razorpayOrderId);

        if (paymentTransactionRepository.existsByRazorpayPaymentIdAndStatus(razorpayPaymentId, PaymentStatus.SUCCESS)) {
            log.info("Payment already processed: paymentId={}", razorpayPaymentId);
            return;
        }

        PaymentTransaction transaction = paymentTransactionRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new BadRequestException("Payment transaction not found"));

        Order order = transaction.getOrder();

        switch (event) {
            case "payment.captured":
                handlePaymentCaptured(transaction, order, paymentData);
                break;
            case "payment.failed":
                handlePaymentFailed(transaction, order, paymentData);
                break;
            default:
                log.info("Unhandled webhook event: {}", event);
        }
    }

    private void handlePaymentCaptured(PaymentTransaction transaction, Order order, JSONObject paymentData) {
        transaction.setStatus(PaymentStatus.SUCCESS);
        transaction.setRazorpayPaymentId(paymentData.getString("id"));
        transaction.setPaymentMethod(paymentData.optString("method", null));
        transaction.setProviderResponse(paymentData.toString());
        transaction.setWebhookEventId(paymentData.optString("event_id", null));
        paymentTransactionRepository.save(transaction);

        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentStatus(com.astraval.ecommercebackend.modules.order.PaymentStatus.PAID);
        orderRepository.save(order);

        inventoryService.commitReservation(order);

        log.info("Payment captured: orderId={}, paymentId={}, amount={}", 
                order.getOrderId(), transaction.getRazorpayPaymentId(), transaction.getAmount());
    }

    private void handlePaymentFailed(PaymentTransaction transaction, Order order, JSONObject paymentData) {
        transaction.setStatus(PaymentStatus.FAILED);
        transaction.setRazorpayPaymentId(paymentData.getString("id"));
        transaction.setFailureReason(paymentData.optString("error_description", "Payment failed"));
        transaction.setProviderResponse(paymentData.toString());
        paymentTransactionRepository.save(transaction);

        log.warn("Payment failed: orderId={}, paymentId={}, reason={}", 
                order.getOrderId(), transaction.getRazorpayPaymentId(), transaction.getFailureReason());
    }
}
