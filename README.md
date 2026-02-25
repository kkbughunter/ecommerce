
# 🛒 Single Vendor E-Commerce Platform

**End-to-End Online Store Management System**

## 📌 Project Overview

This project is a **Single-Vendor E-Commerce Platform** designed to manage a complete online store with one administrator and multiple customer users.

The system enables the admin to manage products, stock, pricing, and orders, while customers can browse products, place orders, make online payments, and track their purchases.

Unlike multi-vendor marketplaces such as Amazon, this platform is built for a **single business owner** managing one store.

It is developed using a modern full-stack architecture with scalable and secure backend services.

---

# 🎯 Objectives

* Provide a complete online shopping system
* Allow admin to manage products and inventory
* Enable secure online payments using Razorpay
* Offer real-time order tracking for customers
* Ensure secure authentication and authorization
* Deploy on a Linux VPS for production use

---

# 🏗 System Architecture

```text
Frontend (React + Next.js)
        ↓
REST API (Spring Boot)
        ↓
PostgreSQL Database
        ↓
Redis Cache
        ↓
Elasticsearch (Product Search)
        ↓
Razorpay Payment Gateway
```

---

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

## 🔹 Deployment

* Linux VPS server
* Storage on same VPS

---

# 👥 User Roles

## 🔹 Admin

* Secure login
* Add / Update / Delete products
* Manage stock inventory
* View and update order status
* Monitor revenue and sales
* Manage product categories
* Handle shipping & tracking updates

## 🔹 Customers

* Login (No open registration system)
* Browse products
* Add to cart
* Checkout & pay online
* Track order status
* View order history

---

# 📦 Core Modules

### 1️⃣ Authentication Module

* JWT-based login
* Role-based access control
* Admin & Customer roles

### 2️⃣ Product Management

* Product CRUD operations
* Category management
* Image upload (stored on VPS)
* Stock tracking

### 3️⃣ Cart System

* Add / Remove items
* Update quantity
* Price calculation
* Redis-based cart optimization (optional)

### 4️⃣ Order Management

* Order creation
* Payment verification
* Order status lifecycle:

  * PENDING
  * PAID
  * SHIPPED
  * DELIVERED
  * CANCELLED

### 5️⃣ Payment Integration

* Razorpay order creation
* Payment success webhook
* Automatic order status update
* Secure signature validation

### 6️⃣ Order Tracking

* Real-time order progress
* Tracking number storage
* Shipping status updates

---

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

### Explanation

* **common** → Global exceptions & utility classes
* **config** → Application configurations
* **auth** → Login & JWT management
* **user** → Customer management
* **product** → Product CRUD
* **order** → Order lifecycle
* **payment** → Razorpay integration
* **inventory** → Stock management
* **emailtemplate** → Email formatting logic

---

# 🔐 Security Features

* JWT authentication
* Password encryption (BCrypt)
* Role-based authorization
* Payment signature verification
* CORS configuration
* Input validation
* Secure REST APIs

---

# 📈 Scalability & Future Enhancements

* Add CDN for image delivery
* Separate microservices architecture
* Add analytics dashboard
* Implement push notifications
* Introduce discount & coupon engine
* Add multi-language support

---

# 🏁 Conclusion

This project delivers a **complete single-vendor e-commerce solution** that manages:

✔ Product catalog
✔ Inventory
✔ Secure payments
✔ Order lifecycle
✔ Customer tracking
✔ Admin dashboard
✔ VPS deployment

It is designed to be **secure, scalable, and production-ready**, suitable for real-world business deployment.

---