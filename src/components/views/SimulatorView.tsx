import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Crown, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { fmt, round2 } from '../../utils/formatters';

export const SimulatorView: React.FC = () => {
  const [initial, setInitial] = useState('1000');
  const [monthly, setMonthly] = useState('500');
  const [rate, setRate] = useState('10.5'); // Annual %
  const [years, setYears] = useState('15');

  const presets = [
    { label: 'Poupança (~6%)', val: '6.0' },
    { label: 'Tesouro Selic (~10.5%)', val: '10.5' },
    { label: 'CDB 100% CDI (~10.4%)', val: '10.4' },
    { label: 'Ações / FIIs (~12%)', val: '12.0' },
  ];

  const initVal = Math.max(0, parseFloat(initial) || 0);
  const monthVal = Math.max(0, parseFloat(monthly) || 0);
  const rateVal = Math.max(0, parseFloat(rate) || 0);
  const yearVal = Math.min(50, Math.max(1, parseInt(years) || 1));

  const monthlyRate = Math.pow(1 + rateVal / 100, 1 / 12) - 1;

  let balance = initVal;
  let invested = initVal;

  const chartData = [];

  for (let m = 1; m <= yearVal * 12; m++) {
    balance = balance * (1 + monthlyRate) + monthVal;
    invested += monthVal;

    if (m % 12 === 0) {
      const yearNum = m / 12;
      chartData.push({
        ano: `Ano ${yearNum}`,
        Investido: round2(invested),
        'Total com Juros': round2(balance),
        Juros: round2(balance - invested),
      });
    }
  }

  const finalTotal = chartData.length ? chartData[chartData.length - 1]['Total com Juros'] : balance;
  const finalInvested = chartData.length ? chartData[chartData.length - 1]['Investido'] : invested;
  const finalInterest = finalTotal - finalInvested;

  return (
    <div className="space-y-6">
      {/* Simulation Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-400" />
            <span>Simulador de Juros Compostos & Projeção</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-400" /> FERRAMENTA PRO
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
              Valor Inicial (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
              Aporte Mensal (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
              Taxa de Juros (% ao ano)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
              Período (Anos)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-semibold"
            />
          </div>
        </div>

        {/* Rate Quick Presets */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-semibold shrink-0">Taxas de Referência:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setRate(p.val)}
              className={`px-2.5 py-1 rounded-lg border font-medium transition shrink-0 ${
                rate === p.val
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stub Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Valor Total Acumulado
          </span>
          <span className="text-2xl font-mono font-bold text-amber-400">
            {fmt(finalTotal)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Total do Seu Bolso (Investido)
          </span>
          <span className="text-2xl font-mono font-bold text-slate-200">
            {fmt(finalInvested)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Total Ganho em Juros
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-400">
            +{fmt(finalInterest)}
          </span>
        </div>
      </div>

      {/* Recharts Area Growth Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span>Curva de Crescimento com Juros Compostos</span>
        </h3>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="ano" stroke="#64748B" fontSize={11} />
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
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
              <Area
                type="monotone"
                dataKey="Total com Juros"
                stroke="#F59E0B"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
              <Area
                type="monotone"
                dataKey="Investido"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInv)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
