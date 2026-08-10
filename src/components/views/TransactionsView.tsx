import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Trash2,
  Paperclip,
  PiggyBank,
  AlertCircle,
  FileText,
  Upload,
} from 'lucide-react';
import { AppState, Transaction, TransactionType } from '../../types';
import { fmt, formatDate, calculateAccountBalance } from '../../utils/formatters';
import { TransactionModal } from '../TransactionModal';
import { ImportStatementModal } from '../ImportStatementModal';
import { ZeroTransactionsOnboarding } from '../ZeroTransactionsOnboarding';

interface TransactionsViewProps {
  state: AppState;
  onAddTransaction: (tx: Omit<Transaction, 'id'>, installments?: number) => void;
  onBatchImportTransactions?: (transactions: Omit<Transaction, 'id'>[]) => void;
  onDeleteTransaction: (id: string) => void;
  onContributeToGoal?: (goalId: string, amount: number, accountId: string, date?: string) => void;
  onContributeToInvestment?: (id: string, amount: number, accountId: string, date: string) => void;
  onResetData?: () => void;
  onNavigateToAccounts?: () => void;
}

const accountName = (id: string, accounts: any[]) => accounts.find((a) => a.id === id)?.name || 'Conta';

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  state,
  onAddTransaction,
  onBatchImportTransactions,
  onDeleteTransaction,
  onContributeToGoal,
  onContributeToInvestment,
  onResetData,
  onNavigateToAccounts,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

  // Dashboard Metrics
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { monthIncome, monthExpense } = useMemo(() => {
    const currentMonthTx = state.transactions.filter((t) => t.date.startsWith(currentMonth));
    const income = currentMonthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = currentMonthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { monthIncome: income, monthExpense: expense };
  }, [state.transactions, currentMonth]);

  // Sorting and Filtering
  const sorted = useMemo(() => {
    return [...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions]);

  const runningBalance = state.accounts.reduce((sum, acc) => sum + calculateAccountBalance(acc.id, state), 0);

  const filtered = sorted.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterTag !== 'all' && !(t.tags || []).includes(filterTag)) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [t.description, t.category, ...(t.tags || [])].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const handleBatchImport = (txs: Omit<Transaction, 'id'>[]) => {
    if (onBatchImportTransactions) {
      onBatchImportTransactions(txs);
    } else {
      txs.forEach((tx) => onAddTransaction(tx));
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Zero Transactions Interactive Onboarding */}
      {state.transactions.length === 0 && (
        <ZeroTransactionsOnboarding
          onOpenImportModal={() => setShowImportModal(true)}
          onOpenAddTransactionModal={() => setShowAddModal(true)}
          onLoadSampleData={onResetData}
          onNavigateToAccounts={onNavigateToAccounts}
        />
      )}

      {/* Dashboard Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Receitas</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">{fmt(monthIncome)}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-rose-400">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Despesas</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">{fmt(monthExpense)}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-blue-400">
            <PiggyBank className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Investimentos</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {fmt(state.investments.reduce((sum, inv) => sum + inv.current, 0))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Total</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">{fmt(runningBalance)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            Importar Extrato
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="hidden md:flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        state={state}
        onAddTransaction={onAddTransaction}
        onContributeToGoal={onContributeToGoal}
        onContributeToInvestment={onContributeToInvestment}
      />

      <ImportStatementModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        accounts={state.accounts}
        existingTransactions={state.transactions}
        onImportTransactions={handleBatchImport}
      />

      {/* Transactions List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 border-dashed rounded-xl space-y-3">
            <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-400 font-medium">Nenhuma transação encontrada.</p>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar Extrato Bancário (.OFX / .CSV)
            </button>
          </div>
        ) : (
          filtered.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-100">{t.description}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {t.category}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <PiggyBank className="w-3 h-3" /> {accountName(t.accountId, state.accounts)}
                    </span>
                    <span className="text-[10px] text-slate-500">{formatDate(t.date)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className="flex gap-1">
                  {t.tags?.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                      #{tag}
                    </span>
                  ))}
                  {t.attachment && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-blue-400 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div
                  className={`font-mono font-bold text-right ${
                    t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {t.type === 'income' ? '+' : '-'} {fmt(t.amount)}
                </div>

                <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onDeleteTransaction(t.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
