# Admin access and Redis implementation plan

**Goal:** Continue the Cashfree/Razorpay update, restrict ordinary admins to order fulfillment, move catalog and financial tools to super admins, and cache public catalog reads in Redis.

**Architecture:** Keep existing API URLs, enforce role checks in both HTTP security and service/method authorization, and move frontend management routes under `/superadmin`. Use a typed JSON Redis catalog cache with a short TTL, database fallback, and transaction-commit invalidation for catalog/stock/review/media changes. Cache no customer-specific, order, or payment data.

**Tech stack:** Java 21, Spring Boot 4, Spring Data Redis, PostgreSQL, React/Vite.

The user requested direct implementation and explicitly selected public catalog caching only.

## Tasks

- [x] Add role tests proving admins cannot create products, read financial tools, or alter payment status; super admins retain those capabilities and both roles can view/update orders.
- [x] Update SecurityConfig, controller/service guards, login landing paths, frontend routes/navigation, and conditional order controls. Preserve customer checkout and ownership checks.
- [x] Add tests for cache hits, parameter separation, outages, and after-commit invalidation versus rollback.
- [x] Add Redis dependency/config, typed catalog query facade, cache lifecycle listener, and backend environment placeholders. Invalidate on product/category/review/upload/order changes including async updates.
- [x] Run the full backend suite, frontend build, targeted lint, and diff checks. Document Redis setup and payment migration/merchant configuration requirements.

## Review focus

Test both order-admin URL aliases, prevent payment status tampering in fulfillment requests, keep customer-owned payments accessible, prevent uncommitted cached data, and ensure Redis outages do not break catalog reads.

## Validation record

Full backend suite and frontend production build pass. Targeted ESLint has no errors; three existing warnings remain in dashboard/invoice/payment views. Cache tests cover typed timestamps, stale-fill isolation, transaction rollback, and database fallback; no live Redis or merchant charge was attempted. Existing PostgreSQL payment migration and environment setup are documented in `ecommercebackend/docs/`.
