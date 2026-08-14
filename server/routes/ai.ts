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
      model: 'gemini-3.7-flash',
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

router.post('/categorize', async (req, res) => {
  try {
    const { description, type, categories } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const availableCategories = categories && categories.length > 0 
      ? categories 
      : ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação', 'Cartão de Crédito', 'Salário', 'Investimentos', 'Outros'];

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analise a seguinte descrição de transação financeira (${type === 'income' ? 'receita' : 'despesa'}): "${description}".
Escolha exatamente uma categoria da seguinte lista: ${availableCategories.join(', ')}.
Responda no formato JSON com as chaves "category" (string exata da lista) e "reasoning" (uma explicação curta de 1 frase).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.category && availableCategories.includes(parsed.category)) {
        return res.json({
          category: parsed.category,
          confidence: 0.95,
          reasoning: parsed.reasoning || 'Categorizado pela IA Gemini',
        });
      }
    }

    // Heuristic fallback
    const descLower = description.toLowerCase();
    let cat = availableCategories[0] || 'Outros';

    if (type === 'income') {
      if (descLower.includes('salario') || descLower.includes('folha')) cat = 'Salário';
      else if (descLower.includes('invest') || descLower.includes('rendimento')) cat = 'Investimentos';
      else cat = 'Outras Receitas';
    } else {
      if (descLower.includes('mercado') || descLower.includes('ifood') || descLower.includes('restaurante') || descLower.includes('pao')) cat = 'Alimentação';
      else if (descLower.includes('uber') || descLower.includes('posto') || descLower.includes('combustivel')) cat = 'Transporte';
      else if (descLower.includes('aluguel') || descLower.includes('luz') || descLower.includes('agua') || descLower.includes('condominio')) cat = 'Moradia';
      else if (descLower.includes('farmacia') || descLower.includes('medico') || descLower.includes('hospital')) cat = 'Saúde';
      else if (descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('cinema')) cat = 'Lazer';
    }

    return res.json({
      category: availableCategories.includes(cat) ? cat : availableCategories[0],
      confidence: 0.75,
      reasoning: 'Classificação por regras de palavras-chave',
    });
  } catch (err: any) {
    console.error('Error in /api/ai/categorize:', err);
    res.status(500).json({ error: 'Categorization failed' });
  }
});

export default router;
