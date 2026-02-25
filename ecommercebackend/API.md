# Ecommerce Backend API Reference

This document lists the APIs currently implemented and the request payload format.

## Base
- Base URL: `http://localhost:8080`
- Content-Type for POST requests: `application/json`

## Common Response Format
Every API now returns this wrapper:

```json
{
  "status": true,
  "code": 200,
  "message": "Success message",
  "data": {}
}
```

Notes:
- `status`: `true` for success, `false` for error
- `code`: HTTP status code
- `message`: human-readable message
- `data`: actual response payload (or `null`)

## Auth Data Model (Updated)
- `customers` table: customer profile data (`firstName`, `lastName`, `phone`, etc.)
- `login_accounts` table: login/auth data for both ADMIN and CUSTOMER (`email`, `username`, `password_hash`, verification state)

## Admin Authentication

### POST `/api/admin/login`
Admin login.

Request:
```json
{
  "usernameOrEmail": "admin",
  "password": "Admin@123"
}
```

Validation:
- `usernameOrEmail`: required, non-blank
- `password`: required, non-blank

## Customer Authentication

### POST `/api/auth/register`
Customer self-registration (creates customer profile + login account in unverified state).

Request:
```json
{
  "email": "customer@example.com",
  "phone": "+919999999999",
  "password": "Secret123",
  "firstName": "John",
  "lastName": "Doe"
}
```

Validation:
- `email`: required, valid email
- `phone`: optional
- `password`: required, length 6..128
- `firstName`: required, non-blank
- `lastName`: optional

Notes:
- OTP is sent to the registered email address.

Sample success response:
```json
{
  "status": true,
  "code": 200,
  "message": "Customer registered successfully",
  "data": {
    "customerId": "d6a63a6e-3f59-476f-8999-eaf4a5020f03",
    "email": "customer@example.com",
    "message": "Registered successfully. Verification code has been sent to your email.",
    "verificationExpiresAt": "2026-02-25T12:20:00Z"
  }
}
```

### POST `/api/auth/verify`
Verify customer account with OTP.

Request:
```json
{
  "email": "customer@example.com",
  "verificationCode": "123456"
}
```

Validation:
- `email`: required, valid email
- `verificationCode`: required, length 4..16

### POST `/api/auth/login`
Customer login after verification.

Request:
```json
{
  "email": "customer@example.com",
  "password": "Secret123"
}
```

Validation:
- `email`: required, valid email
- `password`: required, non-blank

## Admin - Customers

### POST `/api/admin/customers`
Admin creates a customer (profile + verified login account).

Request:
```json
{
  "email": "customer@example.com",
  "phone": "+919999999999",
  "password": "Secret123",
  "firstName": "John",
  "lastName": "Doe"
}
```

Validation:
- `email`: required, valid email
- `phone`: optional
- `password`: required, length 6..128
- `firstName`: optional
- `lastName`: optional

## Admin - Categories

### POST `/api/admin/categories`
Create category.

Request:
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "parentId": null
}
```

Validation:
- `name`: required, non-blank, max 128
- `slug`: required, non-blank, max 160
- `parentId`: optional UUID

## Public - Categories

### GET `/api/categories`
List categories.

## Products

### POST `/api/products`
Create product.

Request:
```json
{
  "sku": "SKU-1001",
  "name": "iPhone 15",
  "slug": "iphone-15",
  "shortDescription": "Latest model",
  "description": "Detailed product description",
  "price": 79999.0,
  "currency": "INR",
  "taxPercent": 18.0,
  "active": true,
  "meta": "{\"color\":\"black\"}",
  "categoryIds": [
    "11111111-1111-1111-1111-111111111111"
  ],
  "images": [
    {
      "url": "https://cdn.example.com/p1.jpg",
      "altText": "Front view",
      "position": 0
    }
  ],
  "availableQty": 100,
  "safetyStock": 10
}
```

Validation:
- `sku`: required, non-blank, max 64
- `name`: required
- `slug`: required
- `shortDescription`: optional, max 512
- `description`: optional
- `price`: required, >= 0
- `currency`: optional, exactly 3 chars if provided
- `taxPercent`: required, >= 0
- `active`: optional boolean
- `meta`: optional string
- `categoryIds`: optional UUID list
- `images`: optional list (`url` required)
- `availableQty`: optional
- `safetyStock`: optional

### GET `/api/products/{slug}`
Get product by slug.

## Cart

### POST `/api/cart/{customerId}`
Add/update cart item.

Request:
```json
{
  "productId": "22222222-2222-2222-2222-222222222222",
  "quantity": 2
}
```

Validation:
- `productId`: required UUID
- `quantity`: required, min 1

### GET `/api/cart/{customerId}`
Get active cart for customer.

## Checkout & Orders

### POST `/api/checkout`
Create order and reserve stock.

Request:
```json
{
  "customerId": "33333333-3333-3333-3333-333333333333",
  "items": [
    {
      "productId": "22222222-2222-2222-2222-222222222222",
      "quantity": 1
    }
  ],
  "shippingAddress": "{\"line1\":\"Street 1\",\"city\":\"Chennai\"}",
  "billingAddress": "{\"line1\":\"Street 1\",\"city\":\"Chennai\"}"
}
```

Validation:
- `customerId`: required UUID
- `items`: required, min size 1
- `items[].productId`: required UUID
- `items[].quantity`: required, min 1
- `shippingAddress`: optional
- `billingAddress`: optional

### GET `/api/orders/{orderNumber}`
Get order details.

## Admin - Inventory

### POST `/api/admin/products/{productId}/stock`
Restock product.

Request:
```json
{
  "quantity": 25
}
```

Validation:
- `quantity`: required, min 1

## Payment Webhook

### POST `/api/webhook/razorpay`
Process Razorpay webhook payload (current internal DTO format).

Request:
```json
{
  "orderNumber": "ORD-20260225-0001",
  "providerPaymentId": "pay_ABC123",
  "status": "SUCCESS",
  "method": "upi",
  "rawPayload": "{...raw webhook json...}"
}
```

Validation:
- `orderNumber`: required
- `providerPaymentId`: optional
- `status`: required
- `method`: optional
- `rawPayload`: optional

Status handling:
- Success states: `SUCCESS`, `PAID`, `CAPTURED`
- Failure states: `FAILED`, `CANCELLED`

## Email Templates

### GET `/api/email-templates`
List templates.

### GET `/api/email-templates/{name}`
Get template by name.

## Standard Error Format
```json
{
  "status": false,
  "code": 400,
  "message": "Validation failed",
  "data": [
    "fieldName: error message"
  ]
}
```
