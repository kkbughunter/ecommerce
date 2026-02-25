package com.astraval.ecommercebackend.module.payment.controller;

import com.astraval.ecommercebackend.module.payment.dto.RazorpayWebhookRequest;
import com.astraval.ecommercebackend.module.payment.dto.RazorpayWebhookResponse;
import com.astraval.ecommercebackend.module.payment.service.RazorpayWebhookService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhook/razorpay")
public class RazorpayWebhookController {

    private final RazorpayWebhookService razorpayWebhookService;

    public RazorpayWebhookController(RazorpayWebhookService razorpayWebhookService) {
        this.razorpayWebhookService = razorpayWebhookService;
    }

    @PostMapping
    public ResponseEntity<RazorpayWebhookResponse> handleWebhook(@Valid @RequestBody RazorpayWebhookRequest request) {
        return ResponseEntity.ok(razorpayWebhookService.processWebhook(request));
    }
}
