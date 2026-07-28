import { createClient, SupabaseClient } from '@supabase/supabase-js';

let instance: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://juavorsfoscbtxsiudvv.supabase.co';
const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YXZvcnNmb3NjYnR4c2l1ZHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MjY0NDgsImV4cCI6MjA5OTAwMjQ0OH0.cYOO5gIrwgp5pbC1zJZYn-GQ3IKjDuxE-H8ky1f4iOs';

export function getSupabase(): SupabaseClient | null {
  if (instance) return instance;

  const importMeta = import.meta as unknown as { env?: Record<string, string> };

  const url =
    importMeta.env?.VITE_SUPABASE_URL ||
    (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') ||
    DEFAULT_SUPABASE_URL;

  const key =
    importMeta.env?.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '') ||
    DEFAULT_SUPABASE_KEY;

  let supabaseUrl = (url || '').trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  const supabaseAnonKey = (key || '').trim();

  if (supabaseUrl && supabaseAnonKey) {
    try {
      instance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
    }
  }

  return instance;
}

export const supabase = getSupabase();

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabase());
}



