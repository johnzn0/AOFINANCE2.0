import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Crown, Sparkles, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
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
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-serif font-bold text-white mb-1 flex items-center gap-3">
          Simulador 
          <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
            <Crown className="w-3 h-3 text-amber-400" /> Pro
          </span>
        </h2>
        <p className="text-slate-400 text-sm">Projete o crescimento do seu patrimônio com juros compostos</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Form & KPIs */}
        <div className="xl:col-span-1 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" /> Parâmetros
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Valor Inicial (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={initial}
                  onChange={(e) => setInitial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Aporte Mensal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Taxa de Juros (% ao ano)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500 outline-none transition"
                />
                
                {/* Rate Quick Presets */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setRate(p.val)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition ${
                        rate === p.val
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Período (Anos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Chart & Results */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* KPI Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-slate-700 transition">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Valor Total
              </span>
              <span className="text-3xl font-mono font-bold text-amber-400">
                {fmt(finalTotal)}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-slate-700 transition">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Valor Investido
              </span>
              <span className="text-3xl font-mono font-bold text-slate-100">
                {fmt(finalInvested)}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-slate-700 transition">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Total em Juros
              </span>
              <span className="text-3xl font-mono font-bold text-emerald-400">
                +{fmt(finalInterest)}
              </span>
            </div>
          </div>

          {/* Recharts Area Growth Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Projeção de Crescimento
            </h3>

            <div className="h-[400px] w-full">
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
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="ano" stroke="#94A3B8" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={12}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    axisLine={false} 
                    tickLine={false}
                    tickMargin={10}
                  />
                  <Tooltip
                    formatter={(val: number) => fmt(val)}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '13px',
                      padding: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ paddingBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '13px', color: '#94A3B8', paddingTop: '20px' }} iconType="circle" />
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
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorInv)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3 text-slate-400 text-sm">
               <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
               <p>
                 Esta é uma simulação matemática de juros compostos baseada em taxas fixas irreais para o mercado de renda variável, e não considera inflação ou impostos. Utilize apenas como referência educacional.
               </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
