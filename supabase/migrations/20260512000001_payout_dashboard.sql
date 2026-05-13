-- Add payout_status text column to orders (replaces is_payout_completed boolean).
-- Backfill completed rows so the admin dashboard only shows genuinely pending payouts.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payout_status TEXT NOT NULL DEFAULT 'pending';

UPDATE public.orders
  SET payout_status = 'paid'
  WHERE is_payout_completed = true AND payout_status = 'pending';

-- Bank & admin columns on sellers (safe to re-run; admin-ledger already references them).
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS bank_account_name   TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_ifsc           TEXT,
  ADD COLUMN IF NOT EXISTS wallet_balance      NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_admin            BOOLEAN NOT NULL DEFAULT false;
