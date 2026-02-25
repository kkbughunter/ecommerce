package com.astraval.ecommercebackend.module.user.controller;

import com.astraval.ecommercebackend.module.user.dto.CreateCustomerRequest;
import com.astraval.ecommercebackend.module.user.dto.CustomerResponse;
import com.astraval.ecommercebackend.module.user.service.AdminCustomerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/customers")
public class AdminCustomerController {

    private final AdminCustomerService adminCustomerService;

    public AdminCustomerController(AdminCustomerService adminCustomerService) {
        this.adminCustomerService = adminCustomerService;
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> createCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        return ResponseEntity.ok(adminCustomerService.createCustomer(request));
    }
}
