import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle,
  Sparkles,
  Bot,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { AppState, TabPage, Transaction } from '../../types';
import { fmt, monthKey, getCatColor, formatDate } from '../../utils/formatters';

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
  const monthTx = state.transactions.filter((t) => t.date.slice(0, 7) === curKey);

  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthBalance = income - expense;

  const totalBalanceInBank = state.transactions.reduce(
    (s, t) => s + (t.type === 'income' ? t.amount : -t.amount),
    0
  );
  const investedTotalCost = state.investments.reduce((s, i) => s + i.invested, 0);
  const investedTotalCurrent = state.investments.reduce((s, i) => s + i.current, 0);
  const netWorth = totalBalanceInBank + investedTotalCurrent;

  const savingsRate = income > 0 ? Math.round((monthBalance / income) * 100) : 0;

  const expensesSorted = monthTx
    .filter((t) => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount);
  const topExpense = expensesSorted[0];

  const now = new Date();
  const isCurrentMonth = curKey === monthKey(now);
  const todayNum = now.getDate();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const elapsedDays = isCurrentMonth ? Math.max(1, todayNum) : daysInMonth;
  const dailyAverage = expense > 0 ? expense / elapsedDays : 0;
  const endOfMonthProjection = isCurrentMonth ? income - dailyAverage * daysInMonth : null;

  // Donut chart data
  const expensesByCat: Record<string, number> = {};
  monthTx
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expensesByCat[t.category] = (expensesByCat[t.category] || 0) + t.amount;
    });

  const donutData = Object.entries(expensesByCat)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Financial Insights / Intelligence logic
  const alerts: string[] = [];
  const insights: string[] = [];

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  state.recurringBills
    .filter((b) => b.active && b.day === tomorrow.getDate())
    .forEach((b) => {
      alerts.push(`Conta "${b.name}" (${fmt(b.amount)}) vence amanhã.`);
    });

  state.cards.forEach((card) => {
    const diff = card.dueDay - now.getDate();
    if (diff >= 0 && diff <= 4) {
      const pending = state.cardPurchases
        .filter((p) => p.cardId === card.id && !p.paid)
        .reduce((s, p) => s + p.amount, 0);
      if (pending > 0) {
        alerts.push(
          `A fatura do cartão ${card.name} vence ${
            diff === 0 ? 'hoje' : `em ${diff} dia(s)`
          } — Total em aberto: ${fmt(pending)}.`
        );
      }
    }
  });

  if (income > 0) {
    const spentPct = Math.round((expense / income) * 100);
    if (spentPct >= 80) {
      alerts.push(`Você já utilizou ${spentPct}% da sua renda total este mês.`);
    } else if (spentPct <= 50 && monthTx.length > 3) {
      insights.push(
        `Ótima gestão! Você comprometeu apenas ${spentPct}% da sua renda até agora.`
      );
    }
  }

  if (investedTotalCurrent > 0) {
    const invReturn = investedTotalCurrent - investedTotalCost;
    if (invReturn > 0) {
      insights.push(
        `Seus investimentos renderam +${fmt(invReturn)} em relação ao valor investido.`
      );
    }
  }

  const recentTransactions = [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* AI Assistant Insight Notification Banner */}
      <div className="bg-slate-900 bg-gradient-to-r from-blue-900/20 via-transparent to-indigo-900/20 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-white text-sm">Notificação do Assistente IA</span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-semibold rounded-full border border-blue-500/30">
                Ativo em Tempo Real
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {alerts.length > 0 ? (
                <span className="text-amber-300 font-medium">⚠️ {alerts[0]}</span>
              ) : insights.length > 0 ? (
                <span className="text-emerald-300 font-medium">💡 {insights[0]}</span>
              ) : (
                <span>
                  Seu patrimônio total está em <strong className="text-white">{fmt(netWorth)}</strong>. As contas estão organizadas e sincronizadas.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
            <span>Receitas do Mês</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">{fmt(income)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Lançamentos confirmados</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
            <span>Despesas do Mês</span>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-rose-400">{fmt(expense)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Saídas e pagamentos</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
            <span>Saldo Mensal</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-mono font-bold ${
              monthBalance >= 0 ? 'text-blue-400' : 'text-rose-400'
            }`}
          >
            {fmt(monthBalance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {income > 0 ? `${savingsRate}% da renda economizada` : 'Sem renda registrada'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
            <span>Patrimônio Total</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400">{fmt(netWorth)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Bancos ({fmt(totalBalanceInBank)}) + Ativos
          </p>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3">
          <span className="text-slate-400 font-medium block mb-1">Maior Gasto</span>
          <span className="font-mono font-semibold text-rose-400 block truncate">
            {topExpense ? fmt(topExpense.amount) : '—'}
          </span>
          <span className="text-[10px] text-slate-500 truncate block">
            {topExpense ? topExpense.description : 'Nenhum lançamento'}
          </span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3">
          <span className="text-slate-400 font-medium block mb-1">Gasto Média/Dia</span>
          <span className="font-mono font-semibold text-slate-200 block">
            {fmt(dailyAverage)}
          </span>
          <span className="text-[10px] text-slate-500 block">{elapsedDays} dias decorridos</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3">
          <span className="text-slate-400 font-medium block mb-1">Taxa de Poupança</span>
          <span
            className={`font-mono font-semibold block ${
              savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {savingsRate}%
          </span>
          <span className="text-[10px] text-slate-500 block">Do total das receitas</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3">
          <span className="text-slate-400 font-medium block mb-1">Previsão Fim do Mês</span>
          <span
            className={`font-mono font-semibold block ${
              endOfMonthProjection !== null && endOfMonthProjection >= 0
                ? 'text-blue-400'
                : 'text-rose-400'
            }`}
          >
            {endOfMonthProjection !== null ? fmt(endOfMonthProjection) : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">Ritmo atual</span>
        </div>
      </div>

      {/* Intelligence & Alerts Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-blue-400" />
          <span>Inteligência Financeira & Notificações</span>
        </h3>

        {alerts.length === 0 && insights.length ===0 ? (
          <p className="text-xs text-slate-400">
            Tudo sob controle no momento! Nenhum alerta crítico para este período.
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            {alerts.map((alt, idx) => (
              <div
                key={`alt-${idx}`}
                className="flex items-start gap-2.5 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{alt}</span>
              </div>
            ))}
            {insights.map((ins, idx) => (
              <div
                key={`ins-${idx}`}
                className="flex items-start gap-2.5 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300"
              >
                <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{ins}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Donut Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent transactions table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-serif font-bold text-white">Movimentações Recentes</h3>
            <button
              onClick={() => onSelectPage('transactions')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              Nenhuma transação registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 font-semibold uppercase text-[10px]">
                    <th className="pb-2">Data</th>
                    <th className="pb-2">Descrição</th>
                    <th className="pb-2">Categoria</th>
                    <th className="pb-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-mono text-slate-400">{formatDate(tx.date)}</td>
                      <td className="py-2.5 text-slate-200 font-medium">{tx.description}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.category}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 text-right font-mono font-semibold ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} {fmt(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expenses Donut Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <h3 className="text-sm font-serif font-bold text-white mb-4">
            Gastos por Categoria (Mês)
          </h3>

          {donutData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500 py-12">
              Nenhuma despesa no mês selecionado.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
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

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                {donutData.map((d) => {
                  const pct = Math.round((d.value / expense) * 100);
                  return (
                    <div
                      key={d.name}
                      className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/40"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: getCatColor(d.name) }}
                        />
                        <span className="truncate">{d.name}</span>
                      </div>
                      <span className="font-mono font-medium text-slate-100 text-right shrink-0">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Bills & Goals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Bills */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Contas a Vencer no Mês</span>
            </h3>
            <button
              onClick={() => onSelectPage('accounts')}
              className="text-xs text-blue-400 hover:underline"
            >
              Gerenciar
            </button>
          </div>

          <div className="space-y-2">
            {state.recurringBills
              .filter((b) => b.active)
              .slice(0, 4)
              .map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-xs"
                >
                  <div>
                    <span className="font-medium text-slate-200 block">{b.name}</span>
                    <span className="text-[10px] text-slate-400">
                      Dia {b.day} do mês · {b.category}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-rose-400">{fmt(b.amount)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Active Goals Summary */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Metas em Andamento</span>
            </h3>
            <button
              onClick={() => onSelectPage('goals')}
              className="text-xs text-blue-400 hover:underline"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-3">
            {state.goals.slice(0, 3).map((g) => {
              const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
              return (
                <div key={g.id} className="p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-medium text-slate-200">{g.name}</span>
                    <span className="font-mono font-semibold text-blue-400">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>
                      {fmt(g.saved)} de {fmt(g.target)}
                    </span>
                    <button
                      onClick={() => onOpenGoalContrib(g.id)}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      + Guardar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
