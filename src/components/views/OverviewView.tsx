import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle,
  Sparkles,
  Bot,
  Activity,
  CreditCard,
  Target,
  Clock, PieChart as PieChartIcon
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AppState, TabPage, Transaction, Goal } from '../../types';
import { fmt, monthKey, getCatColor, formatDate, todayISO } from '../../utils/formatters';

interface OverviewViewProps {
  state: AppState;
  cursor: Date;
  onSelectPage: (page: TabPage) => void;
  onOpenGoalContrib: (goalId: string) => void;
  onOpenAssistant?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  state,
  cursor,
  onSelectPage,
  onOpenGoalContrib,
  onOpenAssistant,
}) => {
  const curKey = monthKey(cursor);
  
  const { monthTx, income, expense, monthBalance, totalBalanceInBank, top3Cats, emergencyPct } = useMemo(() => {
    const txs = state.transactions.filter((t) => t.date.slice(0, 7) === curKey);
    
    let inc = 0;
    let exp = 0;
    const catExp: Record<string, number> = {};
    
    txs.forEach(t => {
      if (t.type === 'income') {
        inc += t.amount;
      } else {
        exp += t.amount;
        catExp[t.category] = (catExp[t.category] || 0) + t.amount;
      }
    });

    const bal = inc - exp;

    const totalBal = state.transactions.reduce(
      (s, t) => s + (t.type === 'income' ? t.amount : -t.amount),
      0
    );

    const donut = Object.entries(catExp)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const emgGoal = state.goals.find(g => g.kind === 'reserva');
    const emgPct = emgGoal && emgGoal.target > 0 
        ? Math.min(100, Math.round((emgGoal.saved / emgGoal.target) * 100)) 
        : 0;

    return {
      monthTx: txs,
      income: inc,
      expense: exp,
      monthBalance: bal,
      totalBalanceInBank: totalBal,
      top3Cats: donut.slice(0, 3),
      emergencyPct: emgPct
    };
  }, [state.transactions, state.goals, curKey]);

  // Upcoming Bills (Cards and Recurring)
  const now = new Date();
  const todayNum = now.getDate();
  const isCurrentMonth = curKey === monthKey(now);
  
  const upcomingBills = useMemo(() => {
    const bills = [];
    if (isCurrentMonth) {
        state.recurringBills.filter(b => b.active && b.day >= todayNum).forEach(b => {
           bills.push({ id: b.id, name: b.name, amount: b.amount, day: b.day, type: 'recurring', category: b.category });
        });
        state.cards.forEach(c => {
           if (c.dueDay >= todayNum) {
               const currentMonthStr = todayISO().slice(0, 7);
               const currentInvoice = state.cardPurchases.filter(p => p.cardId === c.id && p.date.startsWith(currentMonthStr)).reduce((s, p) => s + p.amount, 0);
               if (currentInvoice > 0) {
                  bills.push({ id: c.id, name: `Fatura ${c.name}`, amount: currentInvoice, day: c.dueDay, type: 'card', category: 'Cartão de Crédito' });
               }
           }
        });
    }
    return bills.sort((a, b) => a.day - b.day).slice(0, 4);
  }, [state, isCurrentMonth, todayNum]);

  // Chart View mode state: 'acc' (Acumulado) vs 'daily' (Diário)
  const [chartMode, setChartMode] = React.useState<'acc' | 'daily'>('acc');

  // Daily Expenses for Area Chart
  const dailyExpenses = useMemo(() => {
    if (monthTx.length === 0) return [];
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const data = [];
    let acc = 0;
    const limitDay = isCurrentMonth ? Math.min(todayNum, daysInMonth) : daysInMonth;

    for (let i = 1; i <= limitDay; i++) {
       const dateStr = `${curKey}-${i.toString().padStart(2, '0')}`;
       const dayTxs = monthTx.filter(t => t.type === 'expense' && t.date === dateStr);
       const dayTotal = dayTxs.reduce((s, t) => s + t.amount, 0);
       acc += dayTotal;
       data.push({ 
         day: i, 
         label: `Dia ${i}`,
         dateStr, 
         amount: dayTotal, 
         acc 
       });
    }
    return data;
  }, [monthTx, cursor, curKey, isCurrentMonth, todayNum]);

  // Chart statistics
  const chartStats = useMemo(() => {
    if (dailyExpenses.length === 0) return { totalAcc: 0, avgDaily: 0, maxDay: null };
    const totalAcc = dailyExpenses[dailyExpenses.length - 1]?.acc || 0;
    const avgDaily = totalAcc / dailyExpenses.length;
    let maxDayItem = dailyExpenses[0];
    for (const d of dailyExpenses) {
      if (d.amount > (maxDayItem?.amount || 0)) {
        maxDayItem = d;
      }
    }
    return {
      totalAcc,
      avgDaily,
      maxDay: maxDayItem && maxDayItem.amount > 0 ? maxDayItem : null
    };
  }, [dailyExpenses]);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Welcome & AI Banner */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
         <div>
           <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
             Olá, {state.settings.profileName || 'usuário'} 👋
           </h1>
           <p className="text-slate-400 text-sm mt-1">Aqui está o resumo financeiro de {cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.</p>
         </div>
         {onOpenAssistant && (
           <button
             onClick={onOpenAssistant}
             className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
           >
             <Sparkles className="w-4 h-4" />
             AI Assistant
           </button>
         )}
      </div>

      {/* Top Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Saldo Geral</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-mono font-bold text-white mb-1">{fmt(totalBalanceInBank)}</h3>
            <p className="text-xs text-slate-500">Total em contas</p>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Receitas do Mês</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-mono font-bold text-emerald-400 mb-1">{fmt(income)}</h3>
            <p className="text-xs text-slate-500">Entradas projetadas</p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Despesas do Mês</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-mono font-bold text-rose-400 mb-1">{fmt(expense)}</h3>
            <p className="text-xs text-slate-500">Saídas consolidadas</p>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Charts & Insights (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Expenses Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" /> Curva de Gastos
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {chartMode === 'acc' ? 'Evolução acumulada das despesas ao longo do mês' : 'Gastos diários individuais do mês'}
                </p>
              </div>

              {/* Mode Selector Buttons */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartMode('acc')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    chartMode === 'acc'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Acumulado
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('daily')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    chartMode === 'daily'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Diário
                </button>
              </div>
            </div>

            {/* Chart Summary Stats Bar */}
            {dailyExpenses.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Acumulado</span>
                  <span className="text-sm font-mono font-bold text-rose-400">{fmt(chartStats.totalAcc)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Média Diária</span>
                  <span className="text-sm font-mono font-bold text-slate-200">{fmt(chartStats.avgDaily)}</span>
                </div>
                {chartStats.maxDay && (
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Maior Gasto (Dia {chartStats.maxDay.day})</span>
                    <span className="text-sm font-mono font-bold text-amber-400">{fmt(chartStats.maxDay.amount)}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="h-64 w-full">
              {dailyExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyExpenses} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      stroke="#64748B" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `Dia ${val}`}
                    />
                    <YAxis 
                      stroke="#64748B" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs shadow-xl space-y-1">
                              <p className="font-bold text-white border-b border-slate-800 pb-1">Dia {data.day}</p>
                              <div className="flex justify-between gap-4 text-slate-300">
                                <span>Gasto do dia:</span>
                                <span className="font-mono font-bold text-blue-400">{fmt(data.amount)}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-slate-300">
                                <span>Acumulado:</span>
                                <span className="font-mono font-bold text-rose-400">{fmt(data.acc)}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={chartMode === 'acc' ? 'acc' : 'amount'}
                      name={chartMode === 'acc' ? 'Acumulado' : 'Gasto Diário'}
                      stroke={chartMode === 'acc' ? '#F43F5E' : '#3B82F6'}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill={chartMode === 'acc' ? 'url(#colorAcc)' : 'url(#colorDaily)'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 border border-slate-800 border-dashed rounded-xl bg-slate-900/50 p-6 text-center">
                  <Activity className="w-8 h-8 mb-2 opacity-50 text-rose-400" />
                  <p className="text-xs font-semibold text-slate-300">Nenhum gasto registrado este mês.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">As despesas do mês aparecerão aqui em formato gráfico.</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Categories Row */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
             <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-amber-400" /> Maiores Despesas
                </h3>
             </div>
             
             {top3Cats.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 {top3Cats.map((cat, i) => (
                   <div key={cat.name} className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl relative overflow-hidden group hover:border-slate-700 transition">
                      <div className="absolute left-0 top-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: getCatColor(cat.name) }}></div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-slate-300 truncate pr-2">{cat.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">#{i + 1}</span>
                      </div>
                      <p className="text-lg font-mono font-bold text-white">{fmt(cat.value)}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{Math.round((cat.value / expense) * 100)}% do total</p>
                   </div>
                 ))}
               </div>
             ) : (
                <p className="text-xs text-slate-500 text-center py-6">Não há despesas para categorizar.</p>
             )}
          </div>

        </div>

        {/* Right Col: Widgets (1/3 width) */}
        <div className="space-y-6">
          
          {/* Emergency Fund Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group cursor-pointer hover:border-slate-700 transition" onClick={() => onSelectPage('goals')}>
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Target className="w-16 h-16 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2 mb-1 relative z-10">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Reserva de Emergência</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-4 relative z-10">Progresso do seu colchão financeiro</p>
            
            {emergencyPct !== undefined && state.goals.find(g => g.kind === 'reserva') ? (
              <div className="relative z-10">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-mono font-bold text-emerald-400">{emergencyPct}%</span>
                  <span className="text-xs text-slate-400 mb-1">{fmt(state.goals.find(g => g.kind === 'reserva')?.saved || 0)}</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full" 
                    style={{ width: `${emergencyPct}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 mt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 border-dashed text-center">
                <p className="text-xs text-slate-400">Você ainda não definiu uma reserva.</p>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">Criar agora &rarr;</span>
              </div>
            )}
          </div>

          {/* Upcoming Bills Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Faturas a Vencer
              </h3>
              <button onClick={() => onSelectPage('calendar')} className="text-xs text-slate-400 hover:text-white transition flex items-center">
                Ver calendário <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingBills.length > 0 ? (
                upcomingBills.map((b, i) => (
                  <div key={b.id + i} className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:bg-slate-800/50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${b.type === 'card' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                         {b.type === 'card' ? <CreditCard className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{b.name}</p>
                        <p className="text-[10px] text-slate-400">Dia {b.day} · {b.category}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-400">{fmt(b.amount)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 px-4 bg-slate-950/30 rounded-xl border border-slate-800/50 border-dashed">
                   <CheckCircle className="w-6 h-6 text-emerald-500/50 mx-auto mb-2" />
                   <p className="text-xs text-slate-400">Tudo em dia para o resto do mês!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
