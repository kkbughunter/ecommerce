-- Apply once to an existing PostgreSQL database before enabling Cashfree.
-- Fresh Hibernate-created schemas already allow both gateway enum values.
BEGIN;
CREATE TABLE IF NOT EXISTS payment_gateway_settings (
    gateway VARCHAR(20) PRIMARY KEY,
    enabled BOOLEAN NOT NULL
);
INSERT INTO payment_gateway_settings(gateway, enabled) VALUES ('RAZORPAY', true), ('CASHFREE', false)
ON CONFLICT (gateway) DO NOTHING;

ALTER TABLE payment_transactions ALTER COLUMN razorpay_order_id DROP NOT NULL;

-- Replace only single-column gateway/provider checks (including Hibernate's generated names).
DO $$
DECLARE constraint_row RECORD;
BEGIN
    FOR constraint_row IN
        SELECT c.conname FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE c.conrelid = 'payment_transactions'::regclass AND c.contype = 'c'
          AND cardinality(c.conkey) = 1 AND a.attname IN ('gateway', 'provider')
    LOOP
        EXECUTE format('ALTER TABLE payment_transactions DROP CONSTRAINT %I', constraint_row.conname);
    END LOOP;
END $$;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_gateway_check CHECK (gateway IN ('RAZORPAY', 'CASHFREE'));
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_provider_check CHECK (provider IN ('RAZORPAY', 'CASHFREE'));
COMMIT;
