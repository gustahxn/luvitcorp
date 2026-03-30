-- ==============================================================================
-- Migration: Adicionar campos de entrega na tabela Orders
-- Executar no SQL Editor do Supabase (lnqtuvtujcexvkmkpbhf)
-- ==============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_address TEXT,
  ADD COLUMN IF NOT EXISTS customer_city TEXT,
  ADD COLUMN IF NOT EXISTS customer_note TEXT;
