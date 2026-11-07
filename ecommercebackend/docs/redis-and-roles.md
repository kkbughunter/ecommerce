# Redis catalog caching and management access

## Access

- **ADMIN** lands at `/admin/orders`: view all orders, customer/shipping details, and update fulfillment status. Cannot manage products/categories, open reports/invoices/payment histories, override payment status, or process refunds.
- **SUPER_ADMIN** lands at `/superadmin`: catalog creation/editing/media, categories, banners, customers, dashboard/reports, invoices, payment histories, gateway toggles, and order management. Financial controls are shown only to this role.
- Customers retain public browsing and their own cart, order and payment access.

The frontend route guards and navigation enforce the same policy as backend HTTP and service authorization. Existing `/api/admin/...` API names remain supported. Old frontend catalog/report/payment routes redirect to `/superadmin/...` only after checking the super-admin role.

## Redis setup

Redis is optional and disabled by default, so a checkout deployment does not require a running Redis server. Configure the backend `.env` and restart:

```dotenv
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_DATABASE=0
REDIS_SSL_ENABLED=false
REDIS_CATALOG_TTL=60s
REDIS_CACHE_PREFIX=ecommerce:catalog:v1:
REDIS_CONNECT_TIMEOUT=500ms
REDIS_TIMEOUT=500ms
```

Use the hostname, credentials and TLS settings of your Redis instance. Use a distinct prefix for each environment/store. No Redis credentials belong in the frontend `.env`. Redis itself must be installed/provisioned separately.

Cached public responses: active product lists/searches, product details, active products by category, active categories with products, and category lists. Page, page size, category and normalized search all participate in the cache key. DTOs are JSON, including date/time values; JPA entities and executable type metadata are not serialized.

Orders, payments, reports, dashboards, login data, and customer-specific reviews are **not cached**. Checkout stock/price checks always use PostgreSQL. Catalog entries have a default 60-second TTL. Product, category, review, upload and order entity changes invalidate catalog generations after the database transaction commits, including asynchronous image updates and stock changes. Rollbacks do not invalidate. Concurrent reads cannot repopulate the current generation with data fetched before invalidation.

Redis errors fall back to normal database reads and temporarily suppress Redis calls for five seconds. A failed invalidation is retried before this instance reads cached data again. In a Redis/network outage, another instance may see entries until their TTL expires; the cache never determines stock availability or payment success.

Validation includes unit tests for cache hits/key separation, TTL, outage fallback, disabling, commit/rollback invalidation, and backend role restrictions. Production rollout still requires a reachable Redis instance and a live cache smoke test.

Implementation reference: [Spring Data Redis StringRedisTemplate](https://docs.spring.io/spring-data/redis/reference/redis/template.html).
