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

# 1. Design principles (quick)

* Single vendor / single admin (admin account seeded).
* Customers **do not self-register** — admin creates customer accounts (flag `created_by_admin` = true).
* Strong transactional guarantees for checkout (use DB transactions + `SELECT ... FOR UPDATE`).
* Search handled by **Elasticsearch** (sync from `products` via async job).
* Carts can be persisted in DB and cached in Redis for performance.
* All IDs = `UUID` (v4) except internal audit sequence if desired.
* Timestamps in UTC, use `timestamptz`.
* Monetary columns use `numeric(12,2)`; store currency code separately.
* Sensitive data (passwords) hashed with BCrypt.

---

# 2. Table definitions (each table shown in a Markdown table)

### `admins`

| Column          |           Type |   Null   |             Default | Notes / Constraints |
| --------------- | -------------: | :------: | ------------------: | ------------------- |
| `admin_id`      |         `uuid` | NOT NULL | `gen_random_uuid()` | PK                  |
| `username`      |  `varchar(64)` | NOT NULL |                     | unique index        |
| `email`         | `varchar(255)` | NOT NULL |                     | unique              |
| `password_hash` | `varchar(255)` | NOT NULL |                     | BCrypt              |
| `full_name`     | `varchar(128)` |   NULL   |                     |                     |
| `created_at`    |  `timestamptz` | NOT NULL |             `now()` |                     |
| `updated_at`    |  `timestamptz` | NOT NULL |             `now()` | update trigger      |
| `last_login_at` |  `timestamptz` |   NULL   |                     |                     |

---

### `customers`

| Column             |           Type |   Null   |             Default | Notes / Constraints                                                               |
| ------------------ | -------------: | :------: | ------------------: | --------------------------------------------------------------------------------- |
| `customer_id`      |         `uuid` | NOT NULL | `gen_random_uuid()` | PK                                                                                |
| `email`            | `varchar(255)` | NOT NULL |                     | unique                                                                            |
| `phone`            |  `varchar(32)` |   NULL   |                     | unique (optional)                                                                 |
| `password_hash`    | `varchar(255)` |   NULL   |                     | nullable if using OTP; admin-created accounts must have password or OTP mechanism |
| `first_name`       |  `varchar(64)` |   NULL   |                     |                                                                                   |
| `last_name`        |  `varchar(64)` |   NULL   |                     |                                                                                   |
| `is_active`        |      `boolean` | NOT NULL |              `true` |                                                                                   |
| `created_by_admin` |      `boolean` | NOT NULL |              `true` | true for this project                                                             |
| `created_at`       |  `timestamptz` | NOT NULL |             `now()` |                                                                                   |
| `updated_at`       |  `timestamptz` | NOT NULL |             `now()` |                                                                                   |

---

### `categories`

| Column        |           Type |   Null   |             Default | Notes                                 |
| ------------- | -------------: | :------: | ------------------: | ------------------------------------- |
| `category_id` |         `uuid` | NOT NULL | `gen_random_uuid()` | PK                                    |
| `name`        | `varchar(128)` | NOT NULL |                     |                                       |
| `slug`        | `varchar(160)` | NOT NULL |                     | unique                                |
| `parent_id`   |         `uuid` |   NULL   |                     | FK → `categories(category_id)` (self) |
| `created_at`  |  `timestamptz` | NOT NULL |             `now()` |                                       |

---

### `products`

| Column              |            Type |   Null   |             Default | Notes                                |
| ------------------- | --------------: | :------: | ------------------: | ------------------------------------ |
| `product_id`        |          `uuid` | NOT NULL | `gen_random_uuid()` | PK                                   |
| `sku`               |   `varchar(64)` | NOT NULL |                     | unique                               |
| `name`              |  `varchar(255)` | NOT NULL |                     | indexed (for DB fallback)            |
| `slug`              |  `varchar(255)` | NOT NULL |                     | unique                               |
| `short_description` |  `varchar(512)` |   NULL   |                     |                                      |
| `description`       |          `text` |   NULL   |                     | richer content                       |
| `price`             | `numeric(12,2)` | NOT NULL |                0.00 | base price                           |
| `currency`          |    `varchar(3)` | NOT NULL |             `'INR'` | ISO currency code                    |
| `tax_percent`       |  `numeric(5,2)` | NOT NULL |                0.00 | tax rules                            |
| `is_active`         |       `boolean` | NOT NULL |              `true` |                                      |
| `default_image_id`  |          `uuid` |   NULL   |                     | FK → `product_images(image_id)`      |
| `meta`              |         `jsonb` |   NULL   |                     | attributes, size, color, extra flags |
| `created_at`        |   `timestamptz` | NOT NULL |             `now()` |                                      |
| `updated_at`        |   `timestamptz` | NOT NULL |             `now()` |                                      |

**Note:** heavy search fields (name, description, meta) are synced to Elasticsearch. Keep DB-only indexes minimal.

---

### `product_images`

| Column       |            Type |   Null   |             Default | Notes                       |
| ------------ | --------------: | :------: | ------------------: | --------------------------- |
| `image_id`   |          `uuid` | NOT NULL | `gen_random_uuid()` | PK                          |
| `product_id` |          `uuid` | NOT NULL |                     | FK → `products(product_id)` |
| `url`        | `varchar(1024)` | NOT NULL |                     | path on VPS or CDN URL      |
| `alt_text`   |  `varchar(255)` |   NULL   |                     | accessibility               |
| `position`   |           `int` | NOT NULL |                   0 | ordering                    |
| `created_at` |   `timestamptz` | NOT NULL |             `now()` |                             |

---

### `product_categories` (many-to-many)

| Column        |   Type |   Null   | Default | Notes       |
| ------------- | -----: | :------: | ------: | ----------- |
| `product_id`  | `uuid` | NOT NULL |         | FK, PK part |
| `category_id` | `uuid` | NOT NULL |         | FK, PK part |

Primary key = `(product_id, category_id)`.

---

### `inventory` (single row per product)

| Column              |          Type |   Null   | Default | Notes                            |
| ------------------- | ------------: | :------: | ------: | -------------------------------- |
| `product_id`        |        `uuid` | NOT NULL |         | PK & FK → `products(product_id)` |
| `available_qty`     |         `int` | NOT NULL |       0 | Qty available for sale           |
| `reserved_qty`      |         `int` | NOT NULL |       0 | Qty reserved by pending orders   |
| `safety_stock`      |         `int` | NOT NULL |       0 | threshold for low-stock alert    |
| `last_restocked_at` | `timestamptz` |   NULL   |         |                                  |
| `last_sold_at`      | `timestamptz` |   NULL   |         |                                  |
| `version`           |         `int` | NOT NULL |       1 | optimistic locking               |

**Concurrency:** use `SELECT ... FOR UPDATE` or optimistic locking on `version` when adjusting `available_qty`/`reserved_qty`.

---

### `carts`

| Column         |            Type |   Null   |             Default | Notes                                |
| -------------- | --------------: | :------: | ------------------: | ------------------------------------ |
| `cart_id`      |          `uuid` | NOT NULL | `gen_random_uuid()` | PK                                   |
| `customer_id`  |          `uuid` | NOT NULL |                     | FK → `customers(customer_id)`        |
| `status`       |   `varchar(20)` | NOT NULL |          `'ACTIVE'` | enum: `ACTIVE`, `EXPIRED`, `ORDERED` |
| `total_amount` | `numeric(12,2)` | NOT NULL |                0.00 | denormalized for quick reads         |
| `currency`     |    `varchar(3)` | NOT NULL |             `'INR'` |                                      |
| `created_at`   |   `timestamptz` | NOT NULL |             `now()` |                                      |
| `updated_at`   |   `timestamptz` | NOT NULL |             `now()` |                                      |

---

### `cart_items`

| Column         |            Type |   Null   |             Default | Notes                       |
| -------------- | --------------: | :------: | ------------------: | --------------------------- |
| `cart_item_id` |          `uuid` | NOT NULL | `gen_random_uuid()` | PK                          |
| `cart_id`      |          `uuid` | NOT NULL |                     | FK → `carts(cart_id)`       |
| `product_id`   |          `uuid` | NOT NULL |                     | FK → `products(product_id)` |
| `quantity`     |           `int` | NOT NULL |                   1 |                             |
| `unit_price`   | `numeric(12,2)` | NOT NULL |                0.00 | snapshot of product price   |
| `created_at`   |   `timestamptz` | NOT NULL |             `now()` |                             |

---

### `orders`

| Column             |            Type |   Null   |             Default | Notes                                                                              |
| ------------------ | --------------: | :------: | ------------------: | ---------------------------------------------------------------------------------- |
| `order_id`         |          `uuid` | NOT NULL | `gen_random_uuid()` | PK                                                                                 |
| `order_number`     |   `varchar(32)` | NOT NULL |                     | unique (human-friendly, e.g., `ORD-20260225-0001`)                                 |
| `customer_id`      |          `uuid` |   NULL   |                     | FK → `customers(customer_id)`. NULL allowed if supporting guest orders (optional)  |
| `status`           |   `varchar(20)` | NOT NULL |         `'PENDING'` | enum: `PENDING`, `PAID`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` |
| `payment_status`   |   `varchar(16)` | NOT NULL |          `'UNPAID'` | `UNPAID`, `PAID`, `FAILED`, `REFUNDED`                                             |
| `subtotal_amount`  | `numeric(12,2)` | NOT NULL |                0.00 | sum of items                                                                       |
| `tax_amount`       | `numeric(12,2)` | NOT NULL |                0.00 |                                                                                    |
| `shipping_amount`  | `numeric(12,2)` | NOT NULL |                0.00 |                                                                                    |
| `total_amount`     | `numeric(12,2)` | NOT NULL |                0.00 | subtotal+tax+shipping-discounts                                                    |
| `currency`         |    `varchar(3)` | NOT NULL |             `'INR'` |                                                                                    |
| `shipping_address` |         `jsonb` |   NULL   |                     | denormalized address snapshot                                                      |
| `billing_address`  |         `jsonb` |   NULL   |                     |                                                                                    |
| `created_at`       |   `timestamptz` | NOT NULL |             `now()` |                                                                                    |
| `updated_at`       |   `timestamptz` | NOT NULL |             `now()` |                                                                                    |

---

### `order_items`

| Column          |            Type |   Null   |             Default | Notes                       |
| --------------- | --------------: | :------: | ------------------: | --------------------------- |
| `order_item_id` |          `uuid` | NOT NULL | `gen_random_uuid()` | PK                          |
| `order_id`      |          `uuid` | NOT NULL |                     | FK → `orders(order_id)`     |
| `product_id`    |          `uuid` | NOT NULL |                     | FK → `products(product_id)` |
| `sku`           |   `varchar(64)` | NOT NULL |                     | snapshot                    |
| `product_name`  |  `varchar(255)` | NOT NULL |                     | snapshot                    |
| `quantity`      |           `int` | NOT NULL |                   1 |                             |
| `unit_price`    | `numeric(12,2)` | NOT NULL |                0.00 | snapshot                    |
| `tax_amount`    | `numeric(12,2)` | NOT NULL |                0.00 |                             |
| `total_price`   | `numeric(12,2)` | NOT NULL |                0.00 | (unit_price * qty) + tax    |

---

### `payments`

| Column                |            Type |   Null   |             Default | Notes                                        |
| --------------------- | --------------: | :------: | ------------------: | -------------------------------------------- |
| `payment_id`          |          `uuid` | NOT NULL | `gen_random_uuid()` | PK                                           |
| `order_id`            |          `uuid` | NOT NULL |                     | FK → `orders(order_id)`                      |
| `provider`            |   `varchar(64)` | NOT NULL |        `'razorpay'` |                                              |
| `provider_payment_id` |  `varchar(128)` |   NULL   |                     | provider's payment id                        |
| `amount`              | `numeric(12,2)` | NOT NULL |                0.00 |                                              |
| `currency`            |    `varchar(3)` | NOT NULL |             `'INR'` |                                              |
| `status`              |   `varchar(32)` | NOT NULL |       `'INITIATED'` | `INITIATED`, `SUCCESS`, `FAILED`, `REFUNDED` |
| `method`              |   `varchar(32)` |   NULL   |                     | card, upi, netbanking                        |
| `metadata`            |         `jsonb` |   NULL   |                     | raw provider response, fraud flags           |
| `created_at`          |   `timestamptz` | NOT NULL |             `now()` |                                              |

---

### `shipping_details`

| Column                    |           Type |   Null   |             Default | Notes                                                        |
| ------------------------- | -------------: | :------: | ------------------: | ------------------------------------------------------------ |
| `shipping_id`             |         `uuid` | NOT NULL | `gen_random_uuid()` | PK                                                           |
| `order_id`                |         `uuid` | NOT NULL |                     | FK → `orders(order_id)`                                      |
| `courier_name`            | `varchar(128)` |   NULL   |                     |                                                              |
| `tracking_number`         | `varchar(128)` |   NULL   |                     |                                                              |
| `status`                  |  `varchar(32)` | NOT NULL |     `'NOT_SHIPPED'` | `NOT_SHIPPED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED` |
| `shipped_at`              |  `timestamptz` |   NULL   |                     |                                                              |
| `delivered_at`            |  `timestamptz` |   NULL   |                     |                                                              |
| `estimated_delivery_date` |         `date` |   NULL   |                     |                                                              |

---

### `coupons`

| Column            |            Type |   Null   |             Default | Notes                          |
| ----------------- | --------------: | :------: | ------------------: | ------------------------------ |
| `coupon_id`       |          `uuid` | NOT NULL | `gen_random_uuid()` | PK                             |
| `code`            |   `varchar(64)` | NOT NULL |                     | unique, uppercase              |
| `discount_type`   |   `varchar(16)` | NOT NULL |                     | `PERCENTAGE` or `FLAT`         |
| `discount_value`  | `numeric(12,2)` | NOT NULL |                0.00 | percent (0-100) or flat amount |
| `max_uses`        |           `int` |   NULL   |                NULL | null = unlimited               |
| `used_count`      |           `int` | NOT NULL |                   0 | increment on apply             |
| `valid_from`      |   `timestamptz` |   NULL   |                     |                                |
| `valid_to`        |   `timestamptz` |   NULL   |                     |                                |
| `min_order_value` | `numeric(12,2)` |   NULL   |                0.00 |                                |
| `active`          |       `boolean` | NOT NULL |              `true` |                                |

---

### `email_templates`

| Column         |           Type |   Null   |             Default | Notes                          |
| -------------- | -------------: | :------: | ------------------: | ------------------------------ |
| `template_id`  |         `uuid` | NOT NULL | `gen_random_uuid()` | PK                             |
| `name`         | `varchar(128)` | NOT NULL |                     | e.g., `order_confirmation`     |
| `subject`      | `varchar(255)` | NOT NULL |                     | supports placeholders          |
| `body`         |         `text` | NOT NULL |                     | HTML or text with placeholders |
| `placeholders` |        `jsonb` |   NULL   |                     | list of allowed keys           |
| `active`       |      `boolean` | NOT NULL |              `true` |                                |

---

### `audit_logs`

| Column        |           Type |   Null   |             Default | Notes                         |
| ------------- | -------------: | :------: | ------------------: | ----------------------------- |
| `log_id`      |         `uuid` | NOT NULL | `gen_random_uuid()` | PK                            |
| `actor_id`    |         `uuid` |   NULL   |                     | admin/customer/system         |
| `actor_type`  |  `varchar(16)` | NOT NULL |          `'SYSTEM'` | `ADMIN`, `CUSTOMER`, `SYSTEM` |
| `action`      | `varchar(128)` | NOT NULL |                     | e.g., `CREATE_ORDER`          |
| `entity_type` |  `varchar(64)` |   NULL   |                     | `orders`, `products`          |
| `entity_id`   |         `uuid` |   NULL   |                     | reference id                  |
| `payload`     |        `jsonb` |   NULL   |                     | diff or context               |
| `created_at`  |  `timestamptz` | NOT NULL |             `now()` |                               |

---

# 3. Relationships (summary)

* `admins` manage everything (no FK required).
* `customers` ← `orders` (1:N)
* `orders` ← `order_items` (1:N)
* `orders` ← `payments` (1:N)
* `orders` ← `shipping_details` (1:1)
* `products` ← `product_images` (1:N)
* `products` ↔ `categories` via `product_categories` (M:N)
* `products` ← `inventory` (1:1)
* `customers` ← `carts` ← `cart_items` (1:N,N:1)

---

# 4. Indexing & performance recommendations

* Primary keys use `UUID` with `pgcrypto`/`gen_random_uuid()`.
* Indexes:

  * `products (sku)` UNIQUE.
  * `products (name)` btree index for admin lookups.
  * `orders (order_number)` UNIQUE.
  * `orders (customer_id, created_at)` for order history queries.
  * `inventory (available_qty)` partial index for `available_qty < safety_stock`.
  * `customers (email)` UNIQUE.
* Use **Elasticsearch** for product search (name, description, meta). Sync via async worker on product change.
* Cache hot reads (product pages, category lists) in Redis / CDN.

---

# 5. Transactional flows & concurrency (developer guidance)

## Checkout (strong consistency)

1. Begin DB transaction.
2. Lock inventory rows for each product: `SELECT available_qty, reserved_qty, version FROM inventory WHERE product_id = $1 FOR UPDATE`.
3. Validate `available_qty - reserved_qty >= desired_qty` for all items.
4. Increase `reserved_qty` and increment `version`.
5. Create `orders` row and `order_items` rows (snapshots of price, sku).
6. Commit transaction.
7. Create payment order with Razorpay (external). Return payment details to frontend.
8. On payment webhook success: update `payments` and `orders.payment_status` → `PAID`, then in a new transaction:

   * Decrease `available_qty` by `quantity`, decrease `reserved_qty`, update `version`.
   * Update `orders.status` → `PAID`.
9. On payment failure/cancel: release `reserved_qty`.

**Important:** Step 2 must use DB row locks (FOR UPDATE) to avoid overselling.

## Inventory restock (admin)

* Update `available_qty` with a transaction, log changes in `audit_logs`, optionally push low-stock alerts.

---

# 6. Webhooks & external integrations

* **Razorpay webhook**: verify signature on `X-Razorpay-Signature` using configured secret. Persist raw payload to `payments.metadata` for audit. Process in idempotent manner (use `provider_payment_id`).
* **Courier webhook** (optional): accept status updates and update `shipping_details.status` and push notification to customer.

---

# 7. Sample API → DB mapping (essential endpoints)

| Endpoint                             | Method | Purpose                          | DB tables affected                                                   |
| ------------------------------------ | -----: | -------------------------------- | -------------------------------------------------------------------- |
| `POST /api/admin/login`              |   POST | Admin login (returns JWT)        | `admins` (validate)                                                  |
| `POST /api/admin/customers`          |   POST | Create customer                  | `customers`                                                          |
| `POST /api/products`                 |   POST | Create product                   | `products`, `product_images`, `product_categories`, `inventory`      |
| `GET /api/products/:slug`            |    GET | Product detail                   | `products`, `product_images`, `inventory` (read), ES search fallback |
| `POST /api/cart/:customerId`         |   POST | Add item                         | `carts`, `cart_items`                                                |
| `POST /api/checkout`                 |   POST | Create order + Razorpay creation | `orders`, `order_items`, `inventory` (reserve)                       |
| `POST /api/webhook/razorpay`         |   POST | Payment callback                 | `payments`, `orders`, `inventory` (finalize)                         |
| `GET /api/orders/:orderNumber`       |    GET | Order status by customer         | `orders`, `order_items`, `shipping_details`                          |
| `POST /api/admin/products/:id/stock` |   POST | Restock                          | `inventory`, `audit_logs`                                            |

---

# 8. Constraints, validations & business rules

* `price >= 0`, `quantity >= 0`.
* `coupon.used_count` increments in a transactional way when applied during checkout. Fail order if `used_count >= max_uses`.
* `order_number` generated atomically (sequence or with unique constraint + retry).
* `product.sku` unique and immutable after creation unless admin explicitly allows changes.
* Payment status must be authoritative from provider; do not mark `PAID` on client confirmation alone.

---

# 9. Backup, retention & archival

* Nightly DB backups (pg_dump or snapshot).
* Archive `orders` older than X years into `orders_archive` partition (if table grows huge).
* `audit_logs` retention policy: retain last 2 years online, older archived to cold storage.

---

# 10. Sample seed (admin) SQL (example)

```sql
-- use bcrypt-generated hash in real seed; placeholder below
INSERT INTO admins (admin_id, username, email, password_hash, full_name, created_at)
VALUES (gen_random_uuid(), 'admin', 'admin@yourstore.com', '$2y$12$<bcrypt-hash>', 'Store Admin', now());
```

---

# 11. Helpful implementation notes for AI devs

* **Model classes**: create one entity per table, add DTOs for API boundaries. Keep domain invariants in services (e.g., `OrderService.createOrder()` performs reservation logic).
* **Repositories**: use Spring Data JPA for core CRUD; write custom JPQL/native queries for complex lookups & inventory locking.
* **Unit tests**: critical flows: checkout happy path, payment webhook idempotency, oversell prevention under concurrency (simulate parallel requests).
* **Integration tests**: simulate Razorpay webhook with test signature.
* **Async workers**: product → Elasticsearch sync, send order emails, update analytics. Use a reliable queue (RabbitMQ/Kafka) or Spring `@Async` with retry.
* **Secrets**: store Razorpay keys and DB creds in environment variables / Vault. Don’t store in repo.
* **Logging**: structured logs (json), include `request_id` and `actor_id`. Use `audit_logs` for critical state changes (order created, payment confirmed, stock changed).
* **Rate limiting**: on public endpoints like product search; admin endpoints protected by role & stricter rate limits.

---