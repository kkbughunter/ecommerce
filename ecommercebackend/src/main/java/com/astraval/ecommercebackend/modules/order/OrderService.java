package com.astraval.ecommercebackend.modules.order;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.order.dto.CancelOrderRequest;
import com.astraval.ecommercebackend.modules.order.dto.OrderDetailResponse;
import com.astraval.ecommercebackend.modules.order.dto.OrderItemResponse;
import com.astraval.ecommercebackend.modules.order.dto.OrderSummaryResponse;
import com.astraval.ecommercebackend.modules.order.dto.OrderTrackingResponse;
import com.astraval.ecommercebackend.modules.order.dto.PlaceOrderItemRequest;
import com.astraval.ecommercebackend.modules.order.dto.PlaceOrderRequest;
import com.astraval.ecommercebackend.modules.order.dto.UpdateOrderStatusRequest;
import com.astraval.ecommercebackend.modules.product.Product;
import com.astraval.ecommercebackend.modules.product.ProductRepository;
import com.astraval.ecommercebackend.modules.user.User;
import com.astraval.ecommercebackend.modules.user.UserRepository;

@Service
public class OrderService {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final Map<OrderStatus, Set<OrderStatus>> VALID_STATUS_TRANSITIONS = Map.of(
            OrderStatus.PLACED, EnumSet.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED, EnumSet.of(OrderStatus.PACKED, OrderStatus.CANCELLED),
            OrderStatus.PACKED, EnumSet.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED, EnumSet.of(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.RETURN_REQUESTED),
            OrderStatus.OUT_FOR_DELIVERY, EnumSet.of(OrderStatus.DELIVERED, OrderStatus.RETURN_REQUESTED),
            OrderStatus.DELIVERED, EnumSet.of(OrderStatus.RETURN_REQUESTED),
            OrderStatus.RETURN_REQUESTED, EnumSet.of(OrderStatus.RETURNED),
            OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class),
            OrderStatus.RETURNED, EnumSet.noneOf(OrderStatus.class));

    private final OrderRepository orderRepository;
    private final OrderTrackingEventRepository orderTrackingEventRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SecurityUtil securityUtil;

    public OrderService(
            OrderRepository orderRepository,
            OrderTrackingEventRepository orderTrackingEventRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            SecurityUtil securityUtil) {
        this.orderRepository = orderRepository;
        this.orderTrackingEventRepository = orderTrackingEventRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.securityUtil = securityUtil;
    }

    @Transactional
    public OrderDetailResponse placeOrder(PlaceOrderRequest request) {
        Long actorUserId = getCurrentUserId();
        User user = userRepository.findByUserIdAndIsActiveTrue(actorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Order order = new Order();
        order.setOrderNumber(generateTemporaryOrderNumber());
        order.setUser(user);
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setShippingAddress(trimToNull(request.shippingAddress()));
        order.setBillingAddress(trimToNull(request.billingAddress()));
        order.setContactPhone(trimToNull(request.contactPhone()));
        order.setCurrency(normalizeCurrency(request.currency()));
        order.setCreatedBy(actorUserId);
        order.setModifiedBy(actorUserId);

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subtotal = ZERO;
        for (PlaceOrderItemRequest itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemRequest.productId()));

            if (!Boolean.TRUE.equals(product.getIsActive())) {
                throw new BadRequestException("Inactive product cannot be ordered: " + product.getProductId());
            }

            int availableStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            if (itemRequest.quantity() > availableStock) {
                throw new BadRequestException("Insufficient stock for product: " + product.getProductId());
            }

            product.setStockQuantity(availableStock - itemRequest.quantity());
            product.setModifiedBy(actorUserId);

            BigDecimal unitPrice = product.getPrice().setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemRequest.quantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineTotal).setScale(2, RoundingMode.HALF_UP);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setProductName(product.getName());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setQuantity(itemRequest.quantity());
            orderItem.setLineTotal(lineTotal);
            orderItems.add(orderItem);
        }

        BigDecimal shippingFee = safeMoney(request.shippingFee());
        BigDecimal taxAmount = safeMoney(request.taxAmount());
        BigDecimal discountAmount = safeMoney(request.discountAmount());
        BigDecimal totalAmount = subtotal.add(shippingFee).add(taxAmount).subtract(discountAmount)
                .setScale(2, RoundingMode.HALF_UP);
        if (totalAmount.compareTo(ZERO) < 0) {
            throw new BadRequestException("Order total amount cannot be negative");
        }

        order.setSubtotalAmount(subtotal);
        order.setShippingFee(shippingFee);
        order.setTaxAmount(taxAmount);
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(totalAmount);
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);
        savedOrder.setOrderNumber(generateOrderNumber(savedOrder.getOrderId()));
        addTrackingEvent(savedOrder, OrderStatus.PLACED, null, "Order placed", actorUserId);

        Order updatedOrder = orderRepository.save(savedOrder);
        return toOrderDetailResponse(updatedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> getMyOrders() {
        Long userId = getCurrentUserId();
        return orderRepository.findByUserUserIdOrderByCreatedDtDesc(userId).stream()
                .map(this::toOrderSummaryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse getOrderDetails(Long orderId) {
        Order order = loadOrderWithDetails(orderId);
        authorizeOrderAccess(order);
        return toOrderDetailResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderTrackingResponse> getOrderTracking(Long orderId) {
        Order order = loadOrderWithDetails(orderId);
        authorizeOrderAccess(order);
        return orderTrackingEventRepository.findByOrderOrderIdOrderByEventTimeAsc(orderId).stream()
                .map(this::toOrderTrackingResponse)
                .toList();
    }

    @Transactional
    public OrderDetailResponse cancelOrder(Long orderId, CancelOrderRequest request) {
        Long actorUserId = getCurrentUserId();
        Order order = loadOrderWithDetails(orderId);
        authorizeOrderAccess(order);

        if (EnumSet.of(OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.RETURNED)
                .contains(order.getStatus())) {
            throw new BadRequestException("Order cannot be cancelled at status: " + order.getStatus());
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }

        restockOrderItems(order, actorUserId);
        order.setStatus(OrderStatus.CANCELLED);
        order.setModifiedBy(actorUserId);

        String note = trimToNull(request != null ? request.note() : null);
        addTrackingEvent(order, OrderStatus.CANCELLED, null, note != null ? note : "Order cancelled", actorUserId);
        return toOrderDetailResponse(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> getAllOrdersForAdmin() {
        ensureAdmin();
        return orderRepository.findAll().stream()
                .sorted(Comparator.comparing(Order::getCreatedDt).reversed())
                .map(this::toOrderSummaryResponse)
                .toList();
    }

    @Transactional
    public OrderDetailResponse updateOrderStatusForAdmin(Long orderId, UpdateOrderStatusRequest request) {
        ensureAdmin();
        Long actorUserId = getCurrentUserId();
        Order order = loadOrderWithDetails(orderId);

        if (!isValidTransition(order.getStatus(), request.status())) {
            throw new BadRequestException(
                    "Invalid order status transition: " + order.getStatus() + " -> " + request.status());
        }

        if (request.status() == OrderStatus.CANCELLED && order.getStatus() != OrderStatus.CANCELLED) {
            restockOrderItems(order, actorUserId);
        }

        order.setStatus(request.status());
        if (request.paymentStatus() != null) {
            order.setPaymentStatus(request.paymentStatus());
        }
        order.setModifiedBy(actorUserId);

        String note = trimToNull(request.note());
        if (note == null) {
            note = "Status updated to " + request.status();
        }
        addTrackingEvent(order, request.status(), trimToNull(request.location()), note, actorUserId);
        return toOrderDetailResponse(orderRepository.save(order));
    }

    private void restockOrderItems(Order order, Long actorUserId) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            product.setStockQuantity(currentStock + item.getQuantity());
            product.setModifiedBy(actorUserId);
        }
    }

    private void addTrackingEvent(Order order, OrderStatus status, String location, String note, Long actorUserId) {
        OrderTrackingEvent event = new OrderTrackingEvent();
        event.setOrder(order);
        event.setStatus(status);
        event.setLocation(location);
        event.setNote(note);
        event.setCreatedBy(actorUserId);
        order.getTrackingEvents().add(event);
    }

    private void authorizeOrderAccess(Order order) {
        if (securityUtil.hasRole("ADMIN")) {
            return;
        }
        Long currentUserId = getCurrentUserId();
        if (!order.getUser().getUserId().equals(currentUserId)) {
            throw new UnauthorizedException("You are not authorized to access this order");
        }
    }

    private void ensureAdmin() {
        if (!securityUtil.hasRole("ADMIN")) {
            throw new UnauthorizedException("Admin role is required");
        }
    }

    private Order loadOrderWithDetails(Long orderId) {
        return orderRepository.findWithDetailsByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    private boolean isValidTransition(OrderStatus from, OrderStatus to) {
        if (from == to) {
            return true;
        }
        Set<OrderStatus> allowedTargets = VALID_STATUS_TRANSITIONS.get(from);
        return allowedTargets != null && allowedTargets.contains(to);
    }

    private Long getCurrentUserId() {
        String sub = securityUtil.getCurrentSub();
        try {
            return Long.parseLong(sub);
        } catch (NumberFormatException ex) {
            throw new UnauthorizedException("Invalid authenticated user");
        }
    }

    private String generateTemporaryOrderNumber() {
        return "TMP-" + System.currentTimeMillis();
    }

    private String generateOrderNumber(Long orderId) {
        return "ORD-" + String.format("%08d", orderId);
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

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeCurrency(String currency) {
        String normalized = trimToNull(currency);
        if (normalized == null) {
            return "INR";
        }
        if (normalized.length() != 3) {
            throw new BadRequestException("Currency must be 3 characters");
        }
        return normalized.toUpperCase(Locale.ROOT);
    }

    private OrderSummaryResponse toOrderSummaryResponse(Order order) {
        return new OrderSummaryResponse(
                order.getOrderId(),
                order.getOrderNumber(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getCreatedDt());
    }

    private OrderDetailResponse toOrderDetailResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(this::toOrderItemResponse)
                .toList();
        List<OrderTrackingResponse> trackingResponses = order.getTrackingEvents().stream()
                .sorted(Comparator.comparing(OrderTrackingEvent::getEventTime))
                .map(this::toOrderTrackingResponse)
                .toList();

        return new OrderDetailResponse(
                order.getOrderId(),
                order.getOrderNumber(),
                order.getUser().getUserId(),
                order.getUser().getEmail(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getSubtotalAmount(),
                order.getShippingFee(),
                order.getTaxAmount(),
                order.getDiscountAmount(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getShippingAddress(),
                order.getBillingAddress(),
                order.getContactPhone(),
                order.getCreatedDt(),
                order.getModifiedDt(),
                itemResponses,
                trackingResponses);
    }

    private OrderItemResponse toOrderItemResponse(OrderItem item) {
        return new OrderItemResponse(
                item.getOrderItemId(),
                item.getProduct() != null ? item.getProduct().getProductId() : null,
                item.getProductName(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getLineTotal());
    }

    private OrderTrackingResponse toOrderTrackingResponse(OrderTrackingEvent event) {
        return new OrderTrackingResponse(
                event.getTrackingEventId(),
                event.getStatus(),
                event.getLocation(),
                event.getNote(),
                event.getEventTime(),
                event.getCreatedBy());
    }
}
