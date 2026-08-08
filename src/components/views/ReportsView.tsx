import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, DollarSign, Award, Tag as TagIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { AppState } from '../../types';
import { fmt, getCatColor } from '../../utils/formatters';

interface ReportsViewProps {
  state: AppState;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ state }) => {
  const { 
    allTx, totalIncome, totalExpense, netProfit, 
    highestExpense, highestIncome, 
    monthsData, catTotalSum, catEntries, tagEntries 
  } = useMemo(() => {
    const allTx = state.transactions;
    const totalIncome = allTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netProfit = totalIncome - totalExpense;

    const highestExpense = [...allTx].filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0];
    const highestIncome = [...allTx].filter(t => t.type === 'income').sort((a, b) => b.amount - a.amount)[0];

    const now = new Date();
    const monthsData = [];
    const currentInvTotal = state.investments.reduce((s, i) => s + i.current, 0);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
      const bankBalanceUpTo = allTx.filter(t => t.date <= endOfMonth).reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      monthsData.push({ label, Patrimonio: bankBalanceUpTo + currentInvTotal });
    }

    const catTotals: Record<string, number> = {};
    allTx.filter(t => t.type === 'expense').forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });
    const catTotalSum = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1;
    const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

    const tagTotals: Record<string, number> = {};
    allTx.filter(t => t.type === 'expense').forEach(t => {
      (t.tags || []).forEach(tag => {
        tagTotals[tag] = (tagTotals[tag] || 0) + t.amount;
      });
    });
    const tagEntries = Object.entries(tagTotals).sort((a, b) => b[1] - a[1]);

    return { allTx, totalIncome, totalExpense, netProfit, highestExpense, highestIncome, monthsData, catTotalSum, catEntries, tagEntries };
  }, [state.transactions, state.investments]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Lucro Líquido Histórico
          </span>
          <span
            className={`text-2xl font-mono font-bold ${
              netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {fmt(netProfit)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Maior Gasto do Histórico
          </span>
          <span className="text-2xl font-mono font-bold text-rose-400">
            {highestExpense ? fmt(highestExpense.amount) : '—'}
          </span>
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {highestExpense ? highestExpense.description : 'Sem despesas'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Maior Receita Registrada
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-400">
            {highestIncome ? fmt(highestIncome.amount) : '—'}
          </span>
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {highestIncome ? highestIncome.description : 'Sem receitas'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Total Transações Lançadas
          </span>
          <span className="text-2xl font-mono font-bold text-blue-400">
            {allTx.length}
          </span>
        </div>
      </div>

      {/* Net Worth Growth Area Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span>Evolução Patrimonial (Últimos 6 Meses)</span>
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: number) => fmt(val)}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="Patrimonio"
                stroke="#3B82F6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorNetWorth)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category & Tag Distributions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-serif font-bold text-white">
            Gastos por Categoria (Histórico Completo)
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {catEntries.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nenhum gasto registrado.</p>
            ) : (
              catEntries.map(([cat, val]) => {
                const pct = Math.round((val / catTotalSum) * 100);
                return (
                  <div key={cat} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>{cat}</span>
                      <span className="font-mono">{fmt(val)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: getCatColor(cat),
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tag Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-blue-400" />
            <span>Gastos por Tag (#)</span>
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {tagEntries.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Nenhuma transação com tag associada.
              </p>
            ) : (
              tagEntries.map(([tag, val]) => (
                <div key={tag} className="flex justify-between items-center text-xs p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <span className="text-blue-400 font-medium">#{tag}</span>
                  <span className="font-mono text-slate-200 font-semibold">{fmt(val)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
