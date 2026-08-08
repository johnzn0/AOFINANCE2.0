import { describe, it, expect } from 'vitest';
import { predictCategory, getLearnedVendorMappings } from './categoryClassifier';
import { Transaction } from '../types';

describe('categoryClassifier', () => {
  const mockHistory: Transaction[] = [
    {
      id: 'tx1',
      description: 'Supermercado Pão de Açúcar',
      amount: 150.0,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-08-01',
      accountId: 'main',
    },
    {
      id: 'tx2',
      description: 'Supermercado Pão de Açúcar',
      amount: 210.0,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-08-03',
      accountId: 'main',
    },
    {
      id: 'tx3',
      description: 'Posto Shell Combustível',
      amount: 80.0,
      type: 'expense',
      category: 'Transporte',
      date: '2026-08-04',
      accountId: 'main',
    },
  ];

  it('should predict category based on exact user history match', () => {
    const result = predictCategory('Supermercado Pão de Açúcar', 'expense', mockHistory);
    expect(result.category).toBe('Alimentação');
    expect(result.source).toBe('history_exact');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('should predict category based on fuzzy keyword match from user history', () => {
    const result = predictCategory('Pão de Açúcar Bairro', 'expense', mockHistory);
    expect(result.category).toBe('Alimentação');
    expect(result.source).toBe('history_fuzzy');
  });

  it('should fallback to rule engine for unknown descriptions', () => {
    const result = predictCategory('Farmácia Drogasil', 'expense', mockHistory);
    expect(result.category).toBe('Saúde');
    expect(result.source).toBe('rule_engine');
  });

  it('should extract learned vendor mappings', () => {
    const mappings = getLearnedVendorMappings(mockHistory);
    expect(mappings.length).toBeGreaterThan(0);
    expect(mappings[0].category).toBe('Alimentação');
  });
});
