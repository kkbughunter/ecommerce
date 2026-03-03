package com.astraval.ecommercebackend.modules.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.astraval.ecommercebackend.modules.order.Order;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "payment_transactions", indexes = {
        @Index(name = "idx_payment_order_created", columnList = "order_id,created_dt"),
        @Index(name = "idx_payment_gateway_order", columnList = "gateway,gateway_order_id", unique = true),
        @Index(name = "idx_payment_gateway_payment", columnList = "gateway,gateway_payment_id"),
        @Index(name = "idx_payment_status", columnList = "status")
})
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_transaction_id")
    private Long paymentTransactionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "gateway", length = 20, nullable = false)
    private PaymentGateway gateway = PaymentGateway.RAZORPAY;

    @Column(name = "gateway_order_id", length = 80, nullable = false, unique = true)
    private String gatewayOrderId;

    @Column(name = "gateway_payment_id", length = 80)
    private String gatewayPaymentId;

    @Column(name = "gateway_signature", length = 255)
    private String gatewaySignature;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private PaymentTransactionStatus status = PaymentTransactionStatus.CREATED;

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "currency", length = 3, nullable = false)
    private String currency = "INR";

    @Column(name = "receipt", length = 80, nullable = false)
    private String receipt;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber = 1;

    @Column(name = "method", length = 40)
    private String method;

    @Column(name = "error_code", length = 100)
    private String errorCode;

    @Lob
    @Column(name = "error_description")
    private String errorDescription;

    @Lob
    @Column(name = "gateway_payload")
    private String gatewayPayload;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_dt", nullable = false)
    private LocalDateTime createdDt;

    @Column(name = "modified_by")
    private Long modifiedBy;

    @Column(name = "modified_dt")
    private LocalDateTime modifiedDt;

    @OneToMany(mappedBy = "paymentTransaction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaymentStatusTracking> statusTrackings = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (createdDt == null) {
            createdDt = LocalDateTime.now();
        }
        if (status == null) {
            status = PaymentTransactionStatus.CREATED;
        }
        if (gateway == null) {
            gateway = PaymentGateway.RAZORPAY;
        }
        if (attemptNumber == null || attemptNumber < 1) {
            attemptNumber = 1;
        }
        if (amount == null) {
            amount = BigDecimal.ZERO;
        }
        if (currency == null || currency.isBlank()) {
            currency = "INR";
        }
    }

    @PreUpdate
    void onUpdate() {
        modifiedDt = LocalDateTime.now();
    }
}
