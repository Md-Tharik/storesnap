-- Pickup address columns for Shiprocket label generation.
-- All columns already exist in schema.sql; ADD COLUMN IF NOT EXISTS is a safe no-op.
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS pickup_name    TEXT,
  ADD COLUMN IF NOT EXISTS pickup_address TEXT,
  ADD COLUMN IF NOT EXISTS pickup_city    TEXT,
  ADD COLUMN IF NOT EXISTS pickup_state   TEXT,
  ADD COLUMN IF NOT EXISTS pickup_pincode TEXT,
  ADD COLUMN IF NOT EXISTS pickup_phone   TEXT;
