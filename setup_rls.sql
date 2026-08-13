-- SECURE THE DATABASE (Run this in the Supabase SQL Editor)

-- 1. Enable RLS on the main tables
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for user_data
-- Allow users to insert their own data
CREATE POLICY "Enable insert for users based on user_id" 
ON public.user_data FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own data
CREATE POLICY "Enable select for users based on user_id" 
ON public.user_data FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to update their own data
CREATE POLICY "Enable update for users based on user_id" 
ON public.user_data FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Create policies for profiles
-- Allow users to insert their own profile
CREATE POLICY "Enable insert for users based on id" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Enable select for users based on id" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on id" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow public read access to display_name (if you want friends/transfers eventually, otherwise keep it restricted)
-- For a personal finance app, keeping profiles restricted to the user is safer.

