package com.astraval.ecommercebackend.module.cart.controller;

import com.astraval.ecommercebackend.module.cart.dto.AddCartItemRequest;
import com.astraval.ecommercebackend.module.cart.dto.CartResponse;
import com.astraval.ecommercebackend.module.cart.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/{customerId}")
    public ResponseEntity<CartResponse> addItem(
            @PathVariable UUID customerId,
            @Valid @RequestBody AddCartItemRequest request
    ) {
        return ResponseEntity.ok(cartService.addItem(customerId, request));
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<CartResponse> getCart(@PathVariable UUID customerId) {
        return ResponseEntity.ok(cartService.getActiveCart(customerId));
    }
}
