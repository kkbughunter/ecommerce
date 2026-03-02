# 💳 Razorpay Payment Integration - Testing Guide

## 📋 Prerequisites

### 1. Get Razorpay Test Credentials
1. Sign up at https://razorpay.com/
2. Go to Settings → API Keys
3. Generate Test Mode keys
4. Copy `Key ID` and `Key Secret`

### 2. Update .env File
```properties
# Add these to your .env file
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
PAYMENT_TIMEOUT_MINUTES=30
```

### 3. Run Database Migrations
```sql
-- Add these columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_quantity INT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 0;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(order_id),
    razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature VARCHAR(200),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL,
    payment_method VARCHAR(50),
    provider VARCHAR(30) NOT NULL DEFAULT 'RAZORPAY',
    provider_response TEXT,
    failure_reason VARCHAR(255),
    refund_id VARCHAR(100),
    webhook_event_id VARCHAR(100),
    user_id BIGINT NOT NULL,
    ip_address VARCHAR(45),
    created_dt TIMESTAMP NOT NULL,
    updated_dt TIMESTAMP
);

CREATE INDEX idx_payment_razorpay_order_id ON payment_transactions(razorpay_order_id);
CREATE INDEX idx_payment_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_status ON payment_transactions(status);
```

---

## 🧪 Testing Flow

### Step 1: Create an Order
```http
POST http://localhost:8080/api/orders/place
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "orderId": 123,
    "orderNumber": "ORD-00000123",
    "status": "PLACED",
    "totalAmount": 1500.00
  }
}
```

**Note:** Order status will be `PLACED` initially.

---

### Step 2: Create Razorpay Order
```http
POST http://localhost:8080/api/payments/create-order
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "orderId": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Razorpay order created successfully",
  "data": {
    "razorpayOrderId": "order_xyz123",
    "razorpayKeyId": "rzp_test_xxxxx",
    "amount": 150000,
    "currency": "INR",
    "orderId": 123,
    "orderNumber": "ORD-00000123"
  }
}
```

**What happens:**
- Order status changes to `PAYMENT_PENDING`
- Stock is reserved (moved from `stock_quantity` to `reserved_quantity`)
- Payment transaction created with status `CREATED`
- 30-minute timer starts (auto-cancel if not paid)

---

### Step 3: Frontend Payment (Razorpay Checkout)

**HTML/JavaScript Example:**
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
    <button onclick="payNow()">Pay Now</button>

    <script>
        function payNow() {
            const options = {
                key: "rzp_test_xxxxx", // From Step 2 response
                amount: 150000, // From Step 2 response (in paise)
                currency: "INR",
                name: "Your Store Name",
                description: "Order #ORD-00000123",
                order_id: "order_xyz123", // From Step 2 response
                handler: function (response) {
                    // Payment successful
                    verifyPayment(response);
                },
                prefill: {
                    name: "Customer Name",
                    email: "customer@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#3399cc"
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();
        }

        function verifyPayment(response) {
            fetch('http://localhost:8080/api/payments/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer <your_jwt_token>'
                },
                body: JSON.stringify({
                    orderId: 123,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature
                })
            })
            .then(res => res.json())
            .then(data => {
                console.log('Payment verified:', data);
                alert('Payment successful! Order will be confirmed via webhook.');
            });
        }
    </script>
</body>
</html>
```

---

### Step 4: Verify Payment (Backend)
```http
POST http://localhost:8080/api/payments/verify
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "orderId": 123,
  "razorpayOrderId": "order_xyz123",
  "razorpayPaymentId": "pay_abc456",
  "razorpaySignature": "signature_hash_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verification initiated",
  "data": {
    "success": true,
    "message": "Payment verification initiated",
    "note": "Final confirmation will be done via webhook"
  }
}
```

**Note:** This is for UX only. Webhook is the source of truth.

---

### Step 5: Webhook Processing (Automatic)

Razorpay will send webhook to:
```
POST http://your-domain.com/api/payments/webhook
```

**What happens:**
- Webhook signature verified
- Payment status updated to `SUCCESS`
- Order status changed to `CONFIRMED`
- Reserved stock committed (moved from `reserved_quantity` to sold)

---

## 🧪 Test Scenarios

### ✅ Scenario 1: Successful Payment

1. Create order → Status: `PLACED`
2. Create Razorpay order → Status: `PAYMENT_PENDING`
3. Complete payment with test card: `4111 1111 1111 1111`
4. Webhook received → Status: `CONFIRMED`
5. Check inventory: Stock reduced, reservation cleared

**Test Card Details:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

---

### ❌ Scenario 2: Payment Failure

1. Create order → Status: `PLACED`
2. Create Razorpay order → Status: `PAYMENT_PENDING`
3. Close payment window without paying
4. Wait 30 minutes
5. Scheduled job runs → Status: `CANCELLED`
6. Check inventory: Stock released back

---

### ⏱️ Scenario 3: Payment Timeout

1. Create order → Status: `PLACED`
2. Create Razorpay order → Status: `PAYMENT_PENDING`
3. Don't complete payment
4. After 30 minutes, check order status → `CANCELLED`
5. Check inventory: Stock released

---

### 🔄 Scenario 4: Duplicate Payment Prevention

1. Complete payment successfully
2. Try to verify same payment again
3. Response: "Payment already verified"
4. Order remains `CONFIRMED` (no duplicate processing)

---

## 🔍 Verification Checklist

### Database Checks

```sql
-- Check order status
SELECT order_id, order_number, status, payment_status, total_amount 
FROM orders 
WHERE order_id = 123;

-- Check payment transaction
SELECT transaction_id, razorpay_order_id, razorpay_payment_id, 
       status, amount, created_dt 
FROM payment_transactions 
WHERE order_id = 123;

-- Check inventory
SELECT product_id, name, stock_quantity, reserved_quantity 
FROM products 
WHERE product_id = 1;
```

### Expected Results

**After Order Creation:**
- Order: `status = PLACED`
- Product: `stock_quantity` reduced, `reserved_quantity` increased

**After Payment Pending:**
- Order: `status = PAYMENT_PENDING`
- Payment: `status = CREATED`

**After Payment Success:**
- Order: `status = CONFIRMED`, `payment_status = PAID`
- Payment: `status = SUCCESS`
- Product: `reserved_quantity` reduced (committed)

**After Payment Timeout:**
- Order: `status = CANCELLED`
- Product: `stock_quantity` restored, `reserved_quantity` reduced

---

## 🐛 Troubleshooting

### Issue 1: "Invalid webhook signature"
**Solution:** Check `RAZORPAY_WEBHOOK_SECRET` in .env file

### Issue 2: "Amount mismatch"
**Solution:** Ensure order amount matches Razorpay order amount

### Issue 3: "Insufficient stock"
**Solution:** Check product `stock_quantity` before ordering

### Issue 4: Order stuck in PAYMENT_PENDING
**Solution:** 
- Check if webhook is configured correctly
- Wait for scheduled job (runs every 5 minutes)
- Manually cancel: Update order status to CANCELLED

### Issue 5: Stock not released after cancellation
**Solution:** Check `PaymentCleanupJob` logs, ensure scheduling is enabled

---

## 📊 Monitoring

### Check Logs
```bash
# Payment creation
grep "Razorpay order created" logs/application.log

# Payment verification
grep "Payment verified" logs/application.log

# Webhook processing
grep "Processing webhook" logs/application.log

# Stock operations
grep "Reserved stock" logs/application.log
grep "Committed reservation" logs/application.log
grep "Released stock" logs/application.log

# Cleanup job
grep "Cancelled expired order" logs/application.log
```

---

## 🚀 Production Deployment

### 1. Configure Webhook URL in Razorpay Dashboard
1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Copy webhook secret to `.env`

### 2. Enable HTTPS
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### 3. Update .env with Production Keys
```properties
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=live_secret_key_here
RAZORPAY_WEBHOOK_SECRET=live_webhook_secret_here
```

### 4. Test in Production
- Use real payment methods
- Verify webhook delivery
- Monitor logs for errors
- Test refund flow (if implemented)

---

## 📝 API Reference

### POST /api/payments/create-order
Creates Razorpay order for payment

**Request:**
```json
{ "orderId": 123 }
```

**Response:**
```json
{
  "razorpayOrderId": "order_xyz",
  "razorpayKeyId": "rzp_test_xxxxx",
  "amount": 150000,
  "currency": "INR",
  "orderId": 123,
  "orderNumber": "ORD-00000123"
}
```

---

### POST /api/payments/verify
Verifies payment signature (UX only)

**Request:**
```json
{
  "orderId": 123,
  "razorpayOrderId": "order_xyz",
  "razorpayPaymentId": "pay_abc",
  "razorpaySignature": "signature_hash"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verification initiated",
  "note": "Final confirmation via webhook"
}
```

---

### POST /api/payments/webhook
Receives Razorpay webhook (automatic)

**Headers:**
- `X-Razorpay-Signature`: Webhook signature

**Body:** Razorpay webhook payload

**Response:**
```json
{ "status": "ok" }
```

---

## ✅ Success Criteria

- ✅ Order created with PLACED status
- ✅ Stock reserved on order creation
- ✅ Razorpay order created successfully
- ✅ Order status changed to PAYMENT_PENDING
- ✅ Payment completed via Razorpay checkout
- ✅ Webhook received and verified
- ✅ Order status changed to CONFIRMED
- ✅ Payment status changed to SUCCESS
- ✅ Reserved stock committed
- ✅ Expired orders auto-cancelled after 30 minutes
- ✅ Stock released on cancellation
- ✅ Duplicate payment prevented

---

## 🎯 Next Steps

1. Test complete flow in development
2. Configure webhook in Razorpay dashboard
3. Test webhook delivery
4. Deploy to production
5. Monitor payment transactions
6. Set up alerts for failed payments
7. Implement refund flow (optional)

---

**Happy Testing! 🚀**
