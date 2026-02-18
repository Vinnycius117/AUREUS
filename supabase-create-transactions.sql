-- =============================================
-- AUREUS: Tabela de Transações (Lançamentos)
-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard
-- =============================================

-- 1. Remover tabela antiga se existir (Cuidado: isso apaga dados antigos desta tabela)
DROP TABLE IF EXISTS public.transactions CASCADE;

-- 2. Criar tabela transactions com nomes entre aspas para evitar conflitos
CREATE TABLE public.transactions (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "details" TEXT NOT NULL,
  "reference" TEXT,
  "account" TEXT NOT NULL DEFAULT 'Conta Principal',
  "date" TEXT NOT NULL,
  "timestamp" BIGINT NOT NULL,
  "amount" NUMERIC(12,2) NOT NULL,
  "icon" TEXT,
  "type" TEXT NOT NULL CHECK ("type" IN ('debit', 'credit')),
  "created_at" TIMESTAMPTZ DEFAULT now()
);

-- 3. Ativar Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acesso
CREATE POLICY "Users can read own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = "user_id");

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = "user_id");

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = "user_id");

-- 5. Índices para performance
CREATE INDEX idx_transactions_user_id ON public.transactions("user_id");
CREATE INDEX idx_transactions_timestamp ON public.transactions("timestamp" DESC);
