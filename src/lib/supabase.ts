import { createClient, SupabaseClient } from '@supabase/supabase-js';

let instance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (instance) return instance;

  const meta = import.meta as any;
  const url = meta.env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') || '';
  const key = meta.env?.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '') || '';

  let supabaseUrl = url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  const supabaseAnonKey = key.trim();

  if (supabaseUrl && supabaseAnonKey) {
    instance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return instance;
}

export const supabase = getSupabase();

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabase());
}

