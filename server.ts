import express from 'express';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { validatePasswordRequirements } from './src/utils/passwordValidator';
import { storeResetToken, verifyResetToken, markTokenAsUsed } from './src/lib/resetTokenStore';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://juavorsfoscbtxsiudvv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImpXVCJ9.cYOO5gIrwgp5pbC1zJZYn-GQ3IKjDuxE-H8ky1f4iOs';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

// ==========================================
// 1. ALTERAÇÃO DE SENHA (USUÁRIO AUTENTICADO)
// ==========================================
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios: e-mail, senha atual e nova senha.' });
    }

    // Validar requisitos de segurança da nova senha
    const passValidation = validatePasswordRequirements(newPassword);
    if (!passValidation.isValid) {
      return res.status(400).json({ error: passValidation.errors.join(' ') });
    }

    // Verificar se a senha atual está correta tentando autenticar no Supabase
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (authError || !authData.user) {
      return res.status(400).json({ error: 'A senha atual está incorreta. Nenhuma alteração foi realizada.' });
    }

    // Se autenticado com sucesso, atualiza a senha
    let updateSuccess = false;

    // Tenta atualizar via cliente com a sessão
    if (authData.session) {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
        },
      });
      await userClient.auth.setSession(authData.session);
      const { error: updateErr } = await userClient.auth.updateUser({ password: newPassword });
      if (!updateErr) updateSuccess = true;
    }

    // Se tiver Service Role Key, usa admin API
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

    // Registrar data da alteração de senha no perfil do usuário
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

// ==========================================
// 2. RECUPERAÇÃO DE SENHA - SOLICITAR TOKEN ("Esqueci minha senha")
// ==========================================
app.post('/api/auth/forgot-password', async (req, res) => {
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

    // Buscar se o usuário existe em profiles ou auth.users
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

    // Resposta genérica mesmo se o usuário não for encontrado (evita enumeração de e-mails)
    if (!userRecord) {
      return res.json(GENERIC_RESPONSE);
    }

    // Gerar token seguro de 32 bytes (64 caracteres hex)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // Armazenar token no banco / memória
    await storeResetToken(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
      userRecord.id,
      cleanEmail,
      token,
      expiresAt
    );

    // Definir URL de redefinição
    const originUrl = req.get('origin') || req.get('referer') || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${originUrl.replace(/\/+$/, '')}/reset-password?token=${token}`;

    console.log(`\n======================================================`);
    console.log(`[RECUPERAÇÃO DE SENHA SOLICITADA PARA]: ${cleanEmail}`);
    console.log(`[LINK DE REDEFINIÇÃO GERADO]: ${resetUrl}`);
    console.log(`[EXPIRA EM]: 30 Minutos (${expiresAt.toLocaleString('pt-BR')})`);
    console.log(`======================================================\n`);

    // Enviar e-mail via SMTP se configurado
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
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #1e293b;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #2563eb, #d97706); border-radius: 12px; color: #ffffff; font-weight: 900; font-size: 20px; line-height: 48px;">AO</div>
                <h1 style="color: #ffffff; font-size: 22px; margin-top: 12px; margin-bottom: 4px;">AO FINANCE</h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 0;">Solicitação de Redefinição de Senha</p>
              </div>

              <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                <p style="font-size: 14px; color: #e2e8f0; margin-top: 0; line-height: 1.6;">
                  Olá, <strong>${userRecord.name || cleanEmail}</strong>!
                </p>
                <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
                  Recebemos uma solicitação para redefinir a senha da sua conta no AO FINANCE. Clique no botão abaixo para cadastrar uma nova senha:
                </p>

                <div style="text-align: center; margin: 28px 0;">
                  <a href="${resetUrl}" target="_blank" style="background: linear-gradient(90deg, #2563eb, #3b82f6); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                    Redefinir Minha Senha
                  </a>
                </div>

                <p style="font-size: 12px; color: #f59e0b; margin-bottom: 0; line-height: 1.5; text-align: center;">
                  ⚠️ Este link é válido por apenas <strong>30 minutos</strong> e pode ser utilizado uma única vez.
                </p>
              </div>

              <p style="font-size: 11px; color: #64748b; line-height: 1.5; margin-bottom: 8px;">
                Se você não solicitou a recuperação de senha, desconsidere este e-mail com segurança. Sua senha atual continuará inalterada.
              </p>
              
              <div style="border-top: 1px solid #334155; pt-16px; margin-top: 20px; text-align: center; font-size: 11px; color: #475569;">
                &copy; ${new Date().getFullYear()} AO FINANCE - Gestão Financeira Inteligente.
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SMTP] E-mail de recuperação enviado para ${cleanEmail}`);
      } catch (smtpErr) {
        console.error('[SMTP Fail]: Não foi possível enviar e-mail via SMTP:', smtpErr);
      }
    }

    return res.json(GENERIC_RESPONSE);
  } catch (err: any) {
    console.error('Erro em /api/auth/forgot-password:', err);
    return res.json(GENERIC_RESPONSE);
  }
});

// ==========================================
// 3. VERIFICAR TOKEN DE REDEFINIÇÃO
// ==========================================
app.all('/api/auth/verify-reset-token', async (req, res) => {
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
    console.error('Erro em /api/auth/verify-reset-token:', err);
    return res.status(500).json({ valid: false, message: 'Erro ao verificar o token.' });
  }
});

// ==========================================
// 4. SALVAR NOVA SENHA (COM TOKEN VÁLIDO)
// ==========================================
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string' || !newPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    }

    // Validar critérios de senha
    const passValidation = validatePasswordRequirements(newPassword);
    if (!passValidation.isValid) {
      return res.status(400).json({ error: passValidation.errors.join(' ') });
    }

    // Verificar se o token é válido
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

    // Atualizar senha no Supabase
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error: adminErr } = await adminClient.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      });
      if (!adminErr) updated = true;
    }

    // Se admin API não estivesse disponível, atualizar via resetPasswordForEmail / updateUser
    if (!updated) {
      try {
        const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Tenta logar ou resetar
        const { error: resErr } = await tempClient.auth.resetPasswordForEmail(targetEmail);
        if (!resErr) updated = true;
      } catch (e) {
        console.warn('Fallback reset pass error:', e);
      }
    }

    // Marcar o token como utilizado e invalidar os demais
    await markTokenAsUsed(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
      token
    );

    return res.json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (err: any) {
    console.error('Erro em /api/auth/reset-password:', err);
    return res.status(500).json({ error: 'Erro ao processar a redefinição de senha.' });
  }
});

app.post('/api/ai/assistant', async (req, res) => {

  try {
    const { prompt, userSummary } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        reply: `Olá! Seja bem-vindo ao AOFINANCE! Sou o seu assistente financeiro pessoal. Estou aqui para te ajudar a organizar suas contas, bater suas metas e fazer seu dinheiro render mais.`
      });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Você é o Assistente Financeiro IA do AOFINANCE, um consultor financeiro pessoal amigável, direto, altamente capacitado e encorajador.
Sua linguagem deve ser em português brasileiro, clara, amigável e concisa (máximo 3 a 4 frases por resposta), ideal para ser lida e ouvida em síntese de voz.
Responda sempre diretamente à dúvida do usuário com empatia e sabedoria financeira.

Contexto do Usuário:
- Nome: ${userSummary?.name || 'Usuário'}
- Receitas Mensais: R$ ${userSummary?.income || 0}
- Despesas Mensais: R$ ${userSummary?.expense || 0}
- Patrimônio Total: R$ ${userSummary?.netWorth || 0}
- Metas Cadastradas: ${userSummary?.goalsCount || 0}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt || 'Olá! Faça um cumprimento de boas-vindas e se coloque à disposição para ajudar.',
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Olá! Como posso te ajudar com a gestão das suas finanças hoje?';
    return res.json({ reply });
  } catch (err: any) {
    console.error('Error in /api/ai/assistant:', err);
    res.json({
      reply: 'Olá! Seja bem-vindo ao AOFINANCE. Eu sou o seu assistente financeiro pessoal. Como posso te ajudar hoje?'
    });
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  import('vite').then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    }).then((vite) => {
      app.use(vite.middlewares);
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
      });
    });
  });
} else if (!process.env.VERCEL) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
