# Payment gateway setup

Razorpay is enabled by default; Cashfree is disabled. Super admins can change both independently under **Payment Gateways** (`/superadmin/payment-gateways`). Switches are persisted in `payment_gateway_settings`; credentials are never saved there or accepted through an API.

## Backend configuration

Set credentials only in the backend `.env` (ignored by Git). Never put secrets in frontend/Vite environment variables. Restart the backend after changing credentials.

```dotenv
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
CASHFREE_CLIENT_ID=
CASHFREE_CLIENT_SECRET=
CASHFREE_MODE=sandbox
CASHFREE_API_VERSION=2025-01-01
```

Use `CASHFREE_MODE=production` with production credentials when going live. “Configured” means the required values are present; it does not mean that provider authentication or merchant activation has been validated. Blank credentials hide a gateway from customers and prevent enabling it. The Razorpay public checkout key and Cashfree payment session token are passed to the browser as required by their SDKs; server secrets are never returned.

For an existing PostgreSQL database, apply `payment-gateways-migration.sql` before enabling Cashfree. Hibernate schema update alone does not reliably replace existing enum check constraints or drop the legacy Razorpay order column's NOT NULL constraint. The migration preserves existing settings and payment records. It is not run automatically against a live database.

## Cashfree dashboard

Whitelist the storefront domain and configure the payment webhook URL as:

`https://YOUR_BACKEND/api/payments/cashfree/webhook`

Subscribe to payment success/failure/user-dropped events. Webhook signatures use the Cashfree client secret, the timestamp header and the exact raw request body. Configure the existing Razorpay webhook independently at `/api/payments/razorpay/webhook` with `RAZORPAY_WEBHOOK_SECRET`.

Customers choose an enabled, configured gateway in the cart and in My Orders. Cashfree opens in a modal. The server fetches provider payment status and checks amount/currency before confirming payment. Customers can check payment status in My Orders if they close the modal or verification is delayed. Webhook verification continues when a gateway is disabled, so in-flight payments can settle. Cashfree failure/pending events do not overwrite successful payments.

Retries check provider status and reuse the original gateway session. Once a payment session exists, the order stays with that gateway to prevent two independently chargeable sessions. Customers choose either gateway for a new checkout. An expired/terminated Cashfree session can be replaced with another Cashfree session. Razorpay status checks reconcile captured payments even when the browser callback was lost. Both gateways serialize payment updates using the same database order lock.

## Validation before production

Run a sandbox checkout for each gateway, test dismissal and retry, deliver a signed Cashfree success webhook twice, and check that there is one payment-success timeline event. Confirm that users and ordinary admins cannot access gateway settings, and that disabling both gateways prevents checkout. A gateway status check does not replace this end-to-end merchant test.

References: [Cashfree hosted checkout](https://www.cashfree.com/docs/payments/online/web/redirect), [Create Order](https://www.cashfree.com/docs/api-reference/payments/latest/orders/create-order), [webhook signature verification](https://www.cashfree.com/docs/payments/online/webhooks/signature-verification), [webhook idempotency](https://www.cashfree.com/docs/payments/online/webhooks/webhook-indempotency).
