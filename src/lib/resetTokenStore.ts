import { createClient } from '@supabase/supabase-js';

export interface ResetTokenRecord {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

// In-memory token storage for instant fallback & fast validation
const tokenStore = new Map<string, ResetTokenRecord>();

export async function storeResetToken(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  email: string,
  token: string,
  expiresAt: Date
): Promise<ResetTokenRecord> {
  const record: ResetTokenRecord = {
    id: `token_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    email: email.toLowerCase().trim(),
    token,
    expiresAt,
    usedAt: null,
    createdAt: new Date(),
  };

  // Invalidate previous tokens for this email in memory
  for (const [t, rec] of tokenStore.entries()) {
    if (rec.email === record.email && !rec.usedAt) {
      rec.usedAt = new Date();
    }
  }

  tokenStore.set(token, record);

  // Attempt DB persistence in Supabase if table exists
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Mark previous as used in DB
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('email', record.email)
      .is('used_at', null);

    await supabase.from('password_reset_tokens').insert({
      user_id: userId,
      email: record.email,
      token: token,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[TokenStore] Supabase DB token insert fallback:', err);
  }

  return record;
}

export async function verifyResetToken(
  supabaseUrl: string,
  supabaseKey: string,
  token: string
): Promise<{ valid: boolean; record?: ResetTokenRecord; message?: string }> {
  if (!token || typeof token !== 'string') {
    return { valid: false, message: 'Token não fornecido.' };
  }

  // Check in-memory store first
  let record = tokenStore.get(token);

  // If not in memory, check Supabase DB
  if (!record) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (data) {
        record = {
          id: data.id,
          userId: data.user_id,
          email: data.email,
          token: data.token,
          expiresAt: new Date(data.expires_at),
          usedAt: data.used_at ? new Date(data.used_at) : null,
          createdAt: new Date(data.created_at),
        };
        tokenStore.set(token, record);
      }
    } catch (err) {
      console.warn('[TokenStore] Supabase DB token fetch fallback:', err);
    }
  }

  if (!record) {
    return { valid: false, message: 'Token de recuperação não encontrado ou inválido.' };
  }

  if (record.usedAt) {
    return { valid: false, message: 'Este link de recuperação de senha já foi utilizado.' };
  }

  if (new Date() > record.expiresAt) {
    return { valid: false, message: 'Este link de recuperação de senha expirou (limite de 30 minutos).' };
  }

  return { valid: true, record };
}

export async function markTokenAsUsed(
  supabaseUrl: string,
  supabaseKey: string,
  token: string
): Promise<void> {
  const record = tokenStore.get(token);
  const now = new Date();

  if (record) {
    record.usedAt = now;
    // Invalidate any other active tokens for this user
    for (const [, rec] of tokenStore.entries()) {
      if (rec.email === record.email && !rec.usedAt) {
        rec.usedAt = now;
      }
    }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: now.toISOString() })
      .eq('token', token);

    if (record) {
      await supabase
        .from('password_reset_tokens')
        .update({ used_at: now.toISOString() })
        .eq('email', record.email)
        .is('used_at', null);
    }
  } catch (err) {
    console.warn('[TokenStore] Supabase DB mark token used fallback:', err);
  }
}
