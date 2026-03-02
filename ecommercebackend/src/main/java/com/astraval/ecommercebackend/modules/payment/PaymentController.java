package com.astraval.ecommercebackend.modules.payment;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.payment.dto.CreateRazorpayOrderRequest;
import com.astraval.ecommercebackend.modules.payment.dto.CreateRazorpayOrderResponse;
import com.astraval.ecommercebackend.modules.payment.dto.VerifyPaymentRequest;
import com.astraval.ecommercebackend.modules.payment.dto.VerifyPaymentResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payment APIs", description = "Operations related to payment processing")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order")
    @Operation(summary = "Create Razorpay order", description = "Creates a Razorpay order for payment processing")
    public ResponseEntity<ApiResponse<CreateRazorpayOrderResponse>> createOrder(
            @Valid @RequestBody CreateRazorpayOrderRequest request,
            HttpServletRequest httpRequest) {
        CreateRazorpayOrderResponse response = paymentService.createRazorpayOrder(request, httpRequest);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Razorpay order created successfully"));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify payment", description = "Verifies payment signature from frontend (UX only, webhook is source of truth)")
    public ResponseEntity<ApiResponse<VerifyPaymentResponse>> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            HttpServletRequest httpRequest) {
        VerifyPaymentResponse response = paymentService.verifyPayment(request, httpRequest);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Payment verification initiated"));
    }
}
