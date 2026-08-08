const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const authReplacement = `
import authRoutes from './server/routes/auth';
import aiRoutes from './server/routes/ai';

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
`;

code = code.replace(/\/\/ ==========================================\n\/\/ 1\. ALTERAÇÃO DE SENHA[\s\S]*?\}\);\n/g, authReplacement);

fs.writeFileSync('server.ts', code);
