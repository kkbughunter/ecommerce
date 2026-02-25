-- Suitable schema for single-vendor ecommerce order management + tracking
-- PostgreSQL

CREATE TABLE IF NOT EXISTS public.orders (
    order_id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(40) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    status VARCHAR(40) NOT NULL,
    payment_status VARCHAR(30) NOT NULL,
    subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    shipping_address TEXT NULL,
    billing_address TEXT NULL,
    contact_phone VARCHAR(30) NULL,
    created_by BIGINT NULL,
    created_dt TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_by BIGINT NULL,
    modified_dt TIMESTAMP NULL,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

CREATE TABLE IF NOT EXISTS public.order_items (
    order_item_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    line_total DECIMAL(12,2) NOT NULL,
    created_dt TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES public.products(product_id)
);

CREATE TABLE IF NOT EXISTS public.order_tracking_events (
    tracking_event_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    status VARCHAR(40) NOT NULL,
    location VARCHAR(150) NULL,
    note TEXT NULL,
    event_time TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by BIGINT NULL,
    CONSTRAINT fk_tracking_order FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_created_dt ON public.orders(user_id, created_dt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_order_time ON public.order_tracking_events(order_id, event_time);
