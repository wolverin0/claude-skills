-- MercadoPago Integration - Database Migration
-- Run in Supabase SQL Editor
-- Adjust table name (tenants) as needed

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS mercadopago_access_token TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_user_id TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_public_key TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_connected_at TIMESTAMPTZ;

-- Optional: Index for lookups by MP user ID
CREATE INDEX IF NOT EXISTS idx_tenants_mercadopago_user_id
ON public.tenants(mercadopago_user_id)
WHERE mercadopago_user_id IS NOT NULL;

-- Verify columns added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tenants'
AND column_name LIKE 'mercadopago%';
