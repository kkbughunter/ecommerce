package com.astraval.ecommercebackend.modules.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.astraval.ecommercebackend.modules.order.Order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "razorpay_order_id", length = 100, nullable = false, unique = true)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", length = 100, unique = true)
    private String razorpayPaymentId;

    @Column(name = "razorpay_signature", length = 200)
    private String razorpaySignature;

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "currency", length = 3, nullable = false)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private PaymentStatus status = PaymentStatus.CREATED;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "provider", length = 30, nullable = false)
    private String provider = "RAZORPAY";

    @Column(name = "provider_response", columnDefinition = "TEXT")
    private String providerResponse;

    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    @Column(name = "refund_id", length = 100)
    private String refundId;

    @Column(name = "webhook_event_id", length = 100)
    private String webhookEventId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "created_dt", nullable = false)
    private LocalDateTime createdDt;

    @Column(name = "updated_dt")
    private LocalDateTime updatedDt;

    @PrePersist
    void onCreate() {
        if (createdDt == null) {
            createdDt = LocalDateTime.now();
        }
        if (status == null) {
            status = PaymentStatus.CREATED;
        }
        if (currency == null || currency.isBlank()) {
            currency = "INR";
        }
        if (provider == null || provider.isBlank()) {
            provider = "RAZORPAY";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedDt = LocalDateTime.now();
    }
}
