
# 🗂 Backend Project Structure

```
ecommercebackend
│
├── common
│     ├── exception
│     └── utils
│
├── config
│     ├── CorsConfig.java
│     └── WebConfig.java
│
├── module
│     ├── auth
│     ├── user
│     ├── product
│     ├── order
│     ├── payment
│     ├── inventory
│     ├── cart
│     └── emailtemplate
```


# 💻 Technology Stack

## 🔹 Frontend

* React – User Interface
* Next.js – SEO & Server-side rendering
* Tailwind CSS – UI styling
* Redux – State management

---

## 🔹 Backend

* Spring Boot – REST API development
* Spring Security – Authentication & Authorization
* Hibernate – ORM for database interaction
* JWT – Token-based authentication

---

## 🔹 Database & Search

* PostgreSQL – Primary database
* Redis – Caching & session management

---

## 🔹 Payments

* Razorpay – Secure online payments (India)

---

# 💳 Razorpay Payment Integration Design (Production-Ready)

## Overview
Production-grade Razorpay integration with proper order lifecycle, inventory management, and webhook handling.

---

## ✅ 1. Order & Payment Lifecycle (Corrected)

### Order Status Flow
```
PLACED → PAYMENT_PENDING → CONFIRMED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
                         ↓
                    CANCELLED (if payment fails/timeout)
```

### Payment Status Flow
```
CREATED → SUCCESS / FAILED
SUCCESS → REFUNDED (if refund initiated)
```

**Key Rule**: Order and Payment are **decoupled but linked**. Payment status does NOT directly change order status.

---

## ✅ 2. Complete Payment Flow

### Step 1: Create Order
```
Customer submits order → 
Order created with status=PLACED → 
Inventory RESERVED (reduce available_qty, increase reserved_qty) → 
Create Razorpay order → 
Update order status to PAYMENT_PENDING → 
Return razorpay_order_id to frontend
```

### Step 2: Customer Payment (Frontend)
```
Frontend opens Razorpay checkout → 
Customer completes payment → 
Razorpay returns payment details to frontend
```

### Step 3: Frontend Verification (UX Only)
```
Frontend sends payment details to backend → 
Backend verifies signature → 
Show success message to user (optimistic UX)
```

### Step 4: Webhook Verification (Source of Truth)
```
Razorpay webhook triggers → 
Backend verifies webhook signature → 
Update payment status to SUCCESS → 
Update order status to CONFIRMED → 
Commit inventory reservation
```

### Step 5: Payment Failure Handling
```
If payment fails → 
Webhook updates payment status to FAILED → 
Order status remains PAYMENT_PENDING → 
Scheduled job auto-cancels after 30 mins → 
Release reserved inventory
```

---

## ✅ 3. Database Schema (Enhanced)

### Payment Transaction Table
```sql
CREATE TABLE payment_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(order_id),
    razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature VARCHAR(200),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL, -- CREATED, SUCCESS, FAILED, REFUNDED
    payment_method VARCHAR(50),
    provider VARCHAR(30) NOT NULL DEFAULT 'RAZORPAY',
    provider_response JSONB,
    failure_reason VARCHAR(255),
    refund_id VARCHAR(100),
    webhook_event_id VARCHAR(100),
    user_id BIGINT NOT NULL,
    ip_address VARCHAR(45),
    created_dt TIMESTAMP NOT NULL,
    updated_dt TIMESTAMP,
    CONSTRAINT unique_successful_payment UNIQUE (order_id, status) WHERE status = 'SUCCESS'
);

CREATE INDEX idx_payment_razorpay_order_id ON payment_transactions(razorpay_order_id);
CREATE INDEX idx_payment_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_status ON payment_transactions(status);
```

### Product Inventory Enhancement
```sql
ALTER TABLE products ADD COLUMN reserved_quantity INT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN version INT NOT NULL DEFAULT 0; -- Optimistic locking
```

---

## ✅ 4. API Endpoints

### 1. Create Razorpay Order
```
POST /api/payments/create-order
Headers: Authorization: Bearer <token>
Request: { "orderId": 123 }
Response: {
  "razorpayOrderId": "order_xyz",
  "razorpayKeyId": "rzp_test_xxxxx",
  "amount": 150000, // in paise
  "currency": "INR",
  "orderId": 123,
  "orderNumber": "ORD-00000123"
}
```

### 2. Verify Payment (Frontend Callback - UX Only)
```
POST /api/payments/verify
Headers: Authorization: Bearer <token>
Request: {
  "orderId": 123,
  "razorpayOrderId": "order_xyz",
  "razorpayPaymentId": "pay_abc",
  "razorpaySignature": "signature_hash"
}
Response: {
  "success": true,
  "message": "Payment verification initiated",
  "note": "Final confirmation via webhook"
}
```

### 3. Payment Webhook (Mandatory - Source of Truth)
```
POST /api/payments/webhook
Headers: X-Razorpay-Signature: <webhook_signature>
Request: Razorpay webhook payload
Events:
  - payment.captured
  - payment.failed
  - refund.processed
Response: { "status": "ok" }
```

---

## ✅ 5. Inventory Management

### Reserve Stock on Order Creation
```java
@Transactional
public void reserveStock(Long productId, int quantity) {
    Product product = productRepository.findByIdWithLock(productId); // SELECT FOR UPDATE
    if (product.getStockQuantity() < quantity) {
        throw new InsufficientStockException();
    }
    product.setStockQuantity(product.getStockQuantity() - quantity);
    product.setReservedQuantity(product.getReservedQuantity() + quantity);
}
```

### Commit Reservation on Payment Success
```java
@Transactional
public void commitReservation(Order order) {
    for (OrderItem item : order.getItems()) {
        Product product = item.getProduct();
        product.setReservedQuantity(product.getReservedQuantity() - item.getQuantity());
    }
}
```

### Release Stock on Payment Failure
```java
@Transactional
public void releaseStock(Order order) {
    for (OrderItem item : order.getItems()) {
        Product product = item.getProduct();
        product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
        product.setReservedQuantity(product.getReservedQuantity() - item.getQuantity());
    }
}
```

---

## ✅ 6. Security Measures (Enhanced)

### 1. Signature Verification
```java
public boolean verifySignature(String orderId, String paymentId, String signature) {
    String payload = orderId + "|" + paymentId;
    String expectedSignature = HmacUtils.hmacSha256Hex(razorpaySecret, payload);
    return MessageDigest.isEqual(signature.getBytes(), expectedSignature.getBytes());
}
```

### 2. Webhook Signature Verification
```java
public boolean verifyWebhookSignature(String payload, String signature) {
    String expectedSignature = HmacUtils.hmacSha256Hex(razorpayWebhookSecret, payload);
    return MessageDigest.isEqual(signature.getBytes(), expectedSignature.getBytes());
}
```

### 3. Amount Validation
```java
if (!order.getTotalAmount().multiply(new BigDecimal("100")).equals(razorpayAmount)) {
    throw new AmountMismatchException();
}
```

### 4. User Authorization
```java
if (!order.getUser().getUserId().equals(currentUserId)) {
    throw new UnauthorizedException();
}
```

### 5. Idempotency Protection
```java
@Transactional
public void processPayment(String paymentId) {
    if (paymentRepository.existsByRazorpayPaymentIdAndStatus(paymentId, "SUCCESS")) {
        return; // Already processed
    }
    // Process payment
}
```

---

## ✅ 7. Configuration

### Environment Variables
```properties
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=webhook_secret
PAYMENT_TIMEOUT_MINUTES=30
```

### Razorpay Client Configuration
```java
@Configuration
public class RazorpayConfig {
    @Value("${RAZORPAY_KEY_ID}")
    private String keyId;
    
    @Value("${RAZORPAY_KEY_SECRET}")
    private String keySecret;
    
    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        return new RazorpayClient(keyId, keySecret);
    }
}
```

---

## ✅ 8. Redis Usage

### Idempotency Key Cache
```java
public boolean isPaymentProcessed(String paymentId) {
    return redisTemplate.hasKey("payment:processed:" + paymentId);
}

public void markPaymentProcessed(String paymentId) {
    redisTemplate.opsForValue().set("payment:processed:" + paymentId, "1", 24, TimeUnit.HOURS);
}
```

### Rate Limiting
```java
@RateLimiter(name = "payment", fallbackMethod = "rateLimitFallback")
public PaymentResponse createOrder(CreateOrderRequest request) {
    // Implementation
}
```

---

## ✅ 9. Scheduled Jobs

### Auto-Cancel Pending Payments
```java
@Scheduled(fixedDelay = 300000) // Every 5 minutes
public void cancelExpiredPayments() {
    LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);
    List<Order> expiredOrders = orderRepository.findByStatusAndCreatedDtBefore(
        OrderStatus.PAYMENT_PENDING, cutoff);
    
    for (Order order : expiredOrders) {
        releaseStock(order);
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }
}
```

---

## ✅ 10. Logging & Audit

### Structured Logging
```java
log.info("Payment verification initiated", 
    Map.of(
        "orderId", orderId,
        "paymentId", paymentId,
        "userId", userId,
        "ipAddress", ipAddress,
        "amount", amount
    ));
```

### Audit Trail
```sql
CREATE TABLE payment_audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT REFERENCES payment_transactions(transaction_id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    user_id BIGINT,
    ip_address VARCHAR(45),
    created_dt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## ✅ 11. Implementation Components

### Entities
- `PaymentTransaction.java`
- `PaymentAuditLog.java`

### Repositories
- `PaymentTransactionRepository.java`
- `PaymentAuditLogRepository.java`

### Services
- `PaymentService.java` - Main payment orchestration
- `RazorpayService.java` - Razorpay API integration
- `InventoryService.java` - Stock management
- `PaymentWebhookService.java` - Webhook processing

### Controllers
- `PaymentController.java` - Customer-facing APIs
- `PaymentWebhookController.java` - Webhook endpoint

### DTOs
- `CreateRazorpayOrderRequest.java`
- `CreateRazorpayOrderResponse.java`
- `VerifyPaymentRequest.java`
- `VerifyPaymentResponse.java`
- `WebhookPayload.java`

### Scheduled Jobs
- `PaymentCleanupJob.java` - Auto-cancel expired payments

---

## ✅ 12. Error Handling

1. **Invalid Order**: Order not found or not in PLACED status
2. **Invalid Signature**: Payment/webhook signature verification failed
3. **Amount Mismatch**: Payment amount doesn't match order amount
4. **Duplicate Payment**: Payment already processed (idempotency)
5. **Insufficient Stock**: Stock not available during reservation
6. **Razorpay API Error**: Handle API failures with retry logic
7. **Webhook Processing Error**: Log and alert for manual intervention
8. **Unauthorized Access**: User doesn't own the order

---

## ✅ 13. Testing Strategy

### Unit Tests
- Signature verification logic
- Amount validation
- Inventory reservation/release
- Idempotency checks

### Integration Tests
- Complete payment flow
- Webhook processing
- Concurrent payment attempts
- Stock reservation race conditions

### Test Mode
- Use Razorpay test credentials
- Test cards: 4111 1111 1111 1111
- Test payment failures
- Test webhook events
---

## ✅ 14. Production Checklist

- [ ] Webhook endpoint is HTTPS only
- [ ] Webhook signature verification enabled
- [ ] Rate limiting configured
- [ ] Idempotency protection implemented
- [ ] Inventory locking with SELECT FOR UPDATE
- [ ] Amount validation on every payment
- [ ] User authorization checks
- [ ] Scheduled job for payment cleanup
- [ ] Structured logging enabled
- [ ] Database backups configured
- [ ] Redis for caching configured
- [ ] Error alerting setup (email/Slack)
- [ ] Load testing completed
- [ ] Security audit completed

---

---

## 🔹 Deployment

* Linux VPS server
* Storage on same VPS

---
