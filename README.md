# ðŸ›’ Single Vendor E-Commerce Platform â€” **Villpo Store**

**End-to-End Online Store Management System**

---

## ðŸ“Œ Project Overview

**Villpo Store** is a **Single-Vendor E-Commerce Platform** designed to manage a complete online store with a structured admin hierarchy and multiple customer users.

The system enables administrators to manage products, stock, pricing, banners, and orders â€” while customers can browse products, manage their cart, place orders, make secure online payments, and track their purchases.

Unlike multi-vendor marketplaces such as Amazon or Flipkart, this platform is purpose-built for a **single business owner** managing one store, with a clear separation of administrative roles.

---

## ðŸŽ¯ Platform Roles

| Role | Description |
|---|---|
| ðŸ‘‘ **Super Admin** | Highest privilege â€” manages platform-level settings: categories, banners, sliders, and customers |
| ðŸª **Admin** | Manages day-to-day store operations: products, orders, payments, and invoices |
| ðŸ›ï¸ **Customer (User)** | Registered shoppers who browse, buy, and track orders |

> **Note:** Super Admin and Admin are two distinct roles with different access levels. Super Admin handles platform configuration, while Admin handles store operations.

---

## ðŸ’» Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router, Axios |
| **Backend** | Spring Boot 4, Spring Security, Hibernate / JPA |
| **Authentication** | JWT (Access + Refresh Token), OTP via Email |
| **Database** | PostgreSQL |
| **Caching** | Redis |
| **Payments** | Razorpay |
| **Deployment** | Linux VPS |

---

## âœ… Complete Feature List

---

### ðŸ” 1. Authentication & Account Management

> Available for all roles (Super Admin, Admin, Customer)

| Feature | Description |
|---|---|
| Register | New customers can create an account with name, email & password |
| OTP Email Verification | Account activation via a 6-digit OTP sent to registered email |
| Resend OTP | Option to resend OTP if it has expired |
| Login | Secure login using email/password â€” returns JWT Access & Refresh tokens |
| Token Refresh | Automatically issue new access tokens using refresh token (no re-login needed) |
| Logout | Revoke refresh token to end session securely |
| Forgot Password | Request a password reset OTP via email |
| Reset Password | Set a new password using the valid OTP |

**Post-login routing by role:**
- `SUPER_ADMIN` â†’ redirected to `/superadmin/customers`
- `ADMIN` â†’ redirected to `/admin` (Dashboard)
- `USER` â†’ redirected to `/client` (Storefront Home)

**Super Admin URLs:**
- `/superadmin/categories`
- `/superadmin/sliders`
- `/superadmin/main-banners`
- `/superadmin/customers`

---

### ðŸ‘‘ 2. Super Admin â€” Platform Management

> Accessible only to Super Admin role

#### 2a. Category Management
| Feature | Description |
|---|---|
| Create Category | Add new product categories |
| View All Categories | List all categories in the system |
| Auto-Seeded Categories | Default categories initialized on first system startup |

#### 2b. Home Slider Management
| Feature | Description |
|---|---|
| Create Slider | Add new promotional image sliders for the homepage |
| Update Slider | Edit slider title, image, link, and display order |
| Activate / Deactivate Slider | Toggle slider visibility on the homepage |
| Delete Slider | Remove sliders permanently |
| Placement Tags | Assign sliders to specific positions on the website |
| Image Upload | Upload slider images directly |

#### 2c. Main Banner Management
| Feature | Description |
|---|---|
| Create Banner | Add main promotional banners for the homepage |
| Update Banner | Edit banner details and images |
| Activate / Deactivate Banner | Toggle banner visibility |
| Delete Banner | Remove banners permanently |
| Image Upload | Upload banner images directly |

#### 2d. Customer Management
| Feature | Description |
|---|---|
| View All Customers | Paginated list of all registered customers |
| View Customer Details | Full profile including addresses and order history |
| Activate / Deactivate Customer | Enable or disable customer account access |
| Create Customer (Admin-side) | Manually create customer accounts from admin panel |

---

### ðŸª 3. Admin â€” Store Operations

> Accessible to Admin role

#### 3a. Admin Dashboard
| Feature | Description |
|---|---|
| Revenue Summary | Total revenue, today's revenue, this month's revenue |
| Order Summary | Total, pending, confirmed, delivered, and cancelled order counts |
| Product Summary | Active products, low-stock alerts, total products |
| Recent Orders | Latest orders with statuses at a glance |
| Revenue Graph | Visual data chart of revenue over time |

#### 3b. Product Management
| Feature | Description |
|---|---|
| Create Product | Add new products with name, description, price, category, and stock |
| Update Product | Edit product details at any time |
| Activate / Deactivate Product | Control product visibility in the storefront |
| Multiple Product Images | Upload and manage multiple images per product |
| Stock Management | Track available quantity per product |
| Reserved Inventory | Automatically reserve stock on order placement; release on payment failure |
| Delivery Fee Calculation | Automatic delivery charge computation per order |

#### 3c. Order Management (Admin)
| Feature | Description |
|---|---|
| View All Orders | Paginated list with filters by status, date, customer |
| View Order Details | Full breakdown: items, pricing, customer info, delivery address |
| Update Order Status | Move orders through the fulfillment pipeline |

**Order Status Flow:**
```
PLACED â†’ PAYMENT_PENDING â†’ CONFIRMED â†’ PACKED â†’ SHIPPED â†’ OUT_FOR_DELIVERY â†’ DELIVERED
                          â†“
                     CANCELLED (payment failure or timeout)
```

#### 3d. Payment Management (Admin)
| Feature | Description |
|---|---|
| View All Payments | Complete payment transaction list |
| View Payment Details | Per-transaction details including Razorpay IDs, status, and method |
| Payment Status Tracking | Track CREATED â†’ SUCCESS / FAILED â†’ REFUNDED |

#### 3e. Invoice Management (Admin)
| Feature | Description |
|---|---|
| View Invoices | List of all order invoices |
| Invoice Details | Order-linked invoice breakdown for accounting and records |

---

### ðŸ›ï¸ 4. Customer (User) â€” Storefront

> Accessible to authenticated customers

#### 4a. Storefront Home
| Feature | Description |
|---|---|
| Homepage Banners | Display active main banners |
| Home Sliders | Display promotional image sliders |
| Product Browsing | Browse all active products on the homepage |
| Category Filter | Filter products by category |
| Product Search | Search products by name |
| Product Detail Page | Full product page with images, price, description, and add-to-cart |

#### 4b. Shopping Cart
| Feature | Description |
|---|---|
| Add to Cart | Add products with selected quantity |
| Update Quantity | Increase or decrease item quantity in cart |
| Remove Item | Delete individual items from the cart |
| View Cart | See all cart items with unit prices and subtotals |
| Checkout Summary | View subtotal, delivery fee, and total before placing order |

#### 4c. Address Management
| Feature | Description |
|---|---|
| Add Address | Save multiple delivery addresses |
| Update Address | Edit existing saved addresses |
| Delete Address | Remove a saved address |
| Address Types | Label addresses as Home, Office, etc. |
| Default Address | Mark a preferred address for checkout |

#### 4d. Order Placement & Tracking
| Feature | Description |
|---|---|
| Place Order | Checkout cart with selected delivery address |
| View My Orders | Paginated list of personal orders |
| Order Status Tracking | Track order through each fulfillment stage with a visual timeline |
| Order Details | Full order breakdown with items, pricing, delivery info |

#### 4e. Payment (Razorpay)
| Feature | Description |
|---|---|
| Online Payment | Pay using Cards, UPI, Net Banking, or Wallets via Razorpay |
| Payment Confirmation | Instant payment verification feedback after transaction |
| Payment Failure Handling | Clear error indication with option to retry |

#### 4f. Account Management
| Feature | Description |
|---|---|
| View Profile | See account details |
| Update Profile | Edit name and contact information |
| Manage Addresses | Add, update, delete delivery addresses from account page |

---

### ðŸ  5. Public / Landing Pages

> Accessible to everyone (no login required)

| Feature | Description |
|---|---|
| Landing Page | Public marketing homepage for the store (Villpo Store) |
| Shop / Browse Page | Public product browsing and search without login |
| Product Detail Page | Public product detail view |
| Login Page | Shared login page for all roles |

---

### ðŸ’³ 6. Payment System (Razorpay Integration)

| Feature | Description |
|---|---|
| Create Razorpay Order | Backend creates payment session linked to store order |
| Online Payment Checkout | Razorpay standard checkout (Cards, UPI, Net Banking, Wallets) |
| Frontend Verification | Instant signature-based verification for UX feedback |
| Webhook Handling | Razorpay webhooks as the authoritative payment confirmation |
| Auto-Cancel Expired Orders | Orders unpaid after 30 minutes are auto-cancelled; inventory released |
| Idempotency Protection | Prevents duplicate payment processing |
| Amount Validation | Order amount cross-verified against payment amount |
| Refund Support | Refund tracking via Razorpay refund webhooks |

**Payment Status Flow:**
```
CREATED â†’ SUCCESS / FAILED
SUCCESS â†’ REFUNDED (if refund initiated)
```

---

### ðŸ“§ 7. Email Notification System

| Feature | Description |
|---|---|
| Registration OTP Email | OTP sent on new account registration |
| Password Reset OTP Email | OTP sent on forgot password request |
| Email Templates | Database-managed, configurable email templates |
| Order Confirmation Email | Notification sent to customer after successful payment |

---

### ðŸ”’ 8. Security

| Feature | Description |
|---|---|
| JWT Authentication | Stateless token-based auth with Access + Refresh token pattern |
| Role-Based Access Control | SUPER_ADMIN, ADMIN, and USER roles with separated routes and permissions |
| Token Revocation | Refresh tokens revoked on logout |
| OTP Expiry | OTPs expire after 10 minutes |
| CORS Configuration | Controlled cross-origin access for frontend |
| Request Logging | All API requests logged for audit and debugging |
| Global Exception Handling | Consistent, structured error responses across all APIs |
| Signature Verification | Razorpay payment and webhook signatures verified server-side |

---

## ðŸ“Š Feature Access Matrix

| Feature | Super Admin | Admin | Customer |
|---|---|---|---|
| Login / Auth | âœ… | âœ… | âœ… |
| Admin Dashboard | âŒ | âœ… | âŒ |
| Category Management | ✅ Full Control | ❌ | View Only |
| Product Management | âŒ | âœ… Full Control | View Only |
| Banners & Sliders | âœ… Full Control | âŒ | View Only |
| Customer Management | âœ… Full Control | âŒ | Own Profile |
| Address Management | âŒ | âŒ | âœ… |
| Shopping Cart | âŒ | âŒ | âœ… |
| Order Management | âŒ | âœ… Full Control | Own Orders |
| Payment Management | âŒ | âœ… View | Own Payments |
| Invoice Management | âŒ | âœ… | âŒ |
| Email Notifications | âœ… Receives | âœ… Receives | âœ… Receives |
| File Upload | âŒ | âœ… | âŒ |
| Public Storefront | âœ… | âœ… | âœ… |

---

## ðŸš€ Deployment

| Item | Detail |
|---|---|
| Server | Linux VPS |
| Storage | Local file storage on VPS |
| Database | PostgreSQL |
| Cache | Redis |
| Backend Port | 8090 |
| Frontend URL | http://localhost:3000 (dev) |

---

*This document is prepared for client review and feedback.*



