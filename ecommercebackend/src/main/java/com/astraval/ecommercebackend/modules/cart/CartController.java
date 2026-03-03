package com.astraval.ecommercebackend.modules.cart;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.cart.dto.AddCartItemRequest;
import com.astraval.ecommercebackend.modules.cart.dto.CartResponse;
import com.astraval.ecommercebackend.modules.cart.dto.UpdateCartItemRequest;
import com.astraval.ecommercebackend.modules.order.dto.OrderDetailResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/cart")
@Tag(name = "Cart APIs", description = "Cart management and checkout APIs")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    @Operation(summary = "View current user's cart")
    public ResponseEntity<ApiResponse<CartResponse>> getMyCart() {
        CartResponse response = cartService.getMyCart();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Cart fetched successfully"));
    }

    @PostMapping("/items")
    @Operation(summary = "Add product to cart")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(@Valid @RequestBody AddCartItemRequest request) {
        CartResponse response = cartService.addItem(request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Product added to cart"));
    }

    @PatchMapping("/items/{productId}")
    @Operation(summary = "Update cart item quantity")
    public ResponseEntity<ApiResponse<CartResponse>> updateItemQuantity(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        CartResponse response = cartService.updateItemQuantity(productId, request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Cart item updated successfully"));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove product from cart")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(@PathVariable Long productId) {
        CartResponse response = cartService.removeItem(productId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Product removed from cart"));
    }

    @DeleteMapping
    @Operation(summary = "Clear all items from cart")
    public ResponseEntity<ApiResponse<CartResponse>> clearCart() {
        CartResponse response = cartService.clearCart();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Cart cleared successfully"));
    }

    @PostMapping("/checkout")
    @Operation(summary = "Checkout cart and create order")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> checkout() {
        OrderDetailResponse response = cartService.checkout();
        return ResponseEntity.status(201)
                .body(ApiResponseFactory.created(response, "Order placed from cart successfully"));
    }
}
