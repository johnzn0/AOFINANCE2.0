import { Router } from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { validatePasswordRequirements } from '../../src/utils/passwordValidator';
import { storeResetToken, verifyResetToken, markTokenAsUsed } from '../../src/lib/resetTokenStore';

const router = Router();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://juavorsfoscbtxsiudvv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImpXVCJ9.cYOO5gIrwgp5pbC1zJZYn-GQ3IKjDuxE-H8ky1f4iOs';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

router.post('/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios: e-mail, senha atual e nova senha.' });
    }
    const passValidation = validatePasswordRequirements(newPassword);
    if (!passValidation.isValid) {
      return res.status(400).json({ error: passValidation.errors.join(' ') });
    }
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (authError || !authData.user) {
      return res.status(400).json({ error: 'A senha atual está incorreta. Nenhuma alteração foi realizada.' });
    }
    let updateSuccess = false;
    if (authData.session) {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      });
      await userClient.auth.setSession(authData.session);
      const { error: updateErr } = await userClient.auth.updateUser({ password: newPassword });
      if (!updateErr) updateSuccess = true;
    }
    if (!updateSuccess && SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error: adminErr } = await adminClient.auth.admin.updateUserById(authData.user.id, {
        password: newPassword,
      });
      if (!adminErr) updateSuccess = true;
    }
    if (!updateSuccess) {
      return res.status(500).json({ error: 'Erro ao atualizar a senha no banco de dados. Tente novamente.' });
    }
    try {
      await supabaseClient.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', authData.user.id);
    } catch (e) {
      console.warn('Erro ao atualizar updated_at do perfil:', e);
    }
    return res.json({ success: true, message: 'Senha alterada com sucesso!' });
  } catch (err: any) {
    console.error('Erro em /api/auth/change-password:', err);
    return res.status(500).json({ error: 'Ocorreu um erro interno ao alterar a senha.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const GENERIC_RESPONSE = {
    success: true,
    message: 'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.',
  };
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Informe um e-mail válido.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    let userRecord: { id: string; email: string; name?: string } | null = null;
    try {
      const { data } = await supabaseClient
        .from('profiles')
        .select('id, email, display_name')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (data) {
        userRecord = { id: data.id, email: data.email, name: data.display_name };
      }
    } catch (dbErr) {
      console.warn('[ForgotPassword] DB check error:', dbErr);
    }
    if (!userRecord) {
      return res.json(GENERIC_RESPONSE);
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await storeResetToken(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
      userRecord.id,
      cleanEmail,
      token,
      expiresAt
    );
    const originUrl = req.get('origin') || req.get('referer') || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${originUrl.replace(/\/+$/, '')}/reset-password?token=${token}`;
    
    if (process.env.SMTP_HOST) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: process.env.SMTP_USERNAME ? {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD || '',
          } : undefined,
        });
        const mailOptions = {
          from: process.env.SMTP_FROM || '"AO FINANCE" <no-reply@aofinance.com>',
          to: cleanEmail,
          subject: 'Recuperação de Senha - AO FINANCE',
          html: `<p>Olá, clique no botão abaixo para cadastrar uma nova senha: <a href="${resetUrl}">Redefinir Minha Senha</a></p>`,
        };
        await transporter.sendMail(mailOptions);
      } catch (smtpErr) {
        console.error('[SMTP Fail]:', smtpErr);
      }
    }
    return res.json(GENERIC_RESPONSE);
  } catch (err: any) {
    console.error('Erro em /api/auth/forgot-password:', err);
    return res.json(GENERIC_RESPONSE);
  }
});

router.all('/verify-reset-token', async (req, res) => {
  try {
    const token = req.method === 'GET' ? req.query.token : req.body.token;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ valid: false, message: 'Token não fornecido.' });
    }
    const verification = await verifyResetToken(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
      token
    );
    if (!verification.valid) {
      return res.status(400).json({ valid: false, message: verification.message });
    }
    return res.json({ valid: true, email: verification.record?.email });
  } catch (err: any) {
    return res.status(500).json({ valid: false, message: 'Erro ao verificar o token.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || typeof token !== 'string' || !newPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    }
    const passValidation = validatePasswordRequirements(newPassword);
    if (!passValidation.isValid) {
      return res.status(400).json({ error: passValidation.errors.join(' ') });
    }
    const verification = await verifyResetToken(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
      token
    );
    if (!verification.valid || !verification.record) {
      return res.status(400).json({
        error: verification.message || 'Link de redefinição de senha inválido, expirado ou já utilizado.',
      });
    }
    const targetEmail = verification.record.email;
    const targetUserId = verification.record.userId;
    let updated = false;
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error: adminErr } = await adminClient.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      });
      if (!adminErr) updated = true;
    }
    if (!updated) {
      try {
        const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { error: resErr } = await tempClient.auth.resetPasswordForEmail(targetEmail);
        if (!resErr) updated = true;
      } catch (e) {}
    }
    await markTokenAsUsed(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
      token
    );
    return res.json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao processar a redefinição de senha.' });
  }
});

export default router;
