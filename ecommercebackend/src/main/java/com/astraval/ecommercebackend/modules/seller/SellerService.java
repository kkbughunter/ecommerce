package com.astraval.ecommercebackend.modules.seller;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.common.util.FieldEncryptionService;
import com.astraval.ecommercebackend.common.util.SecurityUtil;

import com.astraval.ecommercebackend.modules.seller.dto.SellerAdminCreateRequest;
import com.astraval.ecommercebackend.modules.seller.dto.SellerListResponse;
import com.astraval.ecommercebackend.modules.seller.dto.SellerProfileRequest;
import com.astraval.ecommercebackend.modules.seller.dto.SellerProfileResponse;
import com.astraval.ecommercebackend.modules.seller.dto.SellerRazorpayConfigRequest;
import com.astraval.ecommercebackend.modules.seller.dto.SellerRazorpayConfigResponse;
import com.astraval.ecommercebackend.modules.user.User;
import com.astraval.ecommercebackend.modules.user.UserRepository;
import com.astraval.ecommercebackend.modules.user.role.RoleCode;
import com.astraval.ecommercebackend.modules.user.role.RoleService;

@Service
public class SellerService {

  private final SellerProfileRepository sellerProfileRepository;
  private final SellerRazorpayConfigRepository sellerRazorpayConfigRepository;
  private final UserRepository userRepository;
  private final RoleService roleService;
  private final FieldEncryptionService fieldEncryptionService;
  private final SecurityUtil securityUtil;
  private final PasswordEncoder passwordEncoder;

  public SellerService(
      SellerProfileRepository sellerProfileRepository,
      SellerRazorpayConfigRepository sellerRazorpayConfigRepository,
      UserRepository userRepository,
      RoleService roleService,
      FieldEncryptionService fieldEncryptionService,
      SecurityUtil securityUtil,
      PasswordEncoder passwordEncoder) {
    this.sellerProfileRepository = sellerProfileRepository;
    this.sellerRazorpayConfigRepository = sellerRazorpayConfigRepository;
    this.userRepository = userRepository;
    this.roleService = roleService;
    this.fieldEncryptionService = fieldEncryptionService;
    this.securityUtil = securityUtil;
    this.passwordEncoder = passwordEncoder;
  }

  // -------------------------------------------------------------------------
  // Seller Profile
  // -------------------------------------------------------------------------

  @Transactional
  public SellerProfileResponse createSellerProfileForUser(SellerAdminCreateRequest request) {
    Long actorUserId = getCurrentUserId();
    String normalizedEmail = normalizeEmail(request.email());
    if (userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
      throw new BadRequestException("User already exists with this email");
    }

    User user = new User();
    user.setEmail(normalizedEmail);
    user.setPassword(passwordEncoder.encode(request.password()));
    user.setVerified(true);
    user.setIsActive(true);
    user = userRepository.save(user);
    Long userId = user.getUserId();

    if (sellerProfileRepository.existsByUserUserId(userId)) {
      throw new BadRequestException("Seller profile already exists for this user");
    }

    // Ensure SELLER role exists and assign it to the user
    roleService.ensureSellerRoleExists();
    roleService.assignRole(user, RoleCode.SELLER, actorUserId);

    SellerProfile profile = new SellerProfile();
    profile.setUser(user);
    profile.setBusinessName(request.businessName());
    profile.setBusinessEmail(request.businessEmail());
    profile.setBusinessPhone(request.businessPhone());
    profile.setCreatedBy(actorUserId);
    profile = sellerProfileRepository.save(profile);

    return toProfileResponse(profile);
  }

  @Transactional
  public SellerProfileResponse updateSellerProfile(SellerProfileRequest request) {
    Long userId = getCurrentUserId();
    SellerProfile profile = sellerProfileRepository.findByUserUserId(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));

    profile.setBusinessName(request.businessName());
    profile.setBusinessEmail(request.businessEmail());
    profile.setBusinessPhone(request.businessPhone());
    profile.setModifiedBy(userId);
    profile = sellerProfileRepository.save(profile);

    return toProfileResponse(profile);
  }

  @Transactional(readOnly = true)
  public SellerProfileResponse getMySellerProfile() {
    Long userId = getCurrentUserId();
    SellerProfile profile = sellerProfileRepository.findByUserUserId(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));
    return toProfileResponse(profile);
  }

  // -------------------------------------------------------------------------
  // Razorpay Config (Super Admin managed)
  // -------------------------------------------------------------------------

  @Transactional
  public SellerRazorpayConfigResponse saveRazorpayConfigForSeller(
      Long sellerProfileId,
      SellerRazorpayConfigRequest request) {
    Long actorUserId = getCurrentUserId();
    SellerProfile profile = sellerProfileRepository.findById(sellerProfileId)
        .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));

    Optional<SellerRazorpayConfig> existing = sellerRazorpayConfigRepository
        .findBySellerProfileSellerProfileId(profile.getSellerProfileId());

    SellerRazorpayConfig config = existing.orElseGet(SellerRazorpayConfig::new);
    config.setSellerProfile(profile);
    config.setRazorpayKeyId(request.razorpayKeyId().trim());
    config.setRazorpayKeySecretEncrypted(fieldEncryptionService.encrypt(request.razorpayKeySecret().trim()));
    if (request.razorpayWebhookSecret() != null && !request.razorpayWebhookSecret().isBlank()) {
      config.setRazorpayWebhookSecretEncrypted(
          fieldEncryptionService.encrypt(request.razorpayWebhookSecret().trim()));
    } else {
      config.setRazorpayWebhookSecretEncrypted(null);
    }
    if (config.getCreatedBy() == null) {
      config.setCreatedBy(actorUserId);
    }
    config.setModifiedBy(actorUserId);
    config.setIsActive(true);
    config = sellerRazorpayConfigRepository.save(config);

    return toConfigResponse(config);
  }

  @Transactional(readOnly = true)
  public SellerRazorpayConfigResponse getRazorpayConfigForSeller(Long sellerProfileId) {
    SellerRazorpayConfig config = sellerRazorpayConfigRepository
        .findBySellerProfileSellerProfileId(sellerProfileId)
        .orElseThrow(() -> new ResourceNotFoundException("Razorpay config not found for this seller"));
    return toConfigResponse(config);
  }

  @Transactional
  public void deleteRazorpayConfigForSeller(Long sellerProfileId) {
    SellerRazorpayConfig config = sellerRazorpayConfigRepository
        .findBySellerProfileSellerProfileId(sellerProfileId)
        .orElseThrow(() -> new ResourceNotFoundException("Razorpay config not found for this seller"));
    sellerRazorpayConfigRepository.delete(config);
  }

  // -------------------------------------------------------------------------
  // Admin: get seller profile by id (for admins)
  // -------------------------------------------------------------------------

  @Transactional(readOnly = true)
  public SellerProfileResponse getSellerProfileById(Long sellerProfileId) {
    SellerProfile profile = sellerProfileRepository.findById(sellerProfileId)
        .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));
    return toProfileResponse(profile);
  }

  @Transactional(readOnly = true)
  public List<SellerListResponse> listAllSellers() {
    return sellerProfileRepository.findAll().stream()
        .map(this::toListResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  public SellerProfileResponse activateSellerProfile(Long sellerProfileId) {
    return updateSellerStatus(sellerProfileId, true);
  }

  @Transactional
  public SellerProfileResponse deactivateSellerProfile(Long sellerProfileId) {
    return updateSellerStatus(sellerProfileId, false);
  }

  // -------------------------------------------------------------------------
  // Internal helpers used by RazorpayPaymentService
  // -------------------------------------------------------------------------

  /**
   * Resolves decrypted Razorpay credentials for a given seller profile.
   * Returns empty if no config exists or the config is inactive.
   */
  @Transactional(readOnly = true)
  public Optional<ResolvedRazorpayCredentials> resolveCredentials(Long sellerProfileId) {
    return sellerRazorpayConfigRepository
        .findBySellerProfileSellerProfileId(sellerProfileId)
        .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
        .map(c -> new ResolvedRazorpayCredentials(
            c.getSellerProfile().getSellerProfileId(),
            c.getRazorpayKeyId(),
            fieldEncryptionService.decrypt(c.getRazorpayKeySecretEncrypted()),
            c.getRazorpayWebhookSecretEncrypted() != null
                ? fieldEncryptionService.decrypt(c.getRazorpayWebhookSecretEncrypted())
                : null));
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private Long getCurrentUserId() {
    String sub = securityUtil.getCurrentSub();
    try {
      return Long.parseLong(sub);
    } catch (NumberFormatException ex) {
      throw new UnauthorizedException("Invalid authenticated user");
    }
  }

  private SellerProfileResponse toProfileResponse(SellerProfile profile) {
    return new SellerProfileResponse(
        profile.getSellerProfileId(),
        profile.getUser().getUserId(),
        profile.getBusinessName(),
        profile.getBusinessEmail(),
        profile.getBusinessPhone(),
        Boolean.TRUE.equals(profile.getIsActive()),
        profile.getCreatedDt());
  }

  private String normalizeEmail(String email) {
    if (email == null) {
      return "";
    }
    return email.trim().toLowerCase(Locale.ROOT);
  }

  private SellerListResponse toListResponse(SellerProfile profile) {
    return new SellerListResponse(
        profile.getSellerProfileId(),
        profile.getUser().getUserId(),
        profile.getBusinessName(),
        profile.getBusinessEmail(),
        profile.getBusinessPhone(),
        profile.getUser().getEmail(),
        Boolean.TRUE.equals(profile.getIsActive()),
        profile.getCreatedDt());
  }

  private SellerProfileResponse updateSellerStatus(Long sellerProfileId, boolean isActive) {
    SellerProfile profile = sellerProfileRepository.findById(sellerProfileId)
        .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));
    profile.setIsActive(isActive);

    User user = profile.getUser();
    if (user != null) {
      user.setIsActive(isActive);
      userRepository.save(user);
    }

    profile = sellerProfileRepository.save(profile);
    return toProfileResponse(profile);
  }

  private SellerRazorpayConfigResponse toConfigResponse(SellerRazorpayConfig config) {
    return new SellerRazorpayConfigResponse(
        config.getSellerRazorpayConfigId(),
        config.getSellerProfile().getSellerProfileId(),
        config.getRazorpayKeyId(),
        Boolean.TRUE.equals(config.getIsActive()),
        config.getCreatedDt(),
        config.getModifiedDt());
  }

  /** Value object holding decrypted Razorpay credentials for runtime use. */
  public record ResolvedRazorpayCredentials(
      Long sellerProfileId,
      String keyId,
      String keySecret,
      String webhookSecret) {
  }
}
