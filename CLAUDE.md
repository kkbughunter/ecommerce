# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-vendor e-commerce platform with:
- **Backend**: Spring Boot 4.0.3 + Java 21, PostgreSQL, JWT auth, Razorpay payments
- **Frontend**: React 19 + Vite 7, Tailwind CSS v4, React Router v7, Axios (no Redux — state is local/hook-based)

---

## Commands

### Backend (`ecommercebackend/`)

```bash
# Run development server (requires .env file)
./gradlew bootRun

# Build JAR
./gradlew build

# Run tests
./gradlew test

# Run a single test class
./gradlew test --tests "com.astraval.ecommercebackend.EcommercebackendApplicationTests"
```

### Frontend (`ecommercefrontend/`)

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

---

## Environment Configuration

### Backend `.env` (in `ecommercebackend/`)

Required variables (loaded via `spring.config.import: optional:file:.env[.properties]`):

```
DB_URL=jdbc:postgresql://localhost:5432/ecommerce
DB_USERNAME=
DB_PASSWORD=
JWT_SECRET=                        # min 32 bytes
JWT_EXPIRATION=3600                # access token seconds
JWT_REFRESH_EXPIRATION=86400       # refresh token seconds
MAIL_HOST=
MAIL_USERNAME=
MAIL_PASSWORD=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
UPLOAD_PATH=uploads
FRONTEND_URL=http://localhost:5173
BOOTSTRAP_ADMIN_EMAIL=admin@yourstore.com
BOOTSTRAP_ADMIN_PASSWORD=Admin@123
```

Key optional flags:
- `JPA_DDL_AUTO` defaults to `update`; set to `create` to reinitialize schema
- `SQL_INIT_MODE` defaults to `never`; set to `always` to run `data.sql` on startup
- `SPRINGDOC_SWAGGER_UI_ENABLED=true` exposes Swagger at `/swagger-ui.html`

### Frontend `.env` (in `ecommercefrontend/`)

```
VITE_BASE_URL=http://localhost:8080
```

---

## Architecture

### Backend

Package root: `com.astraval.ecommercebackend`

**Module layout** (`modules/`):
- `auth/` — Login, registration, OTP flow, JWT issue/refresh/revoke. `AdminBootstrapService` seeds the default admin on startup.
- `user/` + `user/role/` — `User` entity, `Role`, `UserRoleMap` (join table), `RoleCode` enum (`ADMIN`, `USER`). `RoleBootstrapService` seeds roles.
- `customer/` — Customer profile linked 1-to-1 with `User`.
- `address/` — User shipping/billing addresses (`AddressType` enum).
- `product/` — Product CRUD with category management and image upload.
- `cart/` — Per-user cart (`Cart` → `CartItem`). Checkout computes totals and delivery fee by weight slab.
- `order/` — `Order` → `OrderItem`; status lifecycle: `PENDING → PAID → SHIPPED → DELIVERED / CANCELLED`. `OrderTrackingEvent` records each status change.
- `payment/` — Razorpay order creation and webhook/signature verification.
- `upload/` — File upload to local VPS path; serves static files via `WebConfig`.
- `emailtemplate/` — DB-stored email templates rendered and sent via `EmailUtil`.

**Cross-cutting** (`common/`):
- `ApiResponse<T>` + `ApiResponseFactory` — all endpoints return a unified response envelope.
- `GlobalExceptionHandler` — maps custom exceptions (`BadRequestException`, `ResourceNotFoundException`, `UnauthorizedException`, `ApplicationException`) to HTTP responses.
- `JwtUtil` — token generation/validation.
- `SecurityUtil` — gets the currently authenticated user from `SecurityContext`.

**Config** (`config/`):
- `JwtAuthenticationFilter` — reads `Authorization: Bearer` header, validates JWT, sets `SecurityContext`.
- `CorsConfig` — CORS policy (frontend URL is configurable).
- `WebConfig` — serves uploaded files as static resources.
- `OpenApiConfig` — Swagger/SpringDoc setup.
- `RequestLoggingFilter` + `LoggingInterceptor` — HTTP request/response logging.

Auth uses two roles parsed directly from JWT claims (`roles` field). Role checks use Spring Security's `@PreAuthorize` / `hasRole`.

### Frontend

**Directory structure** (`src/`):

```
core/
  api/          # Axios API modules (one file per domain: authApi, productApi, orderApi, etc.)
  auth/         # Session management (localStorage tokens), ProtectedRoute, PublicOnlyRoute
  config/       # env.js (VITE_BASE_URL), endpoints.js
  constants/    # Shared constants
  utils/        # apiError.js — extracts error messages from API responses
features/
  admin/        # Admin console: products, categories, orders, customers, banners, sliders
  auth/         # Login view + useLogin hook
  client/       # Customer-facing: cart, checkout, orders, profile
  landing/      # Public landing page
  product/      # Public product detail/listing views
  shop/         # Shop browse/search pages
layouts/        # Shared layout wrappers
shared/
  components/   # Reusable UI components
  utils/        # Utility helpers
```

**Routing**: `router.jsx` composes feature-level `routes.jsx` files via `createBrowserRouter`.

**Auth flow**: Tokens are stored in `localStorage` (`accessToken`, `refreshToken`, `authMeta`). `session.js` parses JWT claims client-side to determine role (`ADMIN` → `/admin`, `USER` → `/client`). `ProtectedRoute` / `PublicOnlyRoute` guard routes by role.

**API calls**: All go through `core/api/apiClient.js` (Axios instance). The request interceptor attaches `Authorization: Bearer <token>` automatically. Each domain has its own API file that calls this client.

---

## Key Conventions

- All REST responses use `ApiResponse<T>` wrapper: `{ status, message, data }`.
- Backend uses Lombok (`@Data`, `@Builder`, etc.) extensively — no manual getters/setters.
- DTOs live in a `dto/` sub-package within each module.
- Frontend feature folders follow the pattern: `views/` (page-level), `components/` (feature-specific UI), `hooks/` (data-fetching/business logic), `routes.jsx`.
- No global state library (Redux/Zustand) — state is managed in hooks and passed via props.
