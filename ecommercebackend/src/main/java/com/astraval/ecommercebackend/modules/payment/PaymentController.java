package com.astraval.ecommercebackend.modules.payment;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.payment.dto.CreateRazorpayOrderRequest;
import com.astraval.ecommercebackend.modules.payment.dto.MarkPaymentFailedRequest;
import com.astraval.ecommercebackend.modules.payment.dto.OrderPaymentDetailsResponse;
import com.astraval.ecommercebackend.modules.payment.dto.PaymentAttemptResponse;
import com.astraval.ecommercebackend.modules.payment.dto.RazorpayOrderCreateResponse;
import com.astraval.ecommercebackend.modules.payment.dto.VerifyRazorpayPaymentRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payment APIs", description = "Razorpay payment order creation, verification and tracking APIs")
public class PaymentController {

    private final RazorpayPaymentService razorpayPaymentService;

    public PaymentController(RazorpayPaymentService razorpayPaymentService) {
        this.razorpayPaymentService = razorpayPaymentService;
    }

    @PostMapping("/razorpay/order")
    @Operation(summary = "Create Razorpay order for an existing ecommerce order")
    public ResponseEntity<ApiResponse<RazorpayOrderCreateResponse>> createRazorpayOrder(
            @Valid @RequestBody CreateRazorpayOrderRequest request) {
        RazorpayOrderCreateResponse response = razorpayPaymentService.createRazorpayOrder(request);
        return ResponseEntity.status(201).body(ApiResponseFactory.created(response, "Razorpay order created successfully"));
    }

    @PostMapping("/razorpay/verify")
    @Operation(summary = "Verify Razorpay payment signature and mark payment as paid")
    public ResponseEntity<ApiResponse<PaymentAttemptResponse>> verifyRazorpayPayment(
            @Valid @RequestBody VerifyRazorpayPaymentRequest request) {
        PaymentAttemptResponse response = razorpayPaymentService.verifyPayment(request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Payment verified successfully"));
    }

    @PostMapping("/razorpay/failure")
    @Operation(summary = "Mark Razorpay payment attempt as failed")
    public ResponseEntity<ApiResponse<PaymentAttemptResponse>> markRazorpayPaymentFailed(
            @Valid @RequestBody MarkPaymentFailedRequest request) {
        PaymentAttemptResponse response = razorpayPaymentService.markPaymentFailed(request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Payment marked as failed"));
    }

    @GetMapping({"/orders/{orderId}", "/orders/{orderId}/"})
    @Operation(summary = "Get full payment attempts and status timeline for an order")
    public ResponseEntity<ApiResponse<OrderPaymentDetailsResponse>> getOrderPaymentDetails(@PathVariable Long orderId) {
        OrderPaymentDetailsResponse response = razorpayPaymentService.getOrderPaymentDetails(orderId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Order payment details fetched successfully"));
    }

    @PostMapping("/razorpay/webhook")
    @Operation(summary = "Razorpay webhook endpoint")
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleRazorpayWebhook(
            @RequestHeader(name = "X-Razorpay-Signature", required = false) String signature,
            @RequestBody String payload) {
        Map<String, Object> response = razorpayPaymentService.handleWebhook(signature, payload);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Webhook processed"));
    }
}
