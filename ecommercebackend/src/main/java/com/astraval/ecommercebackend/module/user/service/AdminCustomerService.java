package com.astraval.ecommercebackend.module.user.service;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.module.user.dto.CreateCustomerRequest;
import com.astraval.ecommercebackend.module.user.dto.CustomerResponse;
import com.astraval.ecommercebackend.module.user.entity.Customer;
import com.astraval.ecommercebackend.module.user.repository.CustomerRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdminCustomerService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminCustomerService(CustomerRepository customerRepository, PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public CustomerResponse createCustomer(CreateCustomerRequest request) {
        if (customerRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Customer email already exists");
        }
        if (request.phone() != null && !request.phone().isBlank() && customerRepository.existsByPhone(request.phone())) {
            throw new BadRequestException("Customer phone already exists");
        }

        Customer customer = new Customer();
        customer.setEmail(request.email());
        customer.setPhone(request.phone());
        customer.setFirstName(request.firstName());
        customer.setLastName(request.lastName());
        if (request.password() != null && !request.password().isBlank()) {
            customer.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        customer.setCreatedByAdmin(true);
        customer.setActive(true);

        Customer saved = customerRepository.save(customer);
        return new CustomerResponse(
                saved.getCustomerId(),
                saved.getEmail(),
                saved.getPhone(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.isActive(),
                saved.isCreatedByAdmin(),
                saved.getCreatedAt()
        );
    }
}
