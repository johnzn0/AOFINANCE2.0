import { AppState, Transaction, Account } from '../types';

export const fmt = (n: number): string => {
  const isNeg = n < 0;
  const absVal = Math.abs(n);
  const formatted = absVal.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNeg ? '-' : ''}R$ ${formatted}`;
};

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const monthKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const monthLabel = (d: Date): string => {
  const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const formatDate = (isoStr: string): string => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length < 3) return isoStr;
  return `${parts[2]}/${parts[1]}`;
};

export const formatDateFull = (isoStr: string): string => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length < 3) return isoStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export const addMonths = (dateStr: string, n: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1 + n, d);
  return targetDate.toISOString().slice(0, 10);
};

export const accountName = (id: string, accounts: Account[]): string => {
  if (!Array.isArray(accounts)) return 'Conta Principal';
  const acc = accounts.find((a) => a.id === id);
  return acc ? acc.name : 'Conta Principal';
};

export const calculateAccountBalance = (accountId: string, state: AppState): number => {
  let bal = 0;
  const fallbackAccId = state.accounts[0]?.id || 'acc-1';
  state.transactions.forEach((t) => {
    if ((t.accountId || fallbackAccId) === accountId) {
      bal += t.type === 'income' ? t.amount : -t.amount;
    }
  });
  state.transfers.forEach((tr) => {
    if (tr.fromId === accountId) bal -= tr.amount;
    if (tr.toId === accountId) bal += tr.amount;
  });
  return bal;
};

export const DEFAULT_CATEGORIES = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Lazer',
  'Educação',
  'Assinaturas',
  'Compras',
  'Salário',
  'Freelance',
  'Resgate de Investimento',
  'Cartão de crédito',
  'Poupança/Metas',
  'Outros',
];

export const DEFAULT_INV_TYPES = [
  'Renda Fixa',
  'Ações',
  'Fundos Imobiliários',
  'Criptomoedas',
  'Fundos',
  'Reserva de Emergência',
  'Outros',
];

const PALETTE = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#A855F7',
];

export const getCatColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};
