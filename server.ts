import express from 'express';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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
