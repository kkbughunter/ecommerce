package com.astraval.ecommercebackend.modules.payment;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payment Webhook", description = "Razorpay webhook endpoint")
public class PaymentWebhookController {

    private final PaymentWebhookService paymentWebhookService;

    public PaymentWebhookController(PaymentWebhookService paymentWebhookService) {
        this.paymentWebhookService = paymentWebhookService;
    }

    @PostMapping("/webhook")
    @Operation(summary = "Razorpay webhook", description = "Receives payment status updates from Razorpay")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {
        
        log.info("Received Razorpay webhook");
        
        try {
            paymentWebhookService.processWebhook(payload, signature);
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (Exception e) {
            log.error("Error processing webhook", e);
            return ResponseEntity.ok(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
