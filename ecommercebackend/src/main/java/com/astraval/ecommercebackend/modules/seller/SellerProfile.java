package com.astraval.ecommercebackend.modules.seller;

import java.time.LocalDateTime;

import com.astraval.ecommercebackend.modules.user.User;

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

@Data
@Entity
@Table(name = "seller_profiles")
public class SellerProfile {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "seller_profile_id")
  private Long sellerProfileId;

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

  @Column(name = "business_name", length = 200)
  private String businessName;

  @Column(name = "business_email", length = 100)
  private String businessEmail;

  @Column(name = "business_phone", length = 20)
  private String businessPhone;

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
