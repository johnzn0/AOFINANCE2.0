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
    if (error.message.includes('rate limit')) {
      throw new Error('Limite de e-mails atingido (Rate Limit do Supabase). Ajuste o SMTP no Supabase ou desative "Confirm email" em Auth > Providers > Email.');
    }
    if (error.status === 500 || error.name === 'AuthRetryableFetchError' || error.message.includes('Error sending confirmation email')) {
      throw new Error('Erro 500 no servidor de e-mail do Supabase. Para permitir cadastro direto sem erro: Acesse o painel do Supabase > Auth > Providers > Email e DESATIVE "Confirm email".');
    }
    throw error;
  }
  
  if (data.user) {
    let session = data.session;
    
    // Se não veio sessão no signUp (devido a confirmação de e-mail pendente), tenta logar diretamente
    if (!session) {
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (loginData?.session) {
        session = loginData.session;
      }
    }

    if (!session) {
      throw new Error('Cadastro realizado! No entanto, a confirmação de e-mail está ATIVADA no seu Supabase. Verifique sua caixa de e-mail para confirmar a conta, OU acesse o painel do Supabase (Authentication > Providers > Email) e DESATIVE "Confirm email" para autorizar o login instantâneo.');
    }

    const isAdmin = email.toLowerCase() === 'johnozzi21@gmail.com';
    const profileRole = isAdmin ? 'admin' : 'user';
    const profileStatus = isAdmin ? 'approved' : 'pending';
    const profilePlan = 'free';

    // Salva perfil no banco de dados
    try {
      await supabase.from('profiles').upsert({
        id: session.user.id,
        email: email,
        display_name: name || email.split('@')[0],
        role: profileRole,
        status: profileStatus,
        plan: profilePlan,
      });
    } catch (profileError) {
      console.warn('Erro ao criar perfil no Supabase:', profileError);
    }

    return { 
      profile: { 
        uid: session.user.id, 
        email: session.user.email || email, 
        displayName: name || email.split('@')[0], 
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
    if (error.message.includes('Email not confirmed')) throw new Error('Seu e-mail ainda não foi confirmado. Acesse o painel do Supabase (Auth > Providers > Email) e DESATIVE "Confirm email" para entrar sem depender de confirmação.');
    throw error;
  }
  
  if (data.user) {
    // Fetch profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    
    // Fallback if missing
    const isAdmin = email.toLowerCase() === 'johnozzi21@gmail.com';
    const role = profile?.role || (isAdmin ? 'admin' : 'user');
    const status = profile?.status || (isAdmin ? 'approved' : 'pending');
    const plan = profile?.plan || 'free';
    
    // Se não existia o profile, cria
    if (!profile) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email,
          display_name: data.user.user_metadata?.full_name || email.split('@')[0],
          role: role,
          status: status,
          plan: plan,
        });
      } catch (e) {
        console.warn('Profile creation fallback error:', e);
      }
    }

    return { 
      profile: { 
        uid: data.user.id, 
        email: data.user.email || email, 
        displayName: profile?.display_name || data.user.user_metadata?.full_name || email.split('@')[0], 
        role: role as any, 
        status: status as any, 
        plan: plan as any 
      } 
    };
  }

  return { profile: null };
}

export async function requestForgotPasswordApi(email: string) {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao solicitar recuperação de senha.');
    return data;
  } catch (err: any) {
    // Fallback direct to Supabase if API is unreachable
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    }
    return {
      success: true,
      message: 'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.',
    };
  }
}

export async function verifyResetTokenApi(token: string) {
  try {
    const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!res.ok || !data.valid) {
      return { valid: false, message: data.message || 'Link de recuperação inválido ou expirado.' };
    }
    return { valid: true, email: data.email };
  } catch (err: any) {
    return { valid: false, message: 'Não foi possível verificar a validade do link.' };
  }
}

export async function resetPasswordWithTokenApi(token: string, newPassword: string) {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao redefinir a senha.');
  }
  return data;
}

export async function changePasswordAuthApi(email: string, currentPassword: string, newPassword: string) {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao alterar a senha.');
  }
  return data;
}

export async function resetPasswordWithApi(email: string, newPassword?: string) {

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase não configurado');

  if (newPassword) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) throw updateErr;
      return { message: 'Senha atualizada com sucesso!' };
    }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}`,
  });

  if (error) {
    if (
      error.status === 500 ||
      error.message?.includes('500') ||
      error.message?.includes('Error sending') ||
      error.name === 'AuthRetryableFetchError'
    ) {
      throw new Error(
        'Erro 500 no Supabase. O servidor de e-mail do Supabase está desativado ou com limite excedido. Para resolver no Supabase: Vá em Authentication > Settings > SMTP e configure um servidor SMTP próprio.'
      );
    }
    if (error.message?.includes('rate limit') || error.status === 429) {
      throw new Error('Limite de e-mails atingido. Aguarde alguns minutos ou configure um SMTP no painel do Supabase.');
    }
    throw error;
  }
  return { message: 'E-mail de recuperação enviado com sucesso!' };
}

export async function getCurrentUserProfile() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  
  const email = session.user.email || '';
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  
  const isAdmin = email.toLowerCase() === 'johnozzi21@gmail.com';
  const role = profile?.role || (isAdmin ? 'admin' : 'user');
  const status = profile?.status || (isAdmin ? 'approved' : 'pending');
  const plan = profile?.plan || 'free';

  if (!profile) {
    try {
      await supabase.from('profiles').upsert({
        id: session.user.id,
        email: email,
        display_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0],
        role: role,
        status: status,
        plan: plan,
      });
    } catch (err) {
      console.warn('Error saving profile to database:', err);
    }
  }

  return {
    uid: session.user.id,
    email: email,
    displayName: profile?.display_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0],
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
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    console.warn('Error loading state from Supabase:', error);
  }

  return data?.data || null;
}

export async function saveStateToSupabase(state: any) {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { success: false, error: 'User not logged in' };

  // Try upsert first
  const { error } = await supabase
    .from('user_data')
    .upsert({
      user_id: session.user.id,
      data: state,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  
  if (error) {
    console.warn('Upsert state failed, attempting fallback update/insert:', error.message);
    // Fallback: check if row exists and update or insert
    const { data: existing } = await supabase
      .from('user_data')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await supabase
        .from('user_data')
        .update({ data: state, updated_at: new Date().toISOString() })
        .eq('user_id', session.user.id);
      if (updateErr) {
        console.error('Error updating state in Supabase:', updateErr);
        return { success: false, error: updateErr.message };
      }
    } else {
      const { error: insertErr } = await supabase
        .from('user_data')
        .insert({ user_id: session.user.id, data: state, updated_at: new Date().toISOString() });
      if (insertErr) {
        console.error('Error inserting state into Supabase:', insertErr);
        return { success: false, error: insertErr.message };
      }
    }
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
