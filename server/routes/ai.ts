import { Router } from 'express';

const router = Router();

router.post('/assistant', async (req, res) => {
  try {
    const { history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        reply: `Olá! Eu sou o assistente do AO FINANCE. Adicione uma chave API do Gemini nas configurações para ativar minha inteligência.`
      });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Você é o Assistente de Inteligência Artificial do aplicativo AO FINANCE.
Sua persona: Você é um assistente brilhante, prestativo e natural. Você pode conversar sobre qualquer assunto do mundo, como programação, matemática, culinária, história, e claro, finanças. 
NÃO SEJA UM ROBÔ ENGESSADO. Aja de forma conversacional e humana.

Sobre as finanças do usuário:
Você possui acesso a ferramentas (Function Calling) que permitem consultar os dados em tempo real da conta AO FINANCE do usuário.
Use essas ferramentas SEMPRE que o usuário fizer perguntas relacionadas ao seu próprio dinheiro, como "Quanto eu gastei?", "Qual meu saldo?", "Onde gastei mais?".
NUNCA invente ou alucine saldos, valores ou transações. Se a ferramenta não retornar dados ou você não tiver certeza, informe que não encontrou informações financeiras registradas.
Quando não for usar ferramentas (perguntas gerais), apenas converse normalmente usando seu conhecimento geral de IA.

Regras de formatação:
- Use Markdown (negrito, listas, tabelas) para deixar as respostas ricas e fáceis de ler.
- Quando exibir relatórios financeiros, você pode organizá-los em tabelas Markdown.
- Quando usar ferramentas de dados, analise os dados antes de responder e resuma para o usuário de forma amigável.`;

    const tools = [
      {
        functionDeclarations: [
          {
            name: 'get_financial_summary',
            description: 'Obtém um resumo geral e os totais financeiros (receitas, despesas, patrimônio, saldo). Use para responder perguntas amplas sobre saldo e panorama atual.',
            parameters: {
              type: 'OBJECT',
              properties: {}
            }
          },
          {
            name: 'get_transactions',
            description: 'Busca as transações do usuário, opcionalmente filtrando por tipo ou categoria.',
            parameters: {
              type: 'OBJECT',
              properties: {
                type: { type: 'STRING', description: 'Filtra por "income" (receitas) ou "expense" (despesas)' },
                category: { type: 'STRING', description: 'Filtra por categoria ex: "Alimentação", "Transporte"' },
                limit: { type: 'NUMBER', description: 'Número máximo de registros a retornar, ex: 10' }
              }
            }
          },
          {
            name: 'get_goals',
            description: 'Retorna a lista de metas e objetivos financeiros cadastrados pelo usuário.',
            parameters: {
              type: 'OBJECT',
              properties: {}
            }
          }
        ]
      }
    ];

    // Ensure history is provided
    let conversation = history;
    if (!conversation || conversation.length === 0) {
      conversation = [{ role: 'user', parts: [{ text: 'Olá' }] }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: conversation,
      config: {
        systemInstruction,
        tools,
        temperature: 0.7,
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      // Return the function calls to the client for execution
      return res.json({ functionCalls: response.functionCalls });
    }

    const reply = response.text || 'Desculpe, não consegui formular uma resposta no momento.';
    return res.json({ reply });

  } catch (err: any) {
    console.error('Error in /api/ai/assistant:', err);
    res.json({
      reply: 'Tive um problema técnico de comunicação com o servidor. Tente novamente em instantes.'
    });
  }
});

router.post('/categorize', async (req, res) => {
  // Keeping categorize as is
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
