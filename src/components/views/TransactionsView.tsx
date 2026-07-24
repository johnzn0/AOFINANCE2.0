import React, { useState } from 'react';
import { Plus, Search, Trash2, Paperclip, Filter, Check, FileText } from 'lucide-react';
import { AppState, Transaction, TransactionType } from '../../types';
import { fmt, formatDate, accountName, round2, todayISO } from '../../utils/formatters';

interface TransactionsViewProps {
  state: AppState;
  onAddTransaction: (tx: Omit<Transaction, 'id'>, installments?: number) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  state,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(state.settings.categories[0] || 'Outros');
  const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState('2');
  const [tagsStr, setTagsStr] = useState('');
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    dataUrl: string;
  } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem ou documento deve ser menor que 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        type: file.type,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onAddTransaction(
      {
        date: date || todayISO(),
        type,
        category,
        description: description.trim() || category,
        amount: val,
        accountId: accountId || state.accounts[0]?.id || 'acc-1',
        tags,
        attachment,
      },
      isInstallment ? Math.max(2, parseInt(installments) || 2) : 1
    );

    // Reset form
    setDescription('');
    setAmount('');
    setTagsStr('');
    setAttachment(null);
    setIsInstallment(false);
  };

  // Collect unique tags
  const allTagsSet = new Set<string>();
  state.transactions.forEach((t) => (t.tags || []).forEach((tag) => allTagsSet.add(tag)));
  const allTags = Array.from(allTagsSet).sort();

  // Process list with running balance
  const sortedAsc = [...state.transactions].sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  const withRunningBalance = sortedAsc.map((t) => {
    running += t.type === 'income' ? t.amount : -t.amount;
    return { ...t, runningBalance: running };
  });

  const filtered = withRunningBalance
    .filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterTag !== 'all' && !(t.tags || []).includes(filterTag)) return false;
      if (search) {
        const query = search.toLowerCase();
        const haystack = [t.description, t.category, ...(t.tags || [])].join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-serif font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-400" />
          <span>Lançar Nova Transação</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type selector */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Tipo
              </label>
              <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-1.5 rounded transition ${
                    type === 'expense'
                      ? 'bg-rose-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-1.5 rounded transition ${
                    type === 'income'
                      ? 'bg-emerald-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Receita
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-semibold"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {state.settings.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Descrição
              </label>
              <input
                type="text"
                placeholder="Ex.: Supermercado, Salário, Farmácia"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Account */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Conta
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {state.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            {/* Tags */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                placeholder="Ex.: casa, viagem, fixo"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Installments & Attachment */}
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(e) => setIsInstallment(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-0"
                />
                <span>Parcelar?</span>
              </label>

              {isInstallment && (
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                />
              )}

              <label className="flex items-center gap-1 cursor-pointer text-slate-400 hover:text-blue-400 transition ml-auto">
                <Paperclip className="w-3.5 h-3.5" />
                <span className="text-[11px] truncate max-w-[90px]">
                  {attachment ? attachment.name : 'Anexo'}
                </span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
              </label>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-blue-600/20"
              >
                Lançar Transação
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar por descrição, categoria ou tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas as categorias</option>
            {state.settings.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas as tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] bg-slate-950/40">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4">Conta</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-right">Saldo</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Nenhuma transação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-100">{t.description}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(t.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {accountName(t.accountId, state.accounts)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-semibold whitespace-nowrap ${
                        t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'} {fmt(t.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400 whitespace-nowrap">
                      {fmt(t.runningBalance)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {t.attachment && (
                          <a
                            href={t.attachment.dataUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                            title={`Ver anexo: ${t.attachment.name}`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Excluir transação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
