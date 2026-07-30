const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');
code = code.replace(
  /export async function resetPasswordWithApi.*?\{[\s\S]*?if \(error\) throw error;[\s\S]*?\}/,
  `export async function resetPasswordWithApi(email: string, newPassword?: string) {
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
}`
);
fs.writeFileSync('src/lib/api.ts', code);
