package com.astraval.ecommercebackend.modules.payment;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.*;
import com.astraval.ecommercebackend.common.exception.*;
import com.astraval.ecommercebackend.common.util.SecurityUtil;
import com.astraval.ecommercebackend.modules.order.*;

@Service
public class CashfreePaymentService {
    private final OrderRepository orders;
    private final PaymentTransactionRepository transactions;
    private final GatewaySettingsService settings;
    private final CashfreeGatewayClient client;
    private final CashfreeProperties properties;
    private final SecurityUtil security;
    private final RazorpayPaymentService tracking;
    private final ObjectMapper mapper;

    public CashfreePaymentService(OrderRepository orders, PaymentTransactionRepository transactions,
            GatewaySettingsService settings, CashfreeGatewayClient client, CashfreeProperties properties,
            SecurityUtil security, RazorpayPaymentService tracking, ObjectMapper mapper) {
        this.orders = orders; this.transactions = transactions; this.settings = settings;
        this.client = client; this.properties = properties; this.security = security;
        this.tracking = tracking; this.mapper = mapper;
    }
    public record CashfreeOrderResponse(PaymentGateway gateway, Long orderId, String gatewayOrderId,
            String paymentSessionId, String mode, String status) {}
    public record VerificationResponse(boolean paid, String status) {}

    @Transactional
    public CashfreeOrderResponse create(Long orderId) {
        settings.requireAvailable(PaymentGateway.CASHFREE);
        Order order = lockedOrder(orderId);
        authorize(order);
        if (order.getPaymentStatus() == PaymentStatus.PAID || order.getPaymentStatus() == PaymentStatus.REFUNDED
                || order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.RETURNED) {
            throw new BadRequestException("This order cannot accept a new payment");
        }
        if (order.getTotalAmount() == null || order.getTotalAmount().compareTo(BigDecimal.ONE) < 0) {
            throw new BadRequestException("Cashfree requires an order amount of at least 1");
        }
        if (order.getContactPhone() == null || order.getContactPhone().isBlank()) {
            throw new BadRequestException("Please add a contact phone number to your profile before paying");
        }
        var existing = PaymentSessionGuard.existing(transactions, orderId, PaymentGateway.CASHFREE);
        if (existing.isPresent()) {
            var transaction = existing.get();
            if (reconcile(transaction, PaymentEventSource.API, actor()).paid()) {
                return new CashfreeOrderResponse(PaymentGateway.CASHFREE, orderId, transaction.getGatewayOrderId(), null, properties.getMode(), "SUCCESS");
            }
            JsonNode prior = client.order(transaction.getGatewayOrderId());
            String state = prior.path("order_status").asText();
            if ("ACTIVE".equals(state) && !prior.path("payment_session_id").asText().isBlank()) {
                return new CashfreeOrderResponse(PaymentGateway.CASHFREE, orderId, transaction.getGatewayOrderId(),
                        prior.path("payment_session_id").asText(), properties.getMode(), "CREATED");
            }
            if (!"EXPIRED".equals(state) && !"TERMINATED".equals(state)) {
                throw new BadRequestException("A payment is still processing. Please check its status before retrying.");
            }
        }
        String gatewayOrderId = "cf_" + UUID.randomUUID().toString().replace("-", "");
        var body = new HashMap<String, Object>();
        body.put("order_id", gatewayOrderId);
        body.put("order_amount", order.getTotalAmount());
        body.put("order_currency", order.getCurrency());
        body.put("customer_details", Map.of("customer_id", order.getUser().getUserId().toString(),
                "customer_phone", order.getContactPhone()));
        JsonNode result = client.create(body);
        String session = result.path("payment_session_id").asText();
        if (session.isBlank() || !gatewayOrderId.equals(result.path("order_id").asText())) {
            throw new BadRequestException("Cashfree returned an invalid payment session");
        }
        var transaction = new PaymentTransaction();
        transaction.setOrder(order);
        transaction.setGateway(PaymentGateway.CASHFREE);
        transaction.setProvider("CASHFREE");
        transaction.setGatewayOrderId(gatewayOrderId);
        transaction.setUserId(order.getUser().getUserId());
        transaction.setAmount(order.getTotalAmount());
        transaction.setCurrency(order.getCurrency());
        transaction.setReceipt(gatewayOrderId);
        transaction.setAttemptNumber(Math.toIntExact(transactions.countByOrderOrderId(orderId) + 1));
        transaction.setCreatedBy(actor());
        transactions.save(transaction);
        tracking.applyStatusChange(transaction, PaymentTransactionStatus.CREATED, PaymentEventSource.API,
                PaymentEventType.ORDER_CREATED, null, "Cashfree order created", null, actor());
        return new CashfreeOrderResponse(PaymentGateway.CASHFREE, orderId, gatewayOrderId, session, properties.getMode(), "CREATED");
    }

    @Transactional
    public VerificationResponse verify(Long orderId, String gatewayOrderId) {
        Order order = lockedOrder(orderId);
        authorize(order);
        var transaction = loadTransaction(gatewayOrderId);
        if (!orderId.equals(transaction.getOrder().getOrderId())) throw new BadRequestException("Payment does not belong to this order");
        return reconcile(transaction, PaymentEventSource.API, actor());
    }

    @Transactional
    public VerificationResponse webhook(String signature, String timestamp, String rawBody) {
        verifySignature(signature, timestamp, rawBody);
        JsonNode payload;
        try { payload = mapper.readTree(rawBody); }
        catch (Exception ex) { throw new BadRequestException("Invalid Cashfree webhook payload"); }
        String gatewayOrderId = payload.path("data").path("order").path("order_id").asText();
        // Signed non-payment events must not change a payment's status.
        if (!payload.path("type").asText().startsWith("PAYMENT_")) return new VerificationResponse(false, "IGNORED");
        Long orderId = transactions.findOrderIdForGateway(PaymentGateway.CASHFREE, gatewayOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Cashfree payment transaction not found"));
        lockedOrder(orderId);
        // Load the transaction only after locking so concurrent callbacks see committed state.
        var transaction = loadTransaction(gatewayOrderId);
        return reconcile(transaction, PaymentEventSource.WEBHOOK, null);
    }

    private VerificationResponse reconcile(PaymentTransaction transaction, PaymentEventSource source, Long actor) {
        if (transaction.getStatus() == PaymentTransactionStatus.SUCCESS || transaction.getStatus() == PaymentTransactionStatus.PAID
                || transaction.getStatus() == PaymentTransactionStatus.CAPTURED) return new VerificationResponse(true, "PAID");
        if (transaction.getStatus() == PaymentTransactionStatus.REFUNDED) return new VerificationResponse(false, "REFUNDED");
        JsonNode payments = client.payments(transaction.getGatewayOrderId());
        if (!payments.isArray()) throw new BadRequestException("Invalid Cashfree payment response");
        for (JsonNode payment : payments) {
            if (!"SUCCESS".equals(payment.path("payment_status").asText())) continue;
            if (!payment.path("payment_amount").isNumber()
                    || transaction.getAmount().compareTo(payment.path("payment_amount").decimalValue()) != 0
                    || !transaction.getCurrency().equals(payment.path("payment_currency").asText())
                    || payment.path("cf_payment_id").asText().isBlank()) {
                throw new BadRequestException("Cashfree payment amount or currency does not match the order");
            }
            transaction.setGatewayPaymentId(payment.path("cf_payment_id").asText());
            tracking.applyStatusChange(transaction, PaymentTransactionStatus.SUCCESS, source,
                    PaymentEventType.PAYMENT_VERIFIED, transaction.getGatewayPaymentId(),
                    "Cashfree payment verified with provider", null, actor);
            return new VerificationResponse(true, "PAID");
        }
        // Cashfree permits multiple attempts within one session; failure is not terminal.
        return new VerificationResponse(false, "PENDING");
    }

    private void verifySignature(String signature, String timestamp, String rawBody) {
        if (signature == null || timestamp == null || properties.getClientSecret() == null
                || properties.getClientSecret().isBlank()) throw new UnauthorizedException("Missing Cashfree webhook signature or configuration");
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.getClientSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expected = mac.doFinal((timestamp + rawBody).getBytes(StandardCharsets.UTF_8));
            if (!MessageDigest.isEqual(expected, Base64.getDecoder().decode(signature))) {
                throw new UnauthorizedException("Invalid Cashfree webhook signature");
            }
        } catch (UnauthorizedException ex) { throw ex; }
        catch (Exception ex) { throw new UnauthorizedException("Invalid Cashfree webhook signature"); }
    }
    private Order lockedOrder(Long id) {
        return orders.findForPaymentUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }
    private PaymentTransaction loadTransaction(String id) {
        return transactions.findByGatewayAndGatewayOrderId(PaymentGateway.CASHFREE, id)
                .orElseThrow(() -> new ResourceNotFoundException("Cashfree payment transaction not found"));
    }
    private void authorize(Order order) {
        if (!order.getUser().getUserId().equals(actor())) throw new UnauthorizedException("You cannot pay for this order");
    }
    private Long actor() {
        try { return Long.parseLong(security.getCurrentSub()); }
        catch (Exception ex) { throw new UnauthorizedException("Please sign in to continue"); }
    }
}
