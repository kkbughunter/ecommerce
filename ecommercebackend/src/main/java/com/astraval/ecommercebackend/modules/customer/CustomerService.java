package com.astraval.ecommercebackend.modules.customer;

import java.util.Locale;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.address.Address;
import com.astraval.ecommercebackend.modules.address.AddressService;
import com.astraval.ecommercebackend.modules.address.AddressType;
import com.astraval.ecommercebackend.modules.address.dto.AddressUpsertRequest;
import com.astraval.ecommercebackend.modules.customer.dto.CustomerResponse;
import com.astraval.ecommercebackend.modules.customer.dto.UpdateCustomerRequest;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final AddressService addressService;
    private final SecurityUtil securityUtil;

    public CustomerService(
            CustomerRepository customerRepository,
            AddressService addressService,
            SecurityUtil securityUtil) {
        this.customerRepository = customerRepository;
        this.addressService = addressService;
        this.securityUtil = securityUtil;
    }

    @Transactional
    public CustomerResponse updateCurrentCustomer(UpdateCustomerRequest request) {
        Long currentUserId = getCurrentUserId();
        Customer customer = customerRepository.findByUserUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
        return updateCustomerInternal(customer, request);
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomer(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        assertCanAccessCustomer(customer);
        return toResponse(customer);
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCurrentCustomer() {
        Long currentUserId = getCurrentUserId();
        Customer customer = customerRepository.findByUserUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
        return toResponse(customer);
    }

    @Transactional
    public CustomerResponse activateCustomer(Long customerId) {
        return updateCustomerStatus(customerId, true);
    }

    @Transactional
    public CustomerResponse deactivateCustomer(Long customerId) {
        return updateCustomerStatus(customerId, false);
    }

    private CustomerResponse updateCustomerInternal(Customer customer, UpdateCustomerRequest request) {
        mapCustomerFields(customer, request.firstName(), request.lastName(), request.gender(), request.dateOfBirth());

        Long userId = customer.getUser().getUserId();
        customer.setBillingAddress(resolveAddressUpsert(
                userId,
                AddressType.BILLING,
                request.billingAddress(),
                customer.getBillingAddress()));
        customer.setShippingAddress(resolveAddressUpsert(
                userId,
                AddressType.SHIPPING,
                request.shippingAddress(),
                customer.getShippingAddress()));

        return toResponse(customerRepository.save(customer));
    }

    private CustomerResponse updateCustomerStatus(Long customerId, boolean isActive) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        assertCanAccessCustomer(customer);

        customer.setIsActive(isActive);
        return toResponse(customerRepository.save(customer));
    }

    private void mapCustomerFields(
            Customer customer,
            String firstName,
            String lastName,
            String gender,
            java.time.LocalDate dateOfBirth) {
        customer.setFirstName(firstName.trim());
        customer.setLastName(trimToNull(lastName));
        customer.setGender(trimToNull(gender));
        customer.setDateOfBirth(dateOfBirth);
    }

    private Address resolveAddressUpsert(
            Long userId,
            AddressType expectedType,
            AddressUpsertRequest addressRequest,
            Address existingAddress) {
        if (addressRequest == null) {
            return existingAddress;
        }

        return addressService.upsertAddressForUser(userId, expectedType, addressRequest);
    }

    private void assertCanAccessCustomer(Customer customer) {
        if (isAdmin()) {
            return;
        }

        Long currentUserId = getCurrentUserId();
        Long customerUserId = customer.getUser().getUserId();
        if (!currentUserId.equals(customerUserId)) {
            throw new UnauthorizedException("You are not allowed to access this customer profile");
        }
    }

    private boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
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

    private CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(
                customer.getCustomerId(),
                customer.getUser().getUserId(),
                customer.getFirstName(),
                customer.getLastName(),
                customer.getGender() != null ? customer.getGender().toUpperCase(Locale.ROOT) : null,
                customer.getDateOfBirth(),
                customer.getBillingAddress() != null ? customer.getBillingAddress().getAddressId() : null,
                customer.getShippingAddress() != null ? customer.getShippingAddress().getAddressId() : null,
                customer.getIsActive(),
                customer.getCreatedAt(),
                customer.getUpdatedAt());
    }
}

