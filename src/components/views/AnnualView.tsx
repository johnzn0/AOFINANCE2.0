import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, PieChart as PieIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AppState } from '../../types';
import { fmt, getCatColor } from '../../utils/formatters';

interface AnnualViewProps {
  state: AppState;
}

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export const AnnualView: React.FC<AnnualViewProps> = ({ state }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const yearTx = state.transactions.filter(
    (t) => t.date.slice(0, 4) === String(selectedYear)
  );

  const yearIncome = yearTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const yearExpense = yearTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const yearBalance = yearIncome - yearExpense;

  const totalBankAllTime = state.transactions
    .filter((t) => t.date.slice(0, 4) <= String(selectedYear))
    .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

  const totalInvestedCurrent = state.investments.reduce((s, i) => s + i.current, 0);
  const netWorthAtYear = totalBankAllTime + totalInvestedCurrent;

  // Monthly breakdown for Recharts BarChart
  const monthlyData = MONTH_NAMES.map((name, idx) => {
    const moStr = String(idx + 1).padStart(2, '0');
    const mtx = yearTx.filter((t) => t.date.slice(5, 7) === moStr);
    const inc = mtx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = mtx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return {
      month: name,
      Receitas: inc,
      Despesas: exp,
      Saldo: inc - exp,
    };
  });

  // Annual expenses by category
  const expensesByCat: Record<string, number> = {};
  yearTx
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expensesByCat[t.category] = (expensesByCat[t.category] || 0) + t.amount;
    });

  const donutData = Object.entries(expensesByCat)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Year Selector Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-400" />
          <h3 className="font-serif font-bold text-white text-base">Balanço do Ano</h3>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-1 text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono font-bold text-slate-200 px-3">{selectedYear}</span>
          <button
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-1 text-slate-400 hover:text-white transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Receitas em {selectedYear}
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-400">
            {fmt(yearIncome)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Despesas em {selectedYear}
          </span>
          <span className="text-2xl font-mono font-bold text-rose-400">
            {fmt(yearExpense)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Saldo Líquido do Ano
          </span>
          <span
            className={`text-2xl font-mono font-bold ${
              yearBalance >= 0 ? 'text-blue-400' : 'text-rose-400'
            }`}
          >
            {fmt(yearBalance)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Patrimônio Acumulado
          </span>
          <span className="text-2xl font-mono font-bold text-amber-400">
            {fmt(netWorthAtYear)}
          </span>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-serif font-bold text-white">
          Evolução Mensal (Receitas vs Despesas)
        </h3>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => fmt(value)}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
              <Bar dataKey="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-serif font-bold text-white mb-4">
            Distribuição de Gastos do Ano
          </h3>

          {donutData.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">
              Nenhuma despesa registrada no ano de {selectedYear}.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.name} fill={getCatColor(entry.name)} />
                    ))}
                  </Pie>
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
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Investment breakdown by asset class */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-serif font-bold text-white">
            Alocação da Carteira de Investimentos
          </h3>

          {state.investments.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">
              Nenhum investimento cadastrado.
            </p>
          ) : (
            <div className="space-y-3">
              {state.investments.map((inv) => {
                const pct =
                  totalInvestedCurrent > 0
                    ? Math.round((inv.current / totalInvestedCurrent) * 100)
                    : 0;
                return (
                  <div key={inv.id} className="text-xs space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span className="font-medium">{inv.name} ({inv.type})</span>
                      <span className="font-mono text-amber-400">{fmt(inv.current)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
