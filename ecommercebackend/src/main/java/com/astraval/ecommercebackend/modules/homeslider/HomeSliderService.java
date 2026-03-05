package com.astraval.ecommercebackend.modules.homeslider;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.homeslider.dto.CreateHomeSliderRequest;
import com.astraval.ecommercebackend.modules.homeslider.dto.HomeSliderResponse;
import com.astraval.ecommercebackend.modules.homeslider.dto.UpdateHomeSliderRequest;

@Service
public class HomeSliderService {

    private final HomeSliderRepository homeSliderRepository;
    private final SecurityUtil securityUtil;

    public HomeSliderService(
            HomeSliderRepository homeSliderRepository,
            SecurityUtil securityUtil) {
        this.homeSliderRepository = homeSliderRepository;
        this.securityUtil = securityUtil;
    }

    @Transactional(readOnly = true)
    public List<HomeSliderResponse> getActiveSliders(HomeSliderPlacementTag placementTag) {
        LocalDateTime now = LocalDateTime.now();
        return homeSliderRepository.findActiveByTagAndSchedule(placementTag, now).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HomeSliderResponse> getAllSlidersForAdmin(HomeSliderPlacementTag placementTag) {
        return homeSliderRepository.findAllByTag(placementTag).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public HomeSliderResponse createSlider(CreateHomeSliderRequest request) {
        Long actorUserId = getCurrentUserId();
        validateDateRange(request.startDt(), request.endDt());

        HomeSlider slider = new HomeSlider();
        slider.setTitle(request.title().trim());
        slider.setSubtitle(trimToNull(request.subtitle()));
        slider.setDescription(trimToNull(request.description()));
        slider.setImageUrl(request.imageUrl().trim());
        slider.setCtaLabel(trimToNull(request.ctaLabel()));
        slider.setTargetUrl(request.targetUrl().trim());
        slider.setPlacementTag(request.placementTag());
        slider.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        slider.setStartDt(request.startDt());
        slider.setEndDt(request.endDt());
        slider.setIsActive(request.isActive() != null ? request.isActive() : true);
        slider.setCreatedBy(actorUserId);
        slider.setModifiedBy(actorUserId);

        return toResponse(homeSliderRepository.save(slider));
    }

    @Transactional
    public HomeSliderResponse updateSlider(Long homeSliderId, UpdateHomeSliderRequest request) {
        Long actorUserId = getCurrentUserId();
        validateDateRange(request.startDt(), request.endDt());

        HomeSlider slider = homeSliderRepository.findById(homeSliderId)
                .orElseThrow(() -> new ResourceNotFoundException("Home slider not found"));

        slider.setTitle(request.title().trim());
        slider.setSubtitle(trimToNull(request.subtitle()));
        slider.setDescription(trimToNull(request.description()));
        slider.setImageUrl(request.imageUrl().trim());
        slider.setCtaLabel(trimToNull(request.ctaLabel()));
        slider.setTargetUrl(request.targetUrl().trim());
        slider.setPlacementTag(request.placementTag());
        slider.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        slider.setStartDt(request.startDt());
        slider.setEndDt(request.endDt());
        slider.setIsActive(request.isActive() != null ? request.isActive() : true);
        slider.setModifiedBy(actorUserId);

        return toResponse(homeSliderRepository.save(slider));
    }

    @Transactional
    public HomeSliderResponse activateSlider(Long homeSliderId) {
        return updateSliderStatus(homeSliderId, true);
    }

    @Transactional
    public HomeSliderResponse deactivateSlider(Long homeSliderId) {
        return updateSliderStatus(homeSliderId, false);
    }

    private HomeSliderResponse updateSliderStatus(Long homeSliderId, boolean active) {
        Long actorUserId = getCurrentUserId();
        HomeSlider slider = homeSliderRepository.findById(homeSliderId)
                .orElseThrow(() -> new ResourceNotFoundException("Home slider not found"));
        slider.setIsActive(active);
        slider.setModifiedBy(actorUserId);
        return toResponse(homeSliderRepository.save(slider));
    }

    private HomeSliderResponse toResponse(HomeSlider slider) {
        return new HomeSliderResponse(
                slider.getHomeSliderId(),
                slider.getTitle(),
                slider.getSubtitle(),
                slider.getDescription(),
                slider.getImageUrl(),
                slider.getCtaLabel(),
                slider.getTargetUrl(),
                slider.getPlacementTag(),
                slider.getDisplayOrder(),
                slider.getStartDt(),
                slider.getEndDt(),
                slider.getIsActive(),
                slider.getCreatedDt(),
                slider.getModifiedDt());
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
