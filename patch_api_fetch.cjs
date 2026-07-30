const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');
code = code.replace(
  /if \(error\.message\.includes\('rate limit'\) \|\| error\.name === 'AuthRetryableFetchError'\) \{[\s\S]*?throw new Error\('Limite de envios atingido.*?'\);\n\s*\}/,
  "if (error.message.includes('rate limit')) { throw new Error('Limite de envios atingido. Aguarde ou ajuste as configurações de SMTP no Supabase.'); } if (error.name === 'AuthRetryableFetchError') { throw new Error('Falha de conexão com o servidor. Verifique sua internet ou desative ad-blockers.'); }"
);
fs.writeFileSync('src/lib/api.ts', code);
