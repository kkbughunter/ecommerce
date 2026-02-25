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
import com.astraval.ecommercebackend.modules.address.AddressRepository;
import com.astraval.ecommercebackend.modules.address.AddressType;
import com.astraval.ecommercebackend.modules.customer.dto.CreateCustomerRequest;
import com.astraval.ecommercebackend.modules.customer.dto.CustomerResponse;
import com.astraval.ecommercebackend.modules.customer.dto.UpdateCustomerRequest;
import com.astraval.ecommercebackend.modules.user.User;
import com.astraval.ecommercebackend.modules.user.UserRepository;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final SecurityUtil securityUtil;

    public CustomerService(
            CustomerRepository customerRepository,
            UserRepository userRepository,
            AddressRepository addressRepository,
            SecurityUtil securityUtil) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.securityUtil = securityUtil;
    }

    @Transactional
    public CustomerResponse createCustomer(CreateCustomerRequest request) {
        assertCanManageUser(request.userId());

        if (customerRepository.findByUserUserId(request.userId()).isPresent()) {
            throw new BadRequestException("Customer already exists for this user");
        }

        User user = userRepository.findByUserIdAndIsActiveTrue(request.userId())
                .orElseThrow(() -> new BadRequestException("User not found"));

        Customer customer = new Customer();
        customer.setUser(user);
        mapCustomerFields(customer, request.firstName(), request.lastName(), request.gender(), request.dateOfBirth());
        customer.setBillingAddress(resolveAddress(user.getUserId(), request.billingAddressId(), AddressType.BILLING));
        customer.setShippingAddress(resolveAddress(user.getUserId(), request.shippingAddressId(), AddressType.SHIPPING));
        customer.setIsActive(request.isActive() != null ? request.isActive() : true);

        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public CustomerResponse updateCustomer(Long customerId, UpdateCustomerRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        assertCanAccessCustomer(customer);

        mapCustomerFields(customer, request.firstName(), request.lastName(), request.gender(), request.dateOfBirth());

        Long userId = customer.getUser().getUserId();
        customer.setBillingAddress(resolveAddress(userId, request.billingAddressId(), AddressType.BILLING));
        customer.setShippingAddress(resolveAddress(userId, request.shippingAddressId(), AddressType.SHIPPING));

        return toResponse(customerRepository.save(customer));
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

    private Address resolveAddress(Long userId, Long addressId, AddressType expectedType) {
        if (addressId == null) {
            return null;
        }

        Address address = addressRepository.findByAddressIdAndUserUserIdAndIsActiveTrue(addressId, userId)
                .orElseThrow(() -> new BadRequestException("Address not found for user"));

        if (address.getAddressType() != expectedType) {
            throw new BadRequestException(expectedType.name() + " address type is required");
        }

        return address;
    }

    private void assertCanManageUser(Long userId) {
        if (isAdmin()) {
            return;
        }

        Long currentUserId = getCurrentUserId();
        if (!currentUserId.equals(userId)) {
            throw new UnauthorizedException("You are not allowed to create customer profiles for other users");
        }
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

