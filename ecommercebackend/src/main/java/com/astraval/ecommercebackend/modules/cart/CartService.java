package com.astraval.ecommercebackend.modules.cart;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.common.util.DeliveryFeeCalculator;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.cart.dto.AddCartItemRequest;
import com.astraval.ecommercebackend.modules.cart.dto.CartCheckoutResponse;
import com.astraval.ecommercebackend.modules.cart.dto.CartItemResponse;
import com.astraval.ecommercebackend.modules.cart.dto.CartResponse;
import com.astraval.ecommercebackend.modules.cart.dto.CheckoutCartRequest;
import com.astraval.ecommercebackend.modules.cart.dto.UpdateCartItemRequest;
import com.astraval.ecommercebackend.modules.order.OrderService;
import com.astraval.ecommercebackend.modules.order.dto.OrderDetailResponse;
import com.astraval.ecommercebackend.modules.order.dto.PlaceOrderItemRequest;
import com.astraval.ecommercebackend.modules.payment.RazorpayPaymentService;
import com.astraval.ecommercebackend.modules.payment.dto.CreateRazorpayOrderRequest;
import com.astraval.ecommercebackend.modules.payment.dto.RazorpayOrderCreateResponse;
import com.astraval.ecommercebackend.modules.product.Product;
import com.astraval.ecommercebackend.modules.product.ProductRepository;
import com.astraval.ecommercebackend.modules.user.User;
import com.astraval.ecommercebackend.modules.user.UserRepository;

@Service
public class CartService {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal DISCOUNT_AMOUNT = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SecurityUtil securityUtil;
    private final OrderService orderService;
    private final RazorpayPaymentService razorpayPaymentService;

    public CartService(
            CartRepository cartRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            SecurityUtil securityUtil,
            OrderService orderService,
            RazorpayPaymentService razorpayPaymentService) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.securityUtil = securityUtil;
        this.orderService = orderService;
        this.razorpayPaymentService = razorpayPaymentService;
    }

    @Transactional(readOnly = true)
    public CartResponse getMyCart() {
        Long userId = getCurrentUserId();
        return cartRepository.findByUserUserId(userId)
                .map(this::toCartResponse)
                .orElseGet(() -> emptyCartResponse(userId));
    }

    @Transactional
    public CartResponse addItem(AddCartItemRequest request) {
        if (request == null || request.productId() == null || request.quantity() == null || request.quantity() < 1) {
            throw new BadRequestException("Product id and quantity are required");
        }

        Long actorUserId = getCurrentUserId();
        Product product = loadActiveProduct(request.productId());
        Cart cart = getOrCreateCart(actorUserId);

        CartItem existingItem = findCartItem(cart, product.getProductId());
        int existingQuantity = existingItem != null && existingItem.getQuantity() != null ? existingItem.getQuantity() : 0;
        int requestedQuantity = existingQuantity + request.quantity();
        int availableStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        if (requestedQuantity > availableStock) {
            throw new BadRequestException("Insufficient stock for product: " + product.getProductId());
        }

        if (existingItem == null) {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProduct(product);
            newItem.setQuantity(request.quantity());
            cart.getItems().add(newItem);
        } else {
            existingItem.setQuantity(requestedQuantity);
        }
        cart.setModifiedBy(actorUserId);

        Cart savedCart = cartRepository.save(cart);
        return toCartResponse(savedCart);
    }

    @Transactional
    public CartResponse updateItemQuantity(Long productId, UpdateCartItemRequest request) {
        if (productId == null || request == null || request.quantity() == null || request.quantity() < 1) {
            throw new BadRequestException("Valid product id and quantity are required");
        }

        Long actorUserId = getCurrentUserId();
        Cart cart = loadExistingCart(actorUserId);
        CartItem item = findCartItem(cart, productId);
        if (item == null) {
            throw new ResourceNotFoundException("Cart item not found for product: " + productId);
        }

        Product product = item.getProduct();
        if (product == null || !Boolean.TRUE.equals(product.getIsActive())) {
            throw new BadRequestException("Inactive product cannot remain in cart: " + productId);
        }
        int availableStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        if (request.quantity() > availableStock) {
            throw new BadRequestException("Insufficient stock for product: " + product.getProductId());
        }

        item.setQuantity(request.quantity());
        cart.setModifiedBy(actorUserId);

        Cart savedCart = cartRepository.save(cart);
        return toCartResponse(savedCart);
    }

    @Transactional
    public CartResponse removeItem(Long productId) {
        if (productId == null) {
            throw new BadRequestException("Product id is required");
        }

        Long actorUserId = getCurrentUserId();
        Cart cart = loadExistingCart(actorUserId);

        boolean removed = cart.getItems().removeIf(item -> item.getProduct() != null
                && productId.equals(item.getProduct().getProductId()));
        if (!removed) {
            throw new ResourceNotFoundException("Cart item not found for product: " + productId);
        }

        cart.setModifiedBy(actorUserId);
        Cart savedCart = cartRepository.save(cart);
        return toCartResponse(savedCart);
    }

    @Transactional
    public CartResponse clearCart() {
        Long actorUserId = getCurrentUserId();
        return cartRepository.findByUserUserId(actorUserId)
                .map(cart -> {
                    cart.getItems().clear();
                    cart.setModifiedBy(actorUserId);
                    return toCartResponse(cartRepository.save(cart));
                })
                .orElseGet(() -> emptyCartResponse(actorUserId));
    }

    @Transactional
    public CartCheckoutResponse checkout(CheckoutCartRequest request) {
        Long actorUserId = getCurrentUserId();
        Cart cart = loadExistingCart(actorUserId);
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        if (request == null || request.productIds() == null || request.productIds().isEmpty()) {
            throw new BadRequestException("Please select at least one cart item for checkout");
        }

        Set<Long> selectedProductIds = new HashSet<>(request.productIds());
        List<CartItem> selectedCartItems = cart.getItems().stream()
                .filter(item -> item.getProduct() != null && selectedProductIds.contains(item.getProduct().getProductId()))
                .toList();
        if (selectedCartItems.isEmpty()) {
            throw new BadRequestException("Selected cart items are not available for checkout");
        }

        List<PlaceOrderItemRequest> orderItems = selectedCartItems.stream()
                .map(item -> new PlaceOrderItemRequest(item.getProduct().getProductId(), item.getQuantity()))
                .toList();

        OrderDetailResponse order = orderService.placeOrderFromItems(orderItems);
        RazorpayOrderCreateResponse payment = razorpayPaymentService
                .createRazorpayOrder(new CreateRazorpayOrderRequest(order.orderId()));

        cart.getItems().removeIf(item -> item.getProduct() != null
                && selectedProductIds.contains(item.getProduct().getProductId()));
        cart.setModifiedBy(actorUserId);
        cartRepository.save(cart);

        return new CartCheckoutResponse(order, payment);
    }

    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserUserId(userId)
                .orElseGet(() -> createCart(userId));
    }

    private Cart loadExistingCart(Long userId) {
        return cartRepository.findByUserUserId(userId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));
    }

    private Cart createCart(Long userId) {
        User user = userRepository.findByUserIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = new Cart();
        cart.setUser(user);
        cart.setCurrency("INR");
        cart.setCreatedBy(userId);
        cart.setModifiedBy(userId);
        return cartRepository.save(cart);
    }

    private Product loadActiveProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
        if (!Boolean.TRUE.equals(product.getIsActive())) {
            throw new BadRequestException("Inactive product cannot be added to cart: " + productId);
        }
        return product;
    }

    private CartItem findCartItem(Cart cart, Long productId) {
        return cart.getItems().stream()
                .filter(item -> item.getProduct() != null && productId.equals(item.getProduct().getProductId()))
                .findFirst()
                .orElse(null);
    }

    private CartResponse toCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = new ArrayList<>();
        BigDecimal subtotal = ZERO;
        BigDecimal taxAmount = ZERO;
        BigDecimal totalWeightKg = BigDecimal.ZERO;
        int totalItems = 0;

        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            if (product == null) {
                continue;
            }

            int quantity = item.getQuantity() != null ? item.getQuantity() : 0;
            BigDecimal unitPrice = safeMoney(product.getPrice());
            BigDecimal lineSubtotal = unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal gstPercentage = safeMoney(product.getGstPercentage());
            BigDecimal lineTax = lineSubtotal.multiply(gstPercentage).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineSubtotal.add(lineTax).setScale(2, RoundingMode.HALF_UP);
            BigDecimal unitWeightKg = safeWeightKg(product);
            BigDecimal lineWeightKg = unitWeightKg.multiply(BigDecimal.valueOf(quantity));

            int availableStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            boolean available = Boolean.TRUE.equals(product.getIsActive()) && availableStock >= quantity;

            subtotal = subtotal.add(lineSubtotal).setScale(2, RoundingMode.HALF_UP);
            taxAmount = taxAmount.add(lineTax).setScale(2, RoundingMode.HALF_UP);
            totalWeightKg = totalWeightKg.add(lineWeightKg);
            totalItems += quantity;

            itemResponses.add(new CartItemResponse(
                    product.getProductId(),
                    product.getName(),
                    product.getMainImageUploadId(),
                    unitPrice,
                    quantity,
                    lineSubtotal,
                    lineTax,
                    lineTotal,
                    availableStock,
                    available));
        }

        BigDecimal shippingFee = DeliveryFeeCalculator.calculateShippingFee(totalWeightKg, totalItems);
        BigDecimal totalAmount = subtotal.add(shippingFee).add(taxAmount).subtract(DISCOUNT_AMOUNT)
                .setScale(2, RoundingMode.HALF_UP);

        return new CartResponse(
                cart.getCartId(),
                cart.getUser() != null ? cart.getUser().getUserId() : null,
                normalizeCurrency(cart.getCurrency()),
                subtotal,
                shippingFee,
                taxAmount,
                DISCOUNT_AMOUNT,
                totalAmount,
                totalItems,
                cart.getCreatedDt(),
                cart.getModifiedDt(),
                itemResponses);
    }

    private CartResponse emptyCartResponse(Long userId) {
        return new CartResponse(
                null,
                userId,
                "INR",
                ZERO,
                ZERO,
                ZERO,
                DISCOUNT_AMOUNT,
                ZERO,
                0,
                (LocalDateTime) null,
                (LocalDateTime) null,
                List.of());
    }

    private BigDecimal safeMoney(BigDecimal value) {
        if (value == null) {
            return ZERO;
        }
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Amount values cannot be negative");
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal safeWeightKg(Product product) {
        BigDecimal weightKg = product != null ? product.getWeightKg() : null;
        if (weightKg == null) {
            return BigDecimal.ZERO;
        }
        if (weightKg.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Product weight cannot be negative: " + product.getProductId());
        }
        return weightKg.setScale(3, RoundingMode.HALF_UP);
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "INR";
        }
        if (currency.length() != 3) {
            throw new BadRequestException("Currency must be 3 characters");
        }
        return currency.toUpperCase(Locale.ROOT);
    }

    private Long getCurrentUserId() {
        String sub = securityUtil.getCurrentSub();
        try {
            return Long.parseLong(sub);
        } catch (NumberFormatException ex) {
            throw new UnauthorizedException("Invalid authenticated user");
        }
    }
}
