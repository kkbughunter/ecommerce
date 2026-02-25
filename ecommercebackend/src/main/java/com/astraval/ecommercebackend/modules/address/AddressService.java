package com.astraval.ecommercebackend.modules.address;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.address.dto.AddressUpsertRequest;
import com.astraval.ecommercebackend.modules.address.dto.AddressResponse;
import com.astraval.ecommercebackend.modules.address.dto.CreateAddressRequest;
import com.astraval.ecommercebackend.modules.address.dto.UpdateAddressRequest;
import com.astraval.ecommercebackend.modules.user.User;
import com.astraval.ecommercebackend.modules.user.UserRepository;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final SecurityUtil securityUtil;

    public AddressService(
            AddressRepository addressRepository,
            UserRepository userRepository,
            SecurityUtil securityUtil) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.securityUtil = securityUtil;
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getMyAddresses() {
        Long currentUserId = getCurrentUserId();
        return addressRepository.findByUserUserIdOrderByCreatedAtDesc(currentUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getMyActiveAddresses() {
        Long currentUserId = getCurrentUserId();
        return addressRepository.findByUserUserIdAndIsActiveTrueOrderByCreatedAtDesc(currentUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AddressResponse getMyAddress(Long addressId) {
        return toResponse(findMyAddress(addressId));
    }

    @Transactional
    public AddressResponse createMyAddress(CreateAddressRequest request) {
        Long currentUserId = getCurrentUserId();
        User user = userRepository.findByUserIdAndIsActiveTrue(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Address address = new Address();
        address.setUser(user);
        mapAddressFields(address, request.addressType(), request.fullName(), request.phoneNumber(), request.line1(),
                request.line2(), request.landmark(), request.city(), request.district(), request.state(),
                request.country(), request.postalCode());
        address.setIsActive(request.isActive() != null ? request.isActive() : true);

        return toResponse(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse updateMyAddress(Long addressId, UpdateAddressRequest request) {
        Address address = findMyAddress(addressId);
        mapAddressFields(address, request.addressType(), request.fullName(), request.phoneNumber(), request.line1(),
                request.line2(), request.landmark(), request.city(), request.district(), request.state(),
                request.country(), request.postalCode());

        return toResponse(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse activateMyAddress(Long addressId) {
        return updateAddressStatus(addressId, true);
    }

    @Transactional
    public AddressResponse deactivateMyAddress(Long addressId) {
        return updateAddressStatus(addressId, false);
    }

    @Transactional
    public Address upsertAddressForUser(Long userId, AddressType expectedType, AddressUpsertRequest request) {
        User user = userRepository.findByUserIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Address address;
        if (request.addressId() == null) {
            address = new Address();
            address.setUser(user);
        } else {
            address = addressRepository.findByAddressIdAndUserUserId(request.addressId(), userId)
                    .orElseThrow(() -> new BadRequestException("Address not found for user"));
            if (address.getAddressType() != expectedType) {
                throw new BadRequestException(expectedType.name() + " address type is required");
            }
        }

        mapAddressFields(
                address,
                expectedType,
                request.fullName(),
                request.phoneNumber(),
                request.line1(),
                request.line2(),
                request.landmark(),
                request.city(),
                request.district(),
                request.state(),
                request.country(),
                request.postalCode());

        if (request.isActive() != null) {
            address.setIsActive(request.isActive());
        } else if (address.getIsActive() == null) {
            address.setIsActive(true);
        }

        return addressRepository.save(address);
    }

    private AddressResponse updateAddressStatus(Long addressId, boolean isActive) {
        Address address = findMyAddress(addressId);
        address.setIsActive(isActive);
        return toResponse(addressRepository.save(address));
    }

    private Address findMyAddress(Long addressId) {
        Long currentUserId = getCurrentUserId();
        return addressRepository.findByAddressIdAndUserUserId(addressId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
    }

    private void mapAddressFields(
            Address address,
            String addressType,
            String fullName,
            String phoneNumber,
            String line1,
            String line2,
            String landmark,
            String city,
            String district,
            String state,
            String country,
            String postalCode) {
        mapAddressFields(
                address,
                parseAddressType(addressType),
                fullName,
                phoneNumber,
                line1,
                line2,
                landmark,
                city,
                district,
                state,
                country,
                postalCode);
    }

    private void mapAddressFields(
            Address address,
            AddressType addressType,
            String fullName,
            String phoneNumber,
            String line1,
            String line2,
            String landmark,
            String city,
            String district,
            String state,
            String country,
            String postalCode) {
        address.setAddressType(addressType);
        address.setFullName(fullName.trim());
        address.setPhoneNumber(trimToNull(phoneNumber));
        address.setLine1(line1.trim());
        address.setLine2(trimToNull(line2));
        address.setLandmark(trimToNull(landmark));
        address.setCity(city.trim());
        address.setDistrict(trimToNull(district));
        address.setState(state.trim());
        address.setCountry(country.trim());
        address.setPostalCode(postalCode.trim());
    }

    private AddressType parseAddressType(String addressType) {
        try {
            return AddressType.valueOf(addressType.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Address type must be BILLING or SHIPPING");
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

    private AddressResponse toResponse(Address address) {
        return new AddressResponse(
                address.getAddressId(),
                address.getUser().getUserId(),
                address.getAddressType().name(),
                address.getFullName(),
                address.getPhoneNumber(),
                address.getLine1(),
                address.getLine2(),
                address.getLandmark(),
                address.getCity(),
                address.getDistrict(),
                address.getState(),
                address.getCountry(),
                address.getPostalCode(),
                address.getIsActive(),
                address.getCreatedAt(),
                address.getUpdatedAt());
    }
}
