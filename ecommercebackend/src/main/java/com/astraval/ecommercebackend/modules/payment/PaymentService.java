package com.astraval.ecommercebackend.modules.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.order.Order;
import com.astraval.ecommercebackend.modules.order.OrderRepository;
import com.astraval.ecommercebackend.modules.order.OrderStatus;
import com.astraval.ecommercebackend.modules.payment.dto.CreateRazorpayOrderRequest;
import com.astraval.ecommercebackend.modules.payment.dto.CreateRazorpayOrderResponse;
import com.astraval.ecommercebackend.modules.payment.dto.VerifyPaymentRequest;
import com.astraval.ecommercebackend.modules.payment.dto.VerifyPaymentResponse;
import com.razorpay.RazorpayException;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderRepository orderRepository;
    private final RazorpayService razorpayService;
    private final SecurityUtil securityUtil;

    public PaymentService(
            PaymentTransactionRepository paymentTransactionRepository,
            OrderRepository orderRepository,
            RazorpayService razorpayService,
            SecurityUtil securityUtil) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.orderRepository = orderRepository;
        this.razorpayService = razorpayService;
        this.securityUtil = securityUtil;
    }

    @Transactional
    public CreateRazorpayOrderResponse createRazorpayOrder(CreateRazorpayOrderRequest request, HttpServletRequest httpRequest) {
        Long currentUserId = getCurrentUserId();

        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getUserId().equals(currentUserId)) {
            throw new UnauthorizedException("You are not authorized to access this order");
        }

        if (order.getStatus() != OrderStatus.PLACED) {
            throw new BadRequestException("Order is not in PLACED status");
        }

        if (paymentTransactionRepository.findByOrderOrderId(order.getOrderId()).isPresent()) {
            throw new BadRequestException("Payment already initiated for this order");
        }

        try {
            com.razorpay.Order razorpayOrder = razorpayService.createOrder(
                    order.getTotalAmount(),
                    order.getCurrency(),
                    order.getOrderNumber());

            PaymentTransaction transaction = new PaymentTransaction();
            transaction.setOrder(order);
            transaction.setRazorpayOrderId(razorpayOrder.get("id"));
            transaction.setAmount(order.getTotalAmount());
            transaction.setCurrency(order.getCurrency());
            transaction.setStatus(PaymentStatus.CREATED);
            transaction.setUserId(currentUserId);
            transaction.setIpAddress(getClientIp(httpRequest));
            transaction.setProviderResponse(razorpayOrder.toString());

            paymentTransactionRepository.save(transaction);

            order.setStatus(OrderStatus.PAYMENT_PENDING);
            orderRepository.save(order);

            log.info("Razorpay order created: orderId={}, razorpayOrderId={}, amount={}", 
                    order.getOrderId(), razorpayOrder.get("id"), order.getTotalAmount());

            return new CreateRazorpayOrderResponse(
                    razorpayOrder.get("id"),
                    razorpayService.getKeyId(),
                    order.getTotalAmount().multiply(new BigDecimal("100")).longValue(),
                    order.getCurrency(),
                    order.getOrderId(),
                    order.getOrderNumber());

        } catch (RazorpayException e) {
            log.error("Error creating Razorpay order: orderId={}", order.getOrderId(), e);
            throw new BadRequestException("Failed to create payment order: " + e.getMessage());
        }
    }

    @Transactional
    public VerifyPaymentResponse verifyPayment(VerifyPaymentRequest request, HttpServletRequest httpRequest) {
        Long currentUserId = getCurrentUserId();

        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getUserId().equals(currentUserId)) {
            throw new UnauthorizedException("You are not authorized to access this order");
        }

        PaymentTransaction transaction = paymentTransactionRepository.findByRazorpayOrderId(request.razorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found"));

        if (transaction.getStatus() == PaymentStatus.SUCCESS) {
            return new VerifyPaymentResponse(true, "Payment already verified", "Order confirmed");
        }

        boolean isValid = razorpayService.verifyPaymentSignature(
                request.razorpayOrderId(),
                request.razorpayPaymentId(),
                request.razorpaySignature());

        if (!isValid) {
            log.warn("Invalid payment signature: orderId={}, paymentId={}", 
                    order.getOrderId(), request.razorpayPaymentId());
            throw new BadRequestException("Invalid payment signature");
        }

        BigDecimal orderAmount = order.getTotalAmount().multiply(new BigDecimal("100"));
        if (!orderAmount.equals(new BigDecimal(transaction.getAmount().multiply(new BigDecimal("100")).longValue()))) {
            log.error("Amount mismatch: orderId={}, expected={}, received={}", 
                    order.getOrderId(), orderAmount, transaction.getAmount());
            throw new BadRequestException("Payment amount mismatch");
        }

        transaction.setRazorpayPaymentId(request.razorpayPaymentId());
        transaction.setRazorpaySignature(request.razorpaySignature());
        transaction.setIpAddress(getClientIp(httpRequest));
        paymentTransactionRepository.save(transaction);

        log.info("Payment verified (frontend): orderId={}, paymentId={}", 
                order.getOrderId(), request.razorpayPaymentId());

        return new VerifyPaymentResponse(
                true,
                "Payment verification initiated",
                "Final confirmation will be done via webhook");
    }

    private Long getCurrentUserId() {
        String sub = securityUtil.getCurrentSub();
        try {
            return Long.parseLong(sub);
        } catch (NumberFormatException ex) {
            throw new UnauthorizedException("Invalid authenticated user");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
