-- =========================================================================================
-- SCRIPT ÚNICO DE MIGRAÇÃO - AOFINANCE (SUPABASE / POSTGRESQL)
-- (Versão Idempotente - Pode ser executado várias vezes)
-- =========================================================================================

-- 1. EXTENSÕES E TIPOS (ENUMS)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('approved', 'pending', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_plan AS ENUM ('free', 'pro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('checking', 'savings', 'wallet', 'investment');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE goal_kind AS ENUM ('meta', 'reserva', 'objetivo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. FUNÇÃO BASE PARA UPDATED_AT
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CRIAÇÃO DAS TABELAS

-- 3.1. Perfis de Usuário (Estendendo auth.users do Supabase)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    photo_url TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    status user_status DEFAULT 'pending' NOT NULL,
    plan user_plan DEFAULT 'free' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE
);
DROP TRIGGER IF EXISTS set_timestamp_profiles ON profiles;
CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 3.2. Configurações de Usuário (1:1 com profiles)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    app_name VARCHAR(100) DEFAULT 'AOFINANCE',
    profile_name VARCHAR(255),
    profile_photo TEXT,
    monthly_salary DECIMAL(12, 2) DEFAULT 0,
    categories JSONB DEFAULT '[]'::jsonb,
    investment_types JSONB DEFAULT '[]'::jsonb,
    theme JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_timestamp_settings ON user_settings;
CREATE TRIGGER set_timestamp_settings BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 3.3. Contas (Bancos / Carteiras)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    type account_type DEFAULT 'checking',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
DROP TRIGGER IF EXISTS set_timestamp_accounts ON accounts;
CREATE TRIGGER set_timestamp_accounts BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 3.4. Transações (Receitas e Despesas)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    type transaction_type NOT NULL,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    group_id VARCHAR(100),
    tags JSONB DEFAULT '[]'::jsonb,
    attachment JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
DROP TRIGGER IF EXISTS set_timestamp_transactions ON transactions;
CREATE TRIGGER set_timestamp_transactions BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 3.5. Transferências (Entre Contas)
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    to_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_diff_accounts CHECK (from_account_id != to_account_id)
);
DROP TRIGGER IF EXISTS set_timestamp_transfers ON transfers;
CREATE TRIGGER set_timestamp_transfers BEFORE UPDATE ON transfers FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 3.6. Cartões de Crédito
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    limit_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
DROP TRIGGER IF EXISTS set_timestamp_cards ON credit_cards;
CREATE TRIGGER set_timestamp_cards BEFORE UPDATE ON credit_cards FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 3.7. Compras no Cartão
CREATE TABLE IF NOT EXISTS card_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    invoice_month VARCHAR(7) NOT NULL,
    paid BOOLEAN DEFAULT false NOT NULL,
    group_id VARCHAR(100),
    nickname VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
DROP TRIGGER IF EXISTS set_timestamp_card_purchases ON card_purchases;
CREATE TRIGGER set_timestamp_card_purchases BEFORE UPDATE ON card_purchases FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 3.8. Despesas Recorrentes (Assinaturas, Boletos Mensais)
CREATE TABLE IF NOT EXISTS recurring_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 31),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    category VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    last_gen_month VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
DROP TRIGGER IF EXISTS set_timestamp_bills ON recurring_bills;
CREATE TRIGGER set_timestamp_bills BEFORE UPDATE ON recurring_bills FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 3.9. Metas e Objetivos
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    kind goal_kind NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
    saved_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (saved_amount >= 0),
    monthly_amount DECIMAL(12, 2) DEFAULT 0,
    last_contrib_month VARCHAR(7),
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
DROP TRIGGER IF EXISTS set_timestamp_goals ON goals;
CREATE TRIGGER set_timestamp_goals BEFORE UPDATE ON goals FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 3.10. Investimentos
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    invested_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
DROP TRIGGER IF EXISTS set_timestamp_investments ON investments;
CREATE TRIGGER set_timestamp_investments BEFORE UPDATE ON investments FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
