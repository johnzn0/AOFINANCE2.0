import { Router } from 'express';

const router = Router();

router.post('/assistant', async (req, res) => {
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

export default router;
