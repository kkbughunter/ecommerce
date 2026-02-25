# Backend reference & DB design (for AI / devs)

Below is a focused, developer-friendly backend specification and **database design (PostgreSQL)** for your **single-vendor e-commerce** project. Use this as the canonical reference for implementing models, APIs, services, migrations and tests.

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
