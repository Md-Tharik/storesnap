-- Stores the Shiprocket-registered pickup location name for each seller.
-- Set by the register-pickup-location edge function when the seller saves their pickup address.
-- Used as the `pickup_location` field in Shiprocket order creation.
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS shiprocket_location_id TEXT;
