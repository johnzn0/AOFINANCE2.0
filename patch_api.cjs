const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');
code = code.replace(
  /throw new Error\('Muitas tentativas \(Rate Limit\).*?'\);/,
  "throw new Error('Limite de envios atingido (Rate Limit do Supabase). O plano gratuito limita a 3 cadastros por hora. Para resolver definitivamente, configure um servidor SMTP customizado (como Resend ou SendGrid) nas configurações de Auth do Supabase.');"
);
fs.writeFileSync('src/lib/api.ts', code);
