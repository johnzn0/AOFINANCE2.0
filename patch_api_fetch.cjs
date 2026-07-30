const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

// Update signUp
code = code.replace(
  /if \(error\.message\.includes\('rate limit'\)\) \{[^\}]*\} if \(error\.name === 'AuthRetryableFetchError'\) \{[^\}]*\}/g,
  "if (error.message.includes('rate limit')) { throw new Error('Limite de e-mails atingido (Rate Limit do Supabase). Aguarde ou ajuste as configurações de SMTP no Supabase (Auth > Settings > SMTP).'); } if (error.status === 500 || error.name === 'AuthRetryableFetchError') { throw new Error('Erro no servidor do Supabase (500). Isso ocorre devido ao limite do servidor de e-mail gratuito do Supabase. Para corrigir: Acesse seu painel do Supabase > Auth > Providers > Email e DESATIVE \"Confirm email\" OU configure um servidor SMTP customizado.'); }"
);

fs.writeFileSync('src/lib/api.ts', code);
