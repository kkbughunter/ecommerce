package com.astraval.ecommercebackend.module.cart.service;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.module.cart.dto.AddCartItemRequest;
import com.astraval.ecommercebackend.module.cart.dto.CartItemResponse;
import com.astraval.ecommercebackend.module.cart.dto.CartResponse;
import com.astraval.ecommercebackend.module.cart.entity.Cart;
import com.astraval.ecommercebackend.module.cart.entity.CartItem;
import com.astraval.ecommercebackend.module.cart.entity.CartStatus;
import com.astraval.ecommercebackend.module.cart.repository.CartRepository;
import com.astraval.ecommercebackend.module.inventory.entity.Inventory;
import com.astraval.ecommercebackend.module.inventory.repository.InventoryRepository;
import com.astraval.ecommercebackend.module.product.entity.Product;
import com.astraval.ecommercebackend.module.product.service.ProductService;
import com.astraval.ecommercebackend.module.user.entity.Customer;
import com.astraval.ecommercebackend.module.user.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.UUID;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CustomerRepository customerRepository;
    private final ProductService productService;
    private final InventoryRepository inventoryRepository;

    public CartService(
            CartRepository cartRepository,
            CustomerRepository customerRepository,
            ProductService productService,
            InventoryRepository inventoryRepository
    ) {
        this.cartRepository = cartRepository;
        this.customerRepository = customerRepository;
        this.productService = productService;
        this.inventoryRepository = inventoryRepository;
    }

    @Transactional
    public CartResponse addItem(UUID customerId, AddCartItemRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
        Product product = productService.getProduct(request.productId());
        if (!product.isActive()) {
            throw new BadRequestException("Product is inactive");
        }

        Inventory inventory = inventoryRepository.findByProductId(product.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product: " + product.getProductId()));

        Cart cart = cartRepository.findByCustomerCustomerIdAndStatus(customerId, CartStatus.ACTIVE)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setCustomer(customer);
                    newCart.setStatus(CartStatus.ACTIVE);
                    newCart.setCurrency(product.getCurrency());
                    return newCart;
                });

        CartItem existingItem = cart.getItems()
                .stream()
                .filter(item -> item.getProduct().getProductId().equals(product.getProductId()))
                .findFirst()
                .orElse(null);

        int requestedTotalQty = request.quantity();
        if (existingItem != null) {
            requestedTotalQty += existingItem.getQuantity();
        }
        int sellableQty = inventory.getAvailableQty() - inventory.getReservedQty();
        if (sellableQty < requestedTotalQty) {
            throw new BadRequestException("Not enough stock for product: " + product.getName());
        }

        if (existingItem == null) {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(request.quantity());
            item.setUnitPrice(product.getPrice());
            cart.getItems().add(item);
        } else {
            existingItem.setQuantity(requestedTotalQty);
            existingItem.setUnitPrice(product.getPrice());
        }

        recalculateTotals(cart);
        Cart saved = cartRepository.save(cart);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CartResponse getActiveCart(UUID customerId) {
        Cart cart = cartRepository.findByCustomerCustomerIdAndStatus(customerId, CartStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Active cart not found for customer: " + customerId));
        return toResponse(cart);
    }

    private void recalculateTotals(Cart cart) {
        BigDecimal total = cart.getItems().stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        cart.setTotalAmount(total);
    }

    private CartResponse toResponse(Cart cart) {
        var items = cart.getItems()
                .stream()
                .sorted(Comparator.comparing(CartItem::getCreatedAt))
                .map(item -> new CartItemResponse(
                        item.getCartItemId(),
                        item.getProduct().getProductId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                ))
                .toList();
        return new CartResponse(
                cart.getCartId(),
                cart.getCustomer().getCustomerId(),
                cart.getStatus(),
                cart.getTotalAmount(),
                cart.getCurrency(),
                items,
                cart.getUpdatedAt()
        );
    }
}
