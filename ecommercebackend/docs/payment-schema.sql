-- Razorpay payment transaction and status tracking schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    payment_transaction_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    gateway VARCHAR(20) NOT NULL,
    gateway_order_id VARCHAR(80) NOT NULL UNIQUE,
    gateway_payment_id VARCHAR(80) NULL,
    gateway_signature VARCHAR(255) NULL,
    status VARCHAR(30) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    receipt VARCHAR(80) NOT NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    method VARCHAR(40) NULL,
    error_code VARCHAR(100) NULL,
    error_description TEXT NULL,
    gateway_payload TEXT NULL,
    created_by BIGINT NULL,
    created_dt TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_by BIGINT NULL,
    modified_dt TIMESTAMP NULL,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.payment_status_tracking (
    payment_status_tracking_id BIGSERIAL PRIMARY KEY,
    payment_transaction_id BIGINT NOT NULL,
    previous_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NOT NULL,
    event_source VARCHAR(20) NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    provider_event_id VARCHAR(120) NULL,
    note TEXT NULL,
    payload TEXT NULL,
    event_time TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by BIGINT NULL,
    CONSTRAINT fk_payment_tracking_transaction FOREIGN KEY (payment_transaction_id)
        REFERENCES public.payment_transactions(payment_transaction_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_order_created ON public.payment_transactions(order_id, created_dt DESC);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_order ON public.payment_transactions(gateway, gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_payment ON public.payment_transactions(gateway, gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_tracking_payment_time
    ON public.payment_status_tracking(payment_transaction_id, event_time);
