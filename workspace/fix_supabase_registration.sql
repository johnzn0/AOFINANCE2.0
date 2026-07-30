-- =========================================================================================
-- SCRIPT DE CORREÇÃO DE REGISTRO E PERMISSÕES (SUPABASE / POSTGRESQL)
-- Execute este script no SQL Editor do Supabase para corrigir o cadastro de novos usuários.
-- =========================================================================================

-- 1. DESABILITAR OU PERMITIR RLS EM PROFILES E TABELAS RELACIONADAS
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credit_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.card_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recurring_bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.investments DISABLE ROW LEVEL SECURITY;

-- 2. CORRIGIR TRIGGER DE CRIAÇÃO AUTOMÁTICA DE PERFIL (handle_new_user)
-- Trata conflitos de ID e E-mail e define novos cadastros como 'approved' para liberar o acesso imediato.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, status, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN LOWER(NEW.email) = 'johnozzi21@gmail.com' THEN 'admin'::user_role ELSE 'user'::user_role END,
    'approved'::user_status, -- Define todos os novos usuários como aprovados automaticamente
    'free'::user_plan
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Garante que se houver erro ao salvar perfil, a conta de auth do usuário não é abortada
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reinstala a trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. GARANTIR QUE SEU USUÁRIO ADMIN E CONTAS EXISTENTES ESTEJAM APROVADOS
UPDATE public.profiles 
SET role = 'admin', status = 'approved', plan = 'pro' 
WHERE LOWER(email) = 'johnozzi21@gmail.com';

UPDATE public.profiles
SET status = 'approved'
WHERE status = 'pending';

-- 4. SINCRONIZAR QUAISQUER USUÁRIOS DO AUTH QUE AINDA NÃO POSSUÍAM PERFIL
INSERT INTO public.profiles (id, email, display_name, role, status, plan)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    CASE WHEN LOWER(email) = 'johnozzi21@gmail.com' THEN 'admin'::user_role ELSE 'user'::user_role END,
    'approved'::user_status,
    'free'::user_plan
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email;
