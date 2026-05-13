-- Add FCM push token column to sellers.
-- Stores the latest device token for the seller's logged-in app session.
-- Updated by the Flutter app after sign-in and cleared on sign-out.
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS fcm_token TEXT;
