package com.astraval.ecommercebackend.modules.seller;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

/**
 * Stores Razorpay credentials per seller.
 * keySecret and webhookSecret are stored AES-encrypted in the database.
 */
@Data
@Entity
@Table(name = "seller_razorpay_configs")
public class SellerRazorpayConfig {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "seller_razorpay_config_id")
  private Long sellerRazorpayConfigId;

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "seller_profile_id", nullable = false, unique = true)
  private SellerProfile sellerProfile;

  /** Razorpay Key ID (public, plain text). */
  @Column(name = "razorpay_key_id", length = 100, nullable = false)
  private String razorpayKeyId;

  /** Razorpay Key Secret – stored AES-encrypted. */
  @Column(name = "razorpay_key_secret_encrypted", length = 512, nullable = false)
  private String razorpayKeySecretEncrypted;

  /** Razorpay Webhook Secret – stored AES-encrypted. */
  @Column(name = "razorpay_webhook_secret_encrypted", length = 512)
  private String razorpayWebhookSecretEncrypted;

  @Column(name = "is_active", nullable = false)
  private Boolean isActive = true;

  @Column(name = "created_by")
  private Long createdBy;

  @Column(name = "created_dt", nullable = false)
  private LocalDateTime createdDt;

  @Column(name = "modified_by")
  private Long modifiedBy;

  @Column(name = "modified_dt")
  private LocalDateTime modifiedDt;

  @PrePersist
  void onCreate() {
    if (createdDt == null) {
      createdDt = LocalDateTime.now();
    }
    if (isActive == null) {
      isActive = true;
    }
  }

  @PreUpdate
  void onUpdate() {
    modifiedDt = LocalDateTime.now();
  }
}
