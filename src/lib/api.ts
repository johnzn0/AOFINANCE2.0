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
    if (error.message.includes('rate limit')) { throw new Error('Limite de e-mails atingido (Rate Limit do Supabase). Aguarde ou ajuste as configurações de SMTP no Supabase (Auth > Settings > SMTP).'); } if (error.status === 500 || error.name === 'AuthRetryableFetchError') { throw new Error('Erro no servidor do Supabase (500). Isso ocorre devido ao limite do servidor de e-mail gratuito do Supabase. Para corrigir: Acesse seu painel do Supabase > Auth > Providers > Email e DESATIVE "Confirm email" OU configure um servidor SMTP customizado.'); }
    throw error;
  }
  
  if (data.user) {
    const isAdmin = email.toLowerCase() === 'johnozzi21@gmail.com';
    const profileRole = isAdmin ? 'admin' : 'user';
    const profileStatus = isAdmin ? 'approved' : 'pending';
    const profilePlan = 'free';

    // Insert into profiles
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      email: email,
      display_name: name,
      role: profileRole,
      status: profileStatus,
      plan: profilePlan,
    });
    
    if (profileError) {
      console.error('Error saving profile to database:', profileError);
    }

    return { 
      profile: { 
        uid: data.user.id, 
        email: data.user.email, 
        displayName: name, 
        role: profileRole as any, 
        status: profileStatus as any, 
        plan: profilePlan as any 
      } 
    };
  }

  return { profile: null };
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
  
  if (data.user) {
    // Fetch profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    
    // Fallback if missing
    const isAdmin = email.toLowerCase() === 'johnozzi21@gmail.com';
    const role = profile?.role || (isAdmin ? 'admin' : 'user');
    const status = profile?.status || (isAdmin ? 'approved' : 'pending');
    const plan = profile?.plan || 'free';
    
    // Se não existia o profile, cria
    if (!profile) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        display_name: data.user.user_metadata?.full_name,
        role: role,
        status: status,
        plan: plan,
      });
    }

    return { 
      profile: { 
        uid: data.user.id, 
        email: data.user.email, 
        displayName: profile?.display_name || data.user.user_metadata?.full_name, 
        role: role as any, 
        status: status as any, 
        plan: plan as any 
      } 
    };
  }

  return { profile: null };
}

export async function resetPasswordWithApi(email: string, newPassword?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    if (error.status === 500) {
      throw new Error('Erro 500 no Supabase. Isso geralmente ocorre devido a problemas no servidor de e-mail (SMTP) do Supabase. Configure um SMTP customizado no painel do Supabase (Auth > Settings > SMTP).');
    }
    if (error.message.includes('rate limit')) {
      throw new Error('Limite de e-mails atingido. Aguarde ou configure um SMTP no Supabase.');
    }
    throw error;
  }
  return { message: 'Email de recuperação enviado.' };
};

export async function getCurrentUserProfile() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  
  const email = session.user.email || '';
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
  
  const isAdmin = email.toLowerCase() === 'johnozzi21@gmail.com';
  const role = profile?.role || (isAdmin ? 'admin' : 'user');
  const status = profile?.status || (isAdmin ? 'approved' : 'pending');
  const plan = profile?.plan || 'free';

  if (!profile) {
      await supabase.from('profiles').upsert({
        id: session.user.id,
        email: email,
        display_name: session.user.user_metadata?.full_name,
        role: role,
        status: status,
        plan: plan,
      });
  }

  return {
    uid: session.user.id,
    email: email,
    displayName: profile?.display_name || session.user.user_metadata?.full_name || email.split('@')[0],
    role: role as any,
    status: status as any,
    plan: plan as any,
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
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) {
      console.error('Error fetching profiles:', error);
      return [];
  }
  return data.map(p => ({
      uid: p.id,
      email: p.email,
      displayName: p.display_name,
      role: p.role,
      status: p.status,
      plan: p.plan,
      createdAt: p.created_at,
  }));
}

export async function updateAdminUser(targetUid: string, updates: any) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const dbUpdates: any = {};
  if (updates.role) dbUpdates.role = updates.role;
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.plan) dbUpdates.plan = updates.plan;
  
  const { data, error } = await supabase.from('profiles').update(dbUpdates).eq('id', targetUid).select().single();
  if (error) {
      console.error('Error updating profile:', error);
      throw error;
  }
  return data;
}

export async function deleteAdminUser(targetUid: string) {
  const supabase = getSupabase();
  if (!supabase) return { success: false };
  // Will cascade to other tables if they have ON DELETE CASCADE
  const { error } = await supabase.from('profiles').delete().eq('id', targetUid);
  if (error) {
      console.error('Error deleting profile:', error);
      return { success: false };
  }
  return { success: true };
}
