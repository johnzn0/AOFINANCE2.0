import React, { useState } from 'react';
import { TrendingUp, Plus, Trash2, Edit2, ArrowUpRight } from 'lucide-react';
import { AppState, Investment } from '../../types';
import { fmt, round2 } from '../../utils/formatters';

interface InvestmentsViewProps {
  state: AppState;
  onAddInvestment: (inv: Omit<Investment, 'id' | 'date'>, accountId?: string) => void;
  onUpdateInvestment: (id: string, updated: Partial<Investment>) => void;
  onDeleteInvestment: (id: string) => void;
  onOpenWithdrawModal: (id: string) => void;
}

export const InvestmentsView: React.FC<InvestmentsViewProps> = ({
  state,
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  onOpenWithdrawModal,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState(state.settings.investmentTypes[0] || 'Renda Fixa');
  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');
  const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');

  const totalInvested = state.investments.reduce((s, i) => s + i.invested, 0);
  const totalCurrent = state.investments.reduce((s, i) => s + i.current, 0);
  const totalReturn = totalCurrent - totalInvested;
  const returnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invVal = parseFloat(invested);
    const curVal = parseFloat(current);
    if (!name.trim() || !invVal || invVal <= 0 || isNaN(curVal)) return;

    if (editingId) {
      onUpdateInvestment(editingId, {
        name: name.trim(),
        type,
        invested: invVal,
        current: curVal,
      });
      setEditingId(null);
    } else {
      onAddInvestment({
        name: name.trim(),
        type,
        invested: invVal,
        current: curVal,
      }, accountId);
    }

    setName('');
    setInvested('');
    setCurrent('');
  };

  const handleEdit = (inv: Investment) => {
    setEditingId(inv.id);
    setName(inv.name);
    setType(inv.type);
    setInvested(String(inv.invested));
    setCurrent(String(inv.current));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setInvested('');
    setCurrent('');
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Total Investido (Custo)
          </span>
          <span className="text-2xl font-mono font-bold text-slate-200">
            {fmt(totalInvested)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Valor Atual da Carteira
          </span>
          <span className="text-2xl font-mono font-bold text-amber-400">
            {fmt(totalCurrent)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Rentabilidade Acumulada
          </span>
          <span
            className={`text-2xl font-mono font-bold ${
              totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalReturn >= 0 ? '+' : ''}
            {fmt(totalReturn)} ({returnPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-serif font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span>{editingId ? 'Editar Ativo' : 'Novo Ativo na Carteira'}</span>
        </h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
              Nome do Ativo
            </label>
            <input
              type="text"
              placeholder="Ex.: Tesouro Selic 2029, WEGE3, HGLG11"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
            >
              {state.settings.investmentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
              Investido (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={invested}
              onChange={(e) => setInvested(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
              Valor Atual (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
            />
          </div>
          {!editingId && (
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                Conta de Origem
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
              >
                {state.accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="sm:col-span-full flex justify-end gap-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md shadow-blue-600/20"
            >
              {editingId ? 'Salvar Alterações' : 'Adicionar Ativo'}
            </button>
          </div>
        </form>
      </div>

      {/* Portfolio Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-serif font-bold text-white">Sua Carteira de Ativos</h3>

        {state.investments.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
            Nenhum ativo cadastrado. Adicione seu primeiro investimento acima.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.investments.map((inv) => {
              const gain = inv.current - inv.invested;
              const gainPct = inv.invested > 0 ? (gain / inv.invested) * 100 : 0;

              return (
                <div
                  key={inv.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {inv.type}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(inv)}
                          className="p-1 text-slate-500 hover:text-slate-300 transition"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteInvestment(inv.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-serif font-bold text-base text-white">{inv.name}</h4>

                    <div className="space-y-1 text-xs pt-2">
                      <div className="flex justify-between text-slate-400">
                        <span>Investido (Custo):</span>
                        <span className="font-mono text-slate-200">{fmt(inv.invested)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Valor Atual:</span>
                        <span className="font-mono text-amber-400 font-semibold">
                          {fmt(inv.current)}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400">Resultado:</span>
                        <span
                          className={`font-mono ${
                            gain >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {gain >= 0 ? '+' : ''}
                          {fmt(gain)} ({gainPct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenWithdrawModal(inv.id)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <span>Resgatar para Uso</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
