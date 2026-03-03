package com.astraval.ecommercebackend.modules.payment;

import java.time.LocalDateTime;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "payment_status_tracking", indexes = {
        @Index(name = "idx_payment_tracking_payment_time", columnList = "payment_transaction_id,event_time"),
        @Index(name = "idx_payment_tracking_event_source", columnList = "event_source")
})
public class PaymentStatusTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_status_tracking_id")
    private Long paymentStatusTrackingId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_transaction_id", nullable = false)
    private PaymentTransaction paymentTransaction;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 30)
    private PaymentTransactionStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", length = 30, nullable = false)
    private PaymentTransactionStatus newStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_source", length = 20, nullable = false)
    private PaymentEventSource eventSource = PaymentEventSource.SYSTEM;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", length = 40, nullable = false)
    private PaymentEventType eventType = PaymentEventType.WEBHOOK_EVENT;

    @Column(name = "provider_event_id", length = 120)
    private String providerEventId;

    @Lob
    @Column(name = "note")
    private String note;

    @Lob
    @Column(name = "payload")
    private String payload;

    @Column(name = "event_time", nullable = false)
    private LocalDateTime eventTime;

    @Column(name = "created_by")
    private Long createdBy;

    @PrePersist
    void onCreate() {
        if (eventTime == null) {
            eventTime = LocalDateTime.now();
        }
        if (eventSource == null) {
            eventSource = PaymentEventSource.SYSTEM;
        }
        if (eventType == null) {
            eventType = PaymentEventType.WEBHOOK_EVENT;
        }
    }
}
