import { getSupabase } from './supabase';

const LOCAL_USERS_KEY = 'aofinance_local_users';
const CURRENT_USER_KEY = 'aofinance_current_user';

export function getStoredToken(): string | null {
  return null;
}
export function setStoredToken(token: string) {}
export function removeStoredToken() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  throw new Error('Not implemented. Using Supabase natively.');
}

export async function registerWithApi(email: string, pass: string, name?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        full_name: name,
      }
    }
  });
  if (error) {
    if (error.message.includes('already registered')) throw new Error('Este e-mail já está cadastrado.');
    if (error.message.includes('Password should be at least')) throw new Error('A senha deve ter pelo menos 6 caracteres.');
    throw error;
  }
  return { profile: data.user ? { uid: data.user.id, email: data.user.email, displayName: name, role: 'user', status: 'approved', plan: 'free' } : null };
}

export async function loginWithApi(email: string, pass: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  if (error) {
    if (error.message.includes('Invalid login credentials')) throw new Error('E-mail ou senha incorretos.');
    if (error.message.includes('Email not confirmed')) throw new Error('Por favor, confirme seu e-mail antes de fazer login.');
    throw error;
  }
  return { profile: data.user ? { uid: data.user.id, email: data.user.email, displayName: data.user.user_metadata?.full_name, role: 'user', status: 'approved', plan: 'free' } : null };
}

export async function resetPasswordWithApi(email: string, newPassword?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return { message: 'Email de recuperação enviado.' };
}

export async function getCurrentUserProfile() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return {
    uid: session.user.id,
    email: session.user.email,
    displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
    role: 'user',
    status: 'approved',
    plan: 'free',
  };
}

export async function syncUserWithSupabase() {
  return getCurrentUserProfile();
}

export async function loadStateFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', session.user.id)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    console.error('Error loading state from Supabase:', error);
  }
  return data?.data || null;
}

export async function saveStateToSupabase(state: any) {
  const supabase = getSupabase();
  if (!supabase) return { success: false };
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { success: false };
  
  const { error } = await supabase
    .from('user_data')
    .upsert({
      user_id: session.user.id,
      data: state,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    
  if (error) {
    console.error('Error saving state to Supabase:', error);
    return { success: false };
  }
  return { success: true };
}

export async function fetchAdminUsers() {
  return [];
}
export async function updateAdminUser(targetUid: string, data: any) {
  return data;
}
export async function deleteAdminUser(targetUid: string) {
  return { success: true };
}
