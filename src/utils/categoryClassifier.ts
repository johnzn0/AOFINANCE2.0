import { Transaction } from '../types';
import { inferCategory } from './statementParser';

export interface CategoryPrediction {
  category: string;
  confidence: number; // 0 to 1
  source: 'history_exact' | 'history_fuzzy' | 'rule_engine' | 'ai_enhanced';
  matchCount?: number;
  reasoning?: string;
}

// Stop words to exclude during tokenization
const STOP_WORDS = new Set([
  'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'por', 'para', 'com', 'sem', 'sob', 'sobre', 'e', 'ou', 'a', 'o',
  'as', 'os', 'um', 'uma', 'uns', 'umas', 'pix', 'pag', 'pagamento',
  'compra', 'debito', 'credito', 'ted', 'doc', 'transf', 'transferencia',
  'saque', 'deposito', 'envio', 'receb', 'recebimento', 's/a', 'sa', 'ltda', 'me'
]);

/**
 * Normalizes a string by converting to lowercase, stripping accents and special chars.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts key word tokens from a description
 */
function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized
    .split(' ')
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Predicts category based on the user's historical transactions first, falling back to rule engine.
 */
export function predictCategory(
  description: string,
  type: 'income' | 'expense' = 'expense',
  userTransactions: Transaction[] = [],
  availableCategories?: string[]
): CategoryPrediction {
  if (!description || !description.trim()) {
    return {
      category: type === 'income' ? 'Outras Receitas' : 'Outros Gastos',
      confidence: 0,
      source: 'rule_engine',
    };
  }

  const normInput = normalizeText(description);
  const inputTokens = tokenize(description);

  if (userTransactions.length > 0) {
    // 1. Exact / Normalized Description Match in History
    const exactMatches: Record<string, number> = {};
    let totalExactMatches = 0;

    // 2. Token / Fuzzy Substring Matches in History
    const categoryTokenScores: Record<string, number> = {};

    for (const tx of userTransactions) {
      // Only match transactions of the same type or general
      if (!tx.category || !tx.description) continue;
      
      const normTxDesc = normalizeText(tx.description);
      const txTokens = tokenize(tx.description);

      // Exact or full substring match
      if (normTxDesc === normInput || normTxDesc.includes(normInput) || normInput.includes(normTxDesc)) {
        exactMatches[tx.category] = (exactMatches[tx.category] || 0) + 1;
        totalExactMatches++;
      }

      // Token overlap similarity
      let overlapCount = 0;
      for (const token of inputTokens) {
        if (txTokens.includes(token)) {
          overlapCount++;
        }
      }

      if (overlapCount > 0) {
        const score = (overlapCount / Math.max(inputTokens.length, 1)) * 1.5;
        categoryTokenScores[tx.category] = (categoryTokenScores[tx.category] || 0) + score;
      }
    }

    // Evaluate exact history match
    if (totalExactMatches > 0) {
      let bestCategory = '';
      let maxCount = 0;

      for (const [cat, count] of Object.entries(exactMatches)) {
        if (count > maxCount) {
          maxCount = count;
          bestCategory = cat;
        }
      }

      if (bestCategory) {
        const confidence = Math.min(0.95, 0.7 + maxCount * 0.05);
        return {
          category: bestCategory,
          confidence,
          source: 'history_exact',
          matchCount: maxCount,
          reasoning: `Encontrado ${maxCount}x no seu histórico para "${description}"`,
        };
      }
    }

    // Evaluate fuzzy / token match
    let bestTokenCategory = '';
    let maxTokenScore = 0;

    for (const [cat, score] of Object.entries(categoryTokenScores)) {
      if (score > maxTokenScore) {
        maxTokenScore = score;
        bestTokenCategory = cat;
      }
    }

    if (bestTokenCategory && maxTokenScore >= 1.0) {
      const confidence = Math.min(0.85, 0.5 + maxTokenScore * 0.1);
      return {
        category: bestTokenCategory,
        confidence,
        source: 'history_fuzzy',
        reasoning: `Baseado em palavras semelhantes do seu histórico`,
      };
    }
  }

  // 3. Fallback to Rule Engine
  const ruleCategory = inferCategory(description, type);
  return {
    category: ruleCategory,
    confidence: 0.6,
    source: 'rule_engine',
    reasoning: `Padrão identificado automaticamente`,
  };
}

/**
 * Async Smart Categorization with AI enhancement
 */
export async function predictCategoryWithAI(
  description: string,
  type: 'income' | 'expense',
  userTransactions: Transaction[] = [],
  availableCategories: string[] = []
): Promise<CategoryPrediction> {
  const localPrediction = predictCategory(description, type, userTransactions, availableCategories);

  // If local confidence is already high (>= 75%), return immediately
  if (localPrediction.confidence >= 0.75) {
    return localPrediction;
  }

  // Attempt server AI categorization call if reachable
  try {
    const res = await fetch('/api/ai/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        type,
        categories: availableCategories,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.category) {
        return {
          category: data.category,
          confidence: data.confidence || 0.9,
          source: 'ai_enhanced',
          reasoning: data.reasoning || 'Categorizado via Inteligência Artificial',
        };
      }
    }
  } catch {
    // Ignore AI network error, use local prediction
  }

  return localPrediction;
}

/**
 * Returns top learned merchant/vendor mappings from user history
 */
export function getLearnedVendorMappings(userTransactions: Transaction[]) {
  const map: Record<string, Record<string, number>> = {};

  for (const tx of userTransactions) {
    if (!tx.description || !tx.category) continue;
    const norm = normalizeText(tx.description);
    if (norm.length < 3) continue;

    if (!map[norm]) map[norm] = {};
    map[norm][tx.category] = (map[norm][tx.category] || 0) + 1;
  }

  const result: Array<{ vendor: string; category: string; count: number }> = [];

  for (const [vendor, cats] of Object.entries(map)) {
    let topCat = '';
    let topCount = 0;
    for (const [cat, count] of Object.entries(cats)) {
      if (count > topCount) {
        topCount = count;
        topCat = cat;
      }
    }
    if (topCount >= 2) {
      result.push({ vendor, category: topCat, count: topCount });
    }
  }

  return result.sort((a, b) => b.count - a.count);
}
