-- 1. Desabilita RLS para garantir que o admin possa ver tudo
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE card_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;

-- 2. Atualiza seu usuário para admin (caso não esteja)
UPDATE profiles SET role = 'admin', status = 'approved', plan = 'pro' WHERE email = 'johnozzi21@gmail.com';
