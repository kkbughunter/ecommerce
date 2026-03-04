package com.astraval.ecommercebackend.modules.payment;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.astraval.ecommercebackend.common.exception.BadRequestException;
import com.astraval.ecommercebackend.common.exception.ResourceNotFoundException;
import com.astraval.ecommercebackend.common.exception.UnauthorizedException;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.order.Order;
import com.astraval.ecommercebackend.modules.order.OrderRepository;
import com.astraval.ecommercebackend.modules.order.OrderStatus;
import com.astraval.ecommercebackend.modules.order.PaymentStatus;
import com.astraval.ecommercebackend.modules.payment.dto.CreateRazorpayOrderRequest;
import com.astraval.ecommercebackend.modules.payment.dto.MarkPaymentFailedRequest;
import com.astraval.ecommercebackend.modules.payment.dto.OrderPaymentDetailsResponse;
import com.astraval.ecommercebackend.modules.payment.dto.PaymentAttemptResponse;
import com.astraval.ecommercebackend.modules.payment.dto.PaymentStatusEventResponse;
import com.astraval.ecommercebackend.modules.payment.dto.RazorpayOrderCreateResponse;
import com.astraval.ecommercebackend.modules.payment.dto.VerifyRazorpayPaymentRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class RazorpayPaymentService {

    private static final String HMAC_SHA256 = "HmacSHA256";

    private final RazorpayProperties razorpayProperties;
    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentStatusTrackingRepository paymentStatusTrackingRepository;
    private final SecurityUtil securityUtil;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public RazorpayPaymentService(
            RazorpayProperties razorpayProperties,
            OrderRepository orderRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            PaymentStatusTrackingRepository paymentStatusTrackingRepository,
            SecurityUtil securityUtil,
            ObjectMapper objectMapper) {
        this.razorpayProperties = razorpayProperties;
        this.orderRepository = orderRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.paymentStatusTrackingRepository = paymentStatusTrackingRepository;
        this.securityUtil = securityUtil;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().build();
    }

    @Transactional
    public RazorpayOrderCreateResponse createRazorpayOrder(CreateRazorpayOrderRequest request) {
        ensureRazorpayCredentialsConfigured();
        Order order = loadOrder(request.orderId());
        authorizeOrderAccess(order);
        validateOrderForPayment(order);

        int attemptNumber = Math.toIntExact(paymentTransactionRepository.countByOrderOrderId(order.getOrderId()) + 1);
        long amountInSubunits = toSubunits(order.getTotalAmount());
        String receipt = generateReceipt(order, attemptNumber);

        JsonNode razorpayOrderResponse = createGatewayOrder(amountInSubunits, order.getCurrency(), receipt, order);
        String razorpayOrderId = textValue(razorpayOrderResponse, "id");
        if (razorpayOrderId == null) {
            throw new BadRequestException("Razorpay order creation failed: missing order id in response");
        }

        Long actorUserId = getCurrentUserId();
        PaymentTransaction paymentTransaction = new PaymentTransaction();
        paymentTransaction.setOrder(order);
        paymentTransaction.setGateway(PaymentGateway.RAZORPAY);
        paymentTransaction.setGatewayOrderId(razorpayOrderId);
        paymentTransaction.setStatus(mapGatewayOrderStatus(textValue(razorpayOrderResponse, "status")));
        paymentTransaction.setAmount(order.getTotalAmount().setScale(2, RoundingMode.HALF_UP));
        paymentTransaction.setCurrency(order.getCurrency());
        paymentTransaction.setReceipt(receipt);
        paymentTransaction.setAttemptNumber(attemptNumber);
        paymentTransaction.setGatewayPayload(razorpayOrderResponse.toString());
        paymentTransaction.setCreatedBy(actorUserId);
        paymentTransaction.setModifiedBy(actorUserId);
        paymentTransaction = paymentTransactionRepository.save(paymentTransaction);

        writeStatusTracking(
                paymentTransaction,
                null,
                paymentTransaction.getStatus(),
                PaymentEventSource.API,
                PaymentEventType.ORDER_CREATED,
                null,
                "Razorpay order created",
                razorpayOrderResponse.toString(),
                actorUserId);

        if (order.getPaymentStatus() != PaymentStatus.PENDING) {
            order.setPaymentStatus(PaymentStatus.PENDING);
            order.setModifiedBy(actorUserId);
            orderRepository.save(order);
        }

        return new RazorpayOrderCreateResponse(
                paymentTransaction.getPaymentTransactionId(),
                order.getOrderId(),
                order.getOrderNumber(),
                paymentTransaction.getGatewayOrderId(),
                razorpayProperties.getKeyId(),
                paymentTransaction.getStatus().name(),
                amountInSubunits,
                paymentTransaction.getCurrency(),
                paymentTransaction.getAttemptNumber(),
                paymentTransaction.getCreatedDt());
    }

    @Transactional
    public PaymentAttemptResponse verifyPayment(VerifyRazorpayPaymentRequest request) {
        ensureRazorpayCredentialsConfigured();
        PaymentTransaction paymentTransaction = paymentTransactionRepository
                .findByGatewayAndGatewayOrderId(PaymentGateway.RAZORPAY, request.razorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found for Razorpay order id"));

        Order order = paymentTransaction.getOrder();
        authorizeOrderAccess(order);
        if (!order.getOrderId().equals(request.orderId())) {
            throw new BadRequestException("Order id does not match payment transaction");
        }

        Long actorUserId = getCurrentUserId();
        paymentTransaction.setGatewayPaymentId(trimToNull(request.razorpayPaymentId()));
        paymentTransaction.setGatewaySignature(trimToNull(request.razorpaySignature()));
        paymentTransaction.setModifiedBy(actorUserId);

        boolean signatureValid = verifyCheckoutSignature(
                request.razorpayOrderId(),
                request.razorpayPaymentId(),
                request.razorpaySignature());

        if (!signatureValid) {
            paymentTransaction.setErrorCode("SIGNATURE_MISMATCH");
            paymentTransaction.setErrorDescription("Invalid Razorpay signature");
            applyStatusChange(
                    paymentTransaction,
                    PaymentTransactionStatus.FAILED,
                    PaymentEventSource.API,
                    PaymentEventType.PAYMENT_FAILED,
                    request.razorpayPaymentId(),
                    "Payment verification failed due to signature mismatch",
                    null,
                    actorUserId);
            throw new BadRequestException("Invalid Razorpay signature");
        }

        paymentTransaction.setErrorCode(null);
        paymentTransaction.setErrorDescription(null);
        applyStatusChange(
                paymentTransaction,
                PaymentTransactionStatus.PAID,
                PaymentEventSource.API,
                PaymentEventType.PAYMENT_VERIFIED,
                request.razorpayPaymentId(),
                "Payment signature verified successfully",
                null,
                actorUserId);
        return buildPaymentAttemptResponse(paymentTransaction);
    }

    @Transactional
    public PaymentAttemptResponse markPaymentFailed(MarkPaymentFailedRequest request) {
        PaymentTransaction paymentTransaction = paymentTransactionRepository
                .findByGatewayAndGatewayOrderId(PaymentGateway.RAZORPAY, request.razorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found for Razorpay order id"));

        Order order = paymentTransaction.getOrder();
        authorizeOrderAccess(order);
        if (!order.getOrderId().equals(request.orderId())) {
            throw new BadRequestException("Order id does not match payment transaction");
        }

        Long actorUserId = getCurrentUserId();
        paymentTransaction.setGatewayPaymentId(trimToNull(request.razorpayPaymentId()));
        paymentTransaction.setErrorCode(trimToNull(request.errorCode()));
        paymentTransaction.setErrorDescription(trimToNull(request.errorDescription()));
        paymentTransaction.setModifiedBy(actorUserId);
        applyStatusChange(
                paymentTransaction,
                PaymentTransactionStatus.FAILED,
                PaymentEventSource.API,
                PaymentEventType.PAYMENT_FAILED,
                request.razorpayPaymentId(),
                "Payment marked as failed by client flow",
                null,
                actorUserId);
        return buildPaymentAttemptResponse(paymentTransaction);
    }

    @Transactional(readOnly = true)
    public OrderPaymentDetailsResponse getOrderPaymentDetails(Long orderId) {
        Order order = loadOrder(orderId);
        authorizeOrderAccess(order);

        List<PaymentTransaction> paymentTransactions = paymentTransactionRepository
                .findByOrderOrderIdOrderByCreatedDtDesc(orderId);
        Map<Long, List<PaymentStatusTracking>> eventsByPayment = getEventsGroupedByPayment(orderId);

        List<PaymentAttemptResponse> attempts = paymentTransactions.stream()
                .map(paymentTransaction -> toPaymentAttemptResponse(
                        paymentTransaction,
                        eventsByPayment.getOrDefault(paymentTransaction.getPaymentTransactionId(), List.of())))
                .toList();

        return new OrderPaymentDetailsResponse(
                order.getOrderId(),
                order.getOrderNumber(),
                order.getPaymentStatus(),
                attempts);
    }

    @Transactional
    public Map<String, Object> handleWebhook(String signature, String payload) {
        String webhookSecret = trimToNull(razorpayProperties.getWebhookSecret());
        if (webhookSecret == null) {
            throw new UnauthorizedException("Razorpay webhook secret is not configured");
        }
        if (trimToNull(signature) == null) {
            throw new UnauthorizedException("Missing Razorpay webhook signature");
        }
        if (!verifyHmacSignature(payload, signature, webhookSecret)) {
            throw new UnauthorizedException("Invalid Razorpay webhook signature");
        }

        JsonNode root = parseJson(payload, "Invalid Razorpay webhook payload");
        String event = textValue(root, "event");
        JsonNode paymentEntity = root.path("payload").path("payment").path("entity");
        JsonNode orderEntity = root.path("payload").path("order").path("entity");

        String gatewayOrderId = trimToNull(textValue(paymentEntity, "order_id"));
        if (gatewayOrderId == null) {
            gatewayOrderId = trimToNull(textValue(orderEntity, "id"));
        }
        String gatewayPaymentId = trimToNull(textValue(paymentEntity, "id"));

        Optional<PaymentTransaction> paymentTransactionOptional = Optional.empty();
        if (gatewayOrderId != null) {
            paymentTransactionOptional = paymentTransactionRepository
                    .findByGatewayAndGatewayOrderId(PaymentGateway.RAZORPAY, gatewayOrderId);
        }
        if (paymentTransactionOptional.isEmpty() && gatewayPaymentId != null) {
            paymentTransactionOptional = paymentTransactionRepository
                    .findByGatewayAndGatewayPaymentId(PaymentGateway.RAZORPAY, gatewayPaymentId);
        }
        if (paymentTransactionOptional.isEmpty()) {
            return Map.of(
                    "processed", false,
                    "message", "No local payment transaction found for webhook event",
                    "event", event);
        }

        PaymentTransaction paymentTransaction = paymentTransactionOptional.get();
        WebhookEventResolution resolution = resolveWebhookEvent(event);

        paymentTransaction.setGatewayPaymentId(gatewayPaymentId != null ? gatewayPaymentId : paymentTransaction.getGatewayPaymentId());
        paymentTransaction.setMethod(trimToNull(textValue(paymentEntity, "method")));
        paymentTransaction.setErrorCode(trimToNull(textValue(paymentEntity, "error_code")));
        paymentTransaction.setErrorDescription(trimToNull(textValue(paymentEntity, "error_description")));
        paymentTransaction.setGatewayPayload(payload);
        paymentTransaction.setModifiedBy(null);

        applyStatusChange(
                paymentTransaction,
                resolution.status(),
                PaymentEventSource.WEBHOOK,
                resolution.eventType(),
                gatewayPaymentId,
                resolution.note(),
                payload,
                null);

        return Map.of(
                "processed", true,
                "message", "Webhook processed",
                "event", event,
                "paymentTransactionId", paymentTransaction.getPaymentTransactionId(),
                "status", paymentTransaction.getStatus().name());
    }

    private void validateOrderForPayment(Order order) {
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.RETURNED) {
            throw new BadRequestException("Payment cannot be initiated for order status: " + order.getStatus());
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Order payment is already completed");
        }
        if (order.getTotalAmount() == null || order.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Order total amount must be greater than zero for payment");
        }
    }

    private JsonNode createGatewayOrder(long amountInSubunits, String currency, String receipt, Order order) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("amount", amountInSubunits);
        requestBody.put("currency", currency);
        requestBody.put("receipt", receipt);

        Map<String, String> notes = new HashMap<>();
        notes.put("orderNumber", order.getOrderNumber());
        notes.put("localOrderId", String.valueOf(order.getOrderId()));
        requestBody.put("notes", notes);

        String requestJson = toJson(requestBody);
        String endpoint = normalizeBaseUrl(razorpayProperties.getApiBaseUrl()) + "/v1/orders";
        String authValue = Base64.getEncoder()
                .encodeToString((razorpayProperties.getKeyId() + ":" + razorpayProperties.getKeySecret())
                        .getBytes(StandardCharsets.UTF_8));

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofMillis(razorpayProperties.getCreateOrderTimeoutMs()))
                .header("Authorization", "Basic " + authValue)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            String responseBody = response.body();
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BadRequestException("Razorpay order creation failed: " + extractGatewayError(responseBody));
            }
            return parseJson(responseBody, "Invalid response from Razorpay order create API");
        } catch (BadRequestException ex) {
            throw ex;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Razorpay API call was interrupted");
        } catch (Exception ex) {
            throw new BadRequestException("Razorpay order creation failed: " + ex.getMessage());
        }
    }

    private void applyStatusChange(
            PaymentTransaction paymentTransaction,
            PaymentTransactionStatus targetStatus,
            PaymentEventSource eventSource,
            PaymentEventType eventType,
            String providerEventId,
            String note,
            String payload,
            Long actorUserId) {
        PaymentTransactionStatus previousStatus = paymentTransaction.getStatus();
        if (targetStatus != null) {
            paymentTransaction.setStatus(targetStatus);
        }
        paymentTransaction.setModifiedBy(actorUserId);
        paymentTransactionRepository.save(paymentTransaction);

        writeStatusTracking(
                paymentTransaction,
                previousStatus,
                paymentTransaction.getStatus(),
                eventSource,
                eventType,
                providerEventId,
                note,
                payload,
                actorUserId);
        syncOrderPaymentStatus(paymentTransaction.getOrder(), paymentTransaction.getStatus(), actorUserId);
    }

    private void writeStatusTracking(
            PaymentTransaction paymentTransaction,
            PaymentTransactionStatus previousStatus,
            PaymentTransactionStatus newStatus,
            PaymentEventSource source,
            PaymentEventType eventType,
            String providerEventId,
            String note,
            String payload,
            Long actorUserId) {
        PaymentStatusTracking tracking = new PaymentStatusTracking();
        tracking.setPaymentTransaction(paymentTransaction);
        tracking.setPreviousStatus(previousStatus);
        tracking.setNewStatus(newStatus);
        tracking.setEventSource(source);
        tracking.setEventType(eventType);
        tracking.setProviderEventId(trimToNull(providerEventId));
        tracking.setNote(trimToNull(note));
        tracking.setPayload(trimToNull(payload));
        tracking.setCreatedBy(actorUserId);
        tracking.setEventTime(LocalDateTime.now());
        paymentStatusTrackingRepository.save(tracking);
    }

    private void syncOrderPaymentStatus(Order order, PaymentTransactionStatus paymentTransactionStatus, Long actorUserId) {
        PaymentStatus current = order.getPaymentStatus();
        PaymentStatus target;
        switch (paymentTransactionStatus) {
            case PAID, CAPTURED -> target = PaymentStatus.PAID;
            case REFUNDED -> target = PaymentStatus.REFUNDED;
            case FAILED, CANCELLED -> target = current == PaymentStatus.PAID ? PaymentStatus.PAID : PaymentStatus.FAILED;
            case CREATED, AUTHORIZED -> {
                if (current == PaymentStatus.PAID || current == PaymentStatus.REFUNDED) {
                    target = current;
                } else {
                    target = PaymentStatus.PENDING;
                }
            }
            default -> target = current;
        }
        if (target != current) {
            order.setPaymentStatus(target);
            order.setModifiedBy(actorUserId);
            orderRepository.save(order);
        }
    }

    private PaymentAttemptResponse buildPaymentAttemptResponse(PaymentTransaction paymentTransaction) {
        Map<Long, List<PaymentStatusTracking>> eventsByPayment = getEventsGroupedByPayment(
                paymentTransaction.getOrder().getOrderId());
        return toPaymentAttemptResponse(
                paymentTransaction,
                eventsByPayment.getOrDefault(paymentTransaction.getPaymentTransactionId(), List.of()));
    }

    private Map<Long, List<PaymentStatusTracking>> getEventsGroupedByPayment(Long orderId) {
        List<PaymentStatusTracking> allEvents = paymentStatusTrackingRepository
                .findByPaymentTransactionOrderOrderIdOrderByEventTimeAsc(orderId);
        Map<Long, List<PaymentStatusTracking>> grouped = new HashMap<>();
        for (PaymentStatusTracking event : allEvents) {
            grouped.computeIfAbsent(event.getPaymentTransaction().getPaymentTransactionId(), id -> new ArrayList<>())
                    .add(event);
        }
        return grouped;
    }

    private PaymentAttemptResponse toPaymentAttemptResponse(
            PaymentTransaction paymentTransaction,
            List<PaymentStatusTracking> events) {
        List<PaymentStatusEventResponse> eventResponses = events.stream()
                .map(event -> new PaymentStatusEventResponse(
                        event.getPaymentStatusTrackingId(),
                        event.getPreviousStatus() != null ? event.getPreviousStatus().name() : null,
                        event.getNewStatus() != null ? event.getNewStatus().name() : null,
                        event.getEventSource() != null ? event.getEventSource().name() : null,
                        event.getEventType() != null ? event.getEventType().name() : null,
                        event.getProviderEventId(),
                        event.getNote(),
                        event.getEventTime()))
                .toList();
        return new PaymentAttemptResponse(
                paymentTransaction.getPaymentTransactionId(),
                paymentTransaction.getGateway(),
                paymentTransaction.getGatewayOrderId(),
                paymentTransaction.getGatewayPaymentId(),
                paymentTransaction.getStatus(),
                paymentTransaction.getAmount(),
                paymentTransaction.getCurrency(),
                paymentTransaction.getAttemptNumber(),
                paymentTransaction.getMethod(),
                paymentTransaction.getErrorCode(),
                paymentTransaction.getErrorDescription(),
                paymentTransaction.getCreatedDt(),
                paymentTransaction.getModifiedDt(),
                eventResponses);
    }

    private Order loadOrder(Long orderId) {
        return orderRepository.findWithDetailsByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    private void authorizeOrderAccess(Order order) {
        if (securityUtil.hasRole("ADMIN")) {
            return;
        }
        Long userId = getCurrentUserId();
        if (!order.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to access this order payment");
        }
    }

    private long toSubunits(BigDecimal amount) {
        BigDecimal normalized = amount.setScale(2, RoundingMode.HALF_UP);
        return normalized.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
    }

    private String generateReceipt(Order order, int attemptNumber) {
        String receipt = order.getOrderNumber() + "-A" + attemptNumber;
        if (receipt.length() > 40) {
            return receipt.substring(0, 40);
        }
        return receipt;
    }

    private PaymentTransactionStatus mapGatewayOrderStatus(String gatewayStatus) {
        if (gatewayStatus == null) {
            return PaymentTransactionStatus.CREATED;
        }
        return switch (gatewayStatus.trim().toLowerCase()) {
            case "paid" -> PaymentTransactionStatus.PAID;
            default -> PaymentTransactionStatus.CREATED;
        };
    }

    private boolean verifyCheckoutSignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        String payload = razorpayOrderId + "|" + razorpayPaymentId;
        return verifyHmacSignature(payload, razorpaySignature, razorpayProperties.getKeySecret());
    }

    private boolean verifyHmacSignature(String payload, String signature, String secret) {
        String expectedSignature = hmacHex(payload, secret);
        String normalizedSignature = signature != null ? signature.trim() : "";
        return MessageDigest.isEqual(
                expectedSignature.getBytes(StandardCharsets.UTF_8),
                normalizedSignature.getBytes(StandardCharsets.UTF_8));
    }

    private String hmacHex(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new BadRequestException("Unable to verify Razorpay signature");
        }
    }

    private void ensureRazorpayCredentialsConfigured() {
        if (trimToNull(razorpayProperties.getKeyId()) == null || trimToNull(razorpayProperties.getKeySecret()) == null) {
            throw new BadRequestException("Razorpay credentials are not configured");
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new BadRequestException("Unable to serialize Razorpay request payload");
        }
    }

    private JsonNode parseJson(String json, String errorMessage) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException ex) {
            throw new BadRequestException(errorMessage);
        }
    }

    private String extractGatewayError(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String description = textValue(root.path("error"), "description");
            if (description != null) {
                return description;
            }
        } catch (JsonProcessingException ex) {
            // ignore and fall back
        }
        String raw = trimToNull(responseBody);
        return raw != null ? raw : "Unknown Razorpay error";
    }

    private String normalizeBaseUrl(String baseUrl) {
        String value = trimToNull(baseUrl);
        if (value == null) {
            return "https://api.razorpay.com";
        }
        if (value.endsWith("/")) {
            return value.substring(0, value.length() - 1);
        }
        return value;
    }

    private String textValue(JsonNode node, String fieldName) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        JsonNode field = node.get(fieldName);
        if (field == null || field.isNull()) {
            return null;
        }
        String value = field.asText();
        return value != null && !value.isBlank() ? value : null;
    }

    private Long getCurrentUserId() {
        String sub = securityUtil.getCurrentSub();
        try {
            return Long.parseLong(sub);
        } catch (NumberFormatException ex) {
            throw new UnauthorizedException("Invalid authenticated user");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private WebhookEventResolution resolveWebhookEvent(String event) {
        if (event == null) {
            return new WebhookEventResolution(null, PaymentEventType.WEBHOOK_EVENT, "Webhook event received");
        }
        return switch (event) {
            case "payment.authorized" -> new WebhookEventResolution(
                    PaymentTransactionStatus.AUTHORIZED,
                    PaymentEventType.PAYMENT_AUTHORIZED,
                    "Payment authorized on Razorpay");
            case "payment.captured" -> new WebhookEventResolution(
                    PaymentTransactionStatus.CAPTURED,
                    PaymentEventType.PAYMENT_CAPTURED,
                    "Payment captured on Razorpay");
            case "order.paid" -> new WebhookEventResolution(
                    PaymentTransactionStatus.PAID,
                    PaymentEventType.PAYMENT_CAPTURED,
                    "Order marked paid on Razorpay");
            case "payment.failed" -> new WebhookEventResolution(
                    PaymentTransactionStatus.FAILED,
                    PaymentEventType.PAYMENT_FAILED,
                    "Payment failed on Razorpay");
            case "refund.processed", "payment.refunded" -> new WebhookEventResolution(
                    PaymentTransactionStatus.REFUNDED,
                    PaymentEventType.PAYMENT_REFUNDED,
                    "Payment refunded on Razorpay");
            default -> new WebhookEventResolution(null, PaymentEventType.WEBHOOK_EVENT, "Webhook event received");
        };
    }

    private record WebhookEventResolution(
            PaymentTransactionStatus status,
            PaymentEventType eventType,
            String note) {
    }
}
