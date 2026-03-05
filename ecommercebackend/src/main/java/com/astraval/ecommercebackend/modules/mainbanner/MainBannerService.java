package com.astraval.ecommercebackend.modules.mainbanner;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.mainbanner.dto.CreateMainBannerRequest;
import com.astraval.ecommercebackend.modules.mainbanner.dto.MainBannerResponse;
import com.astraval.ecommercebackend.modules.mainbanner.dto.UpdateMainBannerRequest;

@Service
public class MainBannerService {

    private final MainBannerRepository mainBannerRepository;
    private final SecurityUtil securityUtil;

    public MainBannerService(
            MainBannerRepository mainBannerRepository,
            SecurityUtil securityUtil) {
        this.mainBannerRepository = mainBannerRepository;
        this.securityUtil = securityUtil;
    }

    @Transactional(readOnly = true)
    public MainBannerResponse getActiveMainBanner() {
        LocalDateTime now = LocalDateTime.now();
        return mainBannerRepository.findActiveBanners(now).stream()
                .findFirst()
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<MainBannerResponse> getActiveMainBanners() {
        LocalDateTime now = LocalDateTime.now();
        return mainBannerRepository.findActiveBanners(now).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MainBannerResponse> getAllMainBannersForAdmin() {
        return mainBannerRepository.findAllByOrderByDisplayOrderAscCreatedDtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MainBannerResponse createMainBanner(CreateMainBannerRequest request) {
        Long actorUserId = getCurrentUserId();
        validateDateRange(request.startDt(), request.endDt());

        MainBanner banner = new MainBanner();
        banner.setHeadline(request.headline().trim());
        banner.setSubheadline(trimToNull(request.subheadline()));
        banner.setDescription(trimToNull(request.description()));
        banner.setImageUrl(trimToNull(request.imageUrl()));
        banner.setPrimaryCtaLabel(trimToNull(request.primaryCtaLabel()));
        banner.setPrimaryCtaUrl(trimToNull(request.primaryCtaUrl()));
        banner.setSecondaryCtaLabel(trimToNull(request.secondaryCtaLabel()));
        banner.setSecondaryCtaUrl(trimToNull(request.secondaryCtaUrl()));
        banner.setBadgeText(trimToNull(request.badgeText()));
        banner.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        banner.setStartDt(request.startDt());
        banner.setEndDt(request.endDt());
        banner.setIsActive(request.isActive() != null ? request.isActive() : true);
        banner.setCreatedBy(actorUserId);
        banner.setModifiedBy(actorUserId);
        return toResponse(mainBannerRepository.save(banner));
    }

    @Transactional
    public MainBannerResponse updateMainBanner(Long mainBannerId, UpdateMainBannerRequest request) {
        Long actorUserId = getCurrentUserId();
        validateDateRange(request.startDt(), request.endDt());

        MainBanner banner = mainBannerRepository.findById(mainBannerId)
                .orElseThrow(() -> new ResourceNotFoundException("Main banner not found"));

        banner.setHeadline(request.headline().trim());
        banner.setSubheadline(trimToNull(request.subheadline()));
        banner.setDescription(trimToNull(request.description()));
        banner.setImageUrl(trimToNull(request.imageUrl()));
        banner.setPrimaryCtaLabel(trimToNull(request.primaryCtaLabel()));
        banner.setPrimaryCtaUrl(trimToNull(request.primaryCtaUrl()));
        banner.setSecondaryCtaLabel(trimToNull(request.secondaryCtaLabel()));
        banner.setSecondaryCtaUrl(trimToNull(request.secondaryCtaUrl()));
        banner.setBadgeText(trimToNull(request.badgeText()));
        banner.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        banner.setStartDt(request.startDt());
        banner.setEndDt(request.endDt());
        banner.setIsActive(request.isActive() != null ? request.isActive() : true);
        banner.setModifiedBy(actorUserId);
        return toResponse(mainBannerRepository.save(banner));
    }

    @Transactional
    public MainBannerResponse activateMainBanner(Long mainBannerId) {
        return updateMainBannerStatus(mainBannerId, true);
    }

    @Transactional
    public MainBannerResponse deactivateMainBanner(Long mainBannerId) {
        return updateMainBannerStatus(mainBannerId, false);
    }

    private MainBannerResponse updateMainBannerStatus(Long mainBannerId, boolean active) {
        Long actorUserId = getCurrentUserId();
        MainBanner banner = mainBannerRepository.findById(mainBannerId)
                .orElseThrow(() -> new ResourceNotFoundException("Main banner not found"));
        banner.setIsActive(active);
        banner.setModifiedBy(actorUserId);
        return toResponse(mainBannerRepository.save(banner));
    }

    private MainBannerResponse toResponse(MainBanner banner) {
        return new MainBannerResponse(
                banner.getMainBannerId(),
                banner.getHeadline(),
                banner.getSubheadline(),
                banner.getDescription(),
                banner.getImageUrl(),
                banner.getPrimaryCtaLabel(),
                banner.getPrimaryCtaUrl(),
                banner.getSecondaryCtaLabel(),
                banner.getSecondaryCtaUrl(),
                banner.getBadgeText(),
                banner.getDisplayOrder(),
                banner.getStartDt(),
                banner.getEndDt(),
                banner.getIsActive(),
                banner.getCreatedDt(),
                banner.getModifiedDt());
    }

    private void validateDateRange(LocalDateTime startDt, LocalDateTime endDt) {
        if (startDt != null && endDt != null && endDt.isBefore(startDt)) {
            throw new BadRequestException("End date must be greater than or equal to start date");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Long getCurrentUserId() {
        String sub = securityUtil.getCurrentSub();
        try {
            return Long.parseLong(sub);
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Invalid authenticated user identifier");
        }
    }
}
