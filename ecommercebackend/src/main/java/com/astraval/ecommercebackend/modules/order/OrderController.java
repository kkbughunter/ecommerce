package com.astraval.ecommercebackend.modules.order;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import com.astraval.ecommercebackend.modules.order.dto.CancelOrderRequest;
import com.astraval.ecommercebackend.modules.order.dto.OrderDetailResponse;
import com.astraval.ecommercebackend.modules.order.dto.OrderSummaryResponse;
import com.astraval.ecommercebackend.modules.order.dto.OrderTrackingResponse;
import com.astraval.ecommercebackend.modules.order.dto.PlaceOrderRequest;
import com.astraval.ecommercebackend.modules.order.dto.UpdateOrderStatusRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
@Tag(name = "Order APIs", description = "Order placement, management and tracking APIs")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/orders")
    @Operation(summary = "Place a new order")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> placeOrder(@Valid @RequestBody PlaceOrderRequest request) {
        OrderDetailResponse response = orderService.placeOrder(request);
        return ResponseEntity.status(201).body(ApiResponseFactory.created(response, "Order placed successfully"));
    }

    @GetMapping("/orders")
    @Operation(summary = "List current user's orders")
    public ResponseEntity<ApiResponse<List<OrderSummaryResponse>>> getMyOrders() {
        List<OrderSummaryResponse> response = orderService.getMyOrders();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Orders fetched successfully"));
    }

    @GetMapping("/orders/{orderId}")
    @Operation(summary = "View order details")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> getOrderDetails(@PathVariable Long orderId) {
        OrderDetailResponse response = orderService.getOrderDetails(orderId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Order details fetched successfully"));
    }

    @GetMapping("/orders/{orderId}/tracking")
    @Operation(summary = "View order tracking timeline")
    public ResponseEntity<ApiResponse<List<OrderTrackingResponse>>> getOrderTracking(@PathVariable Long orderId) {
        List<OrderTrackingResponse> response = orderService.getOrderTracking(orderId);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Order tracking fetched successfully"));
    }

    @PostMapping("/orders/{orderId}/cancel")
    @Operation(summary = "Cancel order")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> cancelOrder(
            @PathVariable Long orderId,
            @RequestBody(required = false) CancelOrderRequest request) {
        OrderDetailResponse response = orderService.cancelOrder(orderId, request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Order cancelled successfully"));
    }

    @GetMapping("/admin/orders")
    @Operation(summary = "Admin: list all orders")
    public ResponseEntity<ApiResponse<List<OrderSummaryResponse>>> getAllOrdersForAdmin() {
        List<OrderSummaryResponse> response = orderService.getAllOrdersForAdmin();
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "All orders fetched successfully"));
    }

    @PatchMapping("/admin/orders/{orderId}/status")
    @Operation(summary = "Admin: update order status and tracking")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> updateOrderStatusForAdmin(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        OrderDetailResponse response = orderService.updateOrderStatusForAdmin(orderId, request);
        return ResponseEntity.ok(ApiResponseFactory.ok(response, "Order status updated successfully"));
    }
}
