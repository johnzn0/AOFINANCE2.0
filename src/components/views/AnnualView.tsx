import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  Search,
  Download,
  Printer,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  X,
  ChevronRight,
  ChevronLeft,
  Filter,
  BarChart3,
  LineChart as LineIcon,
  ShieldCheck,
  Building2,
  Wallet,
  Zap,
  Tag,
  CreditCard,
  CheckCircle2,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AppState, Transaction, Investment } from '../../types';
import { fmt, getCatColor } from '../../utils/formatters';
import {
  DateRange,
  FilterPreset,
  getDateRangeForPreset,
  getPreviousPeriodRange,
  calculateMetricsForRange,
  calcVariation,
  exportToCSV,
} from '../../utils/dateFilter';
import { GlobalDateFilter } from '../common/GlobalDateFilter';

interface AnnualViewProps {
  state: AppState;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTH_SHORT = [
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

type ChartMode = 'inc_exp' | 'net_worth' | 'investments' | 'cash_flow' | 'growth';

export const AnnualView: React.FC<AnnualViewProps> = ({ state }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Date Filter Range state
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeForPreset('this_year', undefined, undefined, selectedYear)
  );

  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [chartMode, setChartMode] = useState<ChartMode>('inc_exp');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  // Compare periods state
  const [compMonthA, setCompMonthA] = useState<number>(0); // Jan
  const [compMonthB, setCompMonthB] = useState<number>(new Date().getMonth());

  // Filter transactions by date range & search term
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter((t) => {
      const matchDate = t.date >= dateRange.startDate && t.date <= dateRange.endDate;
      if (!matchDate) return false;
      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      );
    });
  }, [state.transactions, dateRange, searchTerm]);

  // Current Period Metrics
  const currentMetrics = useMemo(() => {
    return calculateMetricsForRange(
      filteredTransactions,
      state.investments,
      dateRange,
      state.transactions
    );
  }, [filteredTransactions, state.investments, dateRange, state.transactions]);

  // Previous Period Metrics for Variation calculation
  const previousRange = useMemo(() => getPreviousPeriodRange(dateRange), [dateRange]);
  const previousMetrics = useMemo(() => {
    return calculateMetricsForRange(
      state.transactions,
      state.investments,
      previousRange,
      state.transactions
    );
  }, [state.transactions, state.investments, previousRange]);

  // Variations
  const incVar = calcVariation(currentMetrics.income, previousMetrics.income);
  const expVar = calcVariation(currentMetrics.expense, previousMetrics.expense);
  const savVar = calcVariation(currentMetrics.savings, previousMetrics.savings);
  const invVar = calcVariation(currentMetrics.investments, previousMetrics.investments);
  const nwVar = calcVariation(currentMetrics.netWorth, previousMetrics.netWorth);

  // 12 Months Breakdown for Timeline & Charts
  const monthlyTimeline = useMemo(() => {
    let accumulatedBank = 0;
    
    return MONTH_NAMES.map((name, idx) => {
      const moStr = String(idx + 1).padStart(2, '0');
      const yearStr = String(selectedYear);
      const startMo = `${yearStr}-${moStr}-01`;
      const endMo = `${yearStr}-${moStr}-31`;

      const mtx = state.transactions.filter(
        (t) => t.date.slice(0, 7) === `${yearStr}-${moStr}`
      );

      const income = mtx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = mtx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const savings = income - expense;

      const investments = mtx
        .filter(
          (t) =>
            t.category === 'Investimentos' ||
            t.description.toLowerCase().includes('aporte') ||
            t.description.toLowerCase().includes('investamento')
        )
        .reduce((s, t) => s + (t.type === 'expense' ? t.amount : 0), 0);

      accumulatedBank += savings;
      const currentInvested = state.investments.reduce((s, i) => s + i.current, 0);
      const netWorth = accumulatedBank + currentInvested;

      const growthPct = expense > 0 ? Math.round(((income - expense) / expense) * 100) : 0;

      return {
        index: idx,
        name,
        shortName: MONTH_SHORT[idx],
        year: selectedYear,
        monthKey: `${yearStr}-${moStr}`,
        income,
        expense,
        savings,
        investments,
        netWorth,
        growthPct,
        txCount: mtx.length,
        transactions: mtx,
      };
    });
  }, [state.transactions, state.investments, selectedYear]);

  // Automatic Dynamic Insights Engine
  const automaticInsights = useMemo(() => {
    const insights = [];

    // Savings rate insight
    if (currentMetrics.income > 0) {
      const savingsRate = Math.round((currentMetrics.savings / currentMetrics.income) * 100);
      if (savingsRate >= 20) {
        insights.push({
          type: 'success',
          title: 'Taxa de Poupança Excelente!',
          desc: `Você economizou ${savingsRate}% de toda a sua receita no período (${fmt(currentMetrics.savings)} guardados).`,
          icon: ShieldCheck,
        });
      } else if (savingsRate < 0) {
        insights.push({
          type: 'danger',
          title: 'Atenção ao Saldo Negativo',
          desc: `Suas despesas superaram suas receitas em ${fmt(Math.abs(currentMetrics.savings))} neste período.`,
          icon: TrendingDown,
        });
      }
    }

    // Expense variation insight
    if (previousMetrics.expense > 0) {
      if (expVar.pct < 0) {
        insights.push({
          type: 'success',
          title: 'Redução de Despesas',
          desc: `Você gastou ${Math.abs(expVar.pct)}% a menos em relação ao período anterior!`,
          icon: ArrowDownRight,
        });
      } else if (expVar.pct > 15) {
        insights.push({
          type: 'warning',
          title: 'Aumento nos Gastos',
          desc: `Seus gastos subiram ${expVar.pct}% comparado ao período anterior.`,
          icon: ArrowUpRight,
        });
      }
    }

    // Top Category expense insight
    const catMap: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      const pctOfExp = currentMetrics.expense > 0 ? Math.round((topCat[1] / currentMetrics.expense) * 100) : 0;
      insights.push({
        type: 'info',
        title: `Maior Categoria de Gasto: ${topCat[0]}`,
        desc: `Consumiu ${fmt(topCat[1])} (${pctOfExp}% de todas as despesas do período).`,
        icon: Tag,
      });
    }

    // Investments insight
    if (currentMetrics.investments > 0) {
      insights.push({
        type: 'success',
        title: 'Investimentos em Dia',
        desc: `Você aportou ${fmt(currentMetrics.investments)} no mercado financeiro neste período.`,
        icon: TrendingUp,
      });
    }

    return insights;
  }, [currentMetrics, previousMetrics, expVar, filteredTransactions]);

  // Selected Month Details for In-Page Modal/Drawer
  const selectedMonthData = useMemo(() => {
    if (selectedMonthIndex === null) return null;
    const mo = monthlyTimeline[selectedMonthIndex];
    if (!mo) return null;

    // Categories in selected month
    const catMap: Record<string, number> = {};
    mo.transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

    const categories = Object.entries(catMap)
      .map(([name, amount]) => ({
        name,
        amount,
        pct: mo.expense > 0 ? Math.round((amount / mo.expense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const topExpenses = mo.transactions
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const topIncome = mo.transactions
      .filter((t) => t.type === 'income')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      ...mo,
      categories,
      topExpenses,
      topIncome,
    };
  }, [selectedMonthIndex, monthlyTimeline]);

  // Comparison metrics calculation
  const compDataA = monthlyTimeline[compMonthA];
  const compDataB = monthlyTimeline[compMonthB];

  // CSV Export trigger
  const handleExportCSV = () => {
    const rows = monthlyTimeline.map((m) => ({
      Mês: m.name,
      Ano: m.year,
      Receitas: m.income,
      Despesas: m.expense,
      Economia: m.savings,
      Investimentos: m.investments,
      'Patrimônio Estimado': m.netWorth,
      'Quantidade Transações': m.txCount,
    }));
    exportToCSV(`balanco_financeiro_${selectedYear}`, rows);
  };

  // PDF Print trigger
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      {/* Printable CSS style snippet */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .bg-slate-900, .bg-slate-950 { background: white !important; border-color: #ccc !important; }
          .text-white, .text-slate-200 { color: black !important; }
        }
      `}</style>

      {/* Header & Global Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold font-serif text-white leading-snug">Visualização Anual & Períodos</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Análise financeira completa e comparativa de desempenho</p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export & Search */}
        <div className="flex flex-wrap items-center gap-2 no-print w-full sm:w-auto">
          <div className="relative flex-1 min-w-[140px] sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar transação..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl sm:rounded-2xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-2 sm:px-3.5 sm:py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl sm:rounded-2xl text-xs font-semibold flex items-center gap-2 transition active:scale-95 shadow-sm"
              title="Exportar CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDF}
              className="p-2 sm:px-3.5 sm:py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl sm:rounded-2xl text-xs font-semibold flex items-center gap-2 transition active:scale-95 shadow-sm"
              title="PDF / Imprimir"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">PDF / Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Date Filter System Bar */}
      <GlobalDateFilter
        currentRange={dateRange}
        onChangeRange={(newR) => setDateRange(newR)}
        isComparing={isComparing}
        onToggleCompare={(comp) => setIsComparing(comp)}
        selectedYear={selectedYear}
        onChangeYear={(y) => setSelectedYear(y)}
        className="no-print"
      />

      {/* KPI Cards Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* Receita Total */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Receita Total</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-mono font-bold text-emerald-400 block">{fmt(currentMetrics.income)}</span>
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              <span className={`font-semibold flex items-center ${incVar.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {incVar.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(incVar.pct)}%
              </span>
              <span className="text-slate-500">vs ant.</span>
            </div>
          </div>
        </div>

        {/* Despesas Totais */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Despesas Totais</span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-mono font-bold text-rose-400 block">{fmt(currentMetrics.expense)}</span>
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              <span className={`font-semibold flex items-center ${expVar.pct <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {expVar.pct > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(expVar.pct)}%
              </span>
              <span className="text-slate-500">vs ant.</span>
            </div>
          </div>
        </div>

        {/* Economia */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Economia</span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className={`text-xl font-mono font-bold block ${currentMetrics.savings >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
              {fmt(currentMetrics.savings)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              <span className={`font-semibold flex items-center ${savVar.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {savVar.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(savVar.pct)}%
              </span>
              <span className="text-slate-500">vs ant.</span>
            </div>
          </div>
        </div>

        {/* Investimentos */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Aportes/Invest.</span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-mono font-bold text-amber-400 block">{fmt(currentMetrics.investments)}</span>
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              <span className={`font-semibold flex items-center ${invVar.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {invVar.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(invVar.pct)}%
              </span>
              <span className="text-slate-500">vs ant.</span>
            </div>
          </div>
        </div>

        {/* Patrimônio Acumulado */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Patrimônio</span>
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-mono font-bold text-purple-400 block">{fmt(currentMetrics.netWorth)}</span>
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              <span className={`font-semibold flex items-center ${nwVar.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {nwVar.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(nwVar.pct)}%
              </span>
              <span className="text-slate-500">vs ant.</span>
            </div>
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Saldo Líquido</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className={`text-xl font-mono font-bold block ${currentMetrics.balance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              {fmt(currentMetrics.balance)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">{currentMetrics.txCount} lançamentos</span>
          </div>
        </div>
      </div>

      {/* Automatic Insights Bar */}
      {automaticInsights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {automaticInsights.map((ins, idx) => {
            const Icon = ins.icon;
            const badgeBg =
              ins.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : ins.type === 'danger'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : ins.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400';

            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 flex items-start gap-3 hover:border-slate-700 transition"
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${badgeBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400 inline" /> {ins.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{ins.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Interactive Chart Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Gráfico Analítico de Desempenho
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualização interativa das dinâmicas financeiras do ano
            </p>
          </div>

          {/* Chart Mode Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartMode('inc_exp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                chartMode === 'inc_exp'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Receita x Despesa
            </button>
            <button
              type="button"
              onClick={() => setChartMode('net_worth')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                chartMode === 'net_worth'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Patrimônio
            </button>
            <button
              type="button"
              onClick={() => setChartMode('investments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                chartMode === 'investments'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Investimentos
            </button>
            <button
              type="button"
              onClick={() => setChartMode('cash_flow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                chartMode === 'cash_flow'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fluxo Caixa
            </button>
          </div>
        </div>

        {/* Chart Rendering */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'inc_exp' ? (
              <BarChart data={monthlyTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="shortName" stroke="#64748B" fontSize={11} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                />
                <Tooltip
                  formatter={(val: number) => fmt(val)}
                  labelFormatter={(label) => `Mês: ${label}`}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
                <Bar dataKey="income" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartMode === 'net_worth' ? (
              <AreaChart data={monthlyTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="shortName" stroke="#64748B" fontSize={11} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                />
                <Tooltip
                  formatter={(val: number) => fmt(val)}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  name="Patrimônio Acumulado"
                  stroke="#A855F7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorNw)"
                />
              </AreaChart>
            ) : chartMode === 'investments' ? (
              <AreaChart data={monthlyTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="shortName" stroke="#64748B" fontSize={11} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                />
                <Tooltip
                  formatter={(val: number) => fmt(val)}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="investments"
                  name="Aportes em Investimentos"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorInv)"
                />
              </AreaChart>
            ) : (
              <BarChart data={monthlyTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="shortName" stroke="#64748B" fontSize={11} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                />
                <Tooltip
                  formatter={(val: number) => fmt(val)}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="savings"
                  name="Fluxo de Caixa Líquido"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive 12-Month Timeline Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-400" />
              Linha do Tempo dos 12 Meses ({selectedYear})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Clique em qualquer mês para abrir o detalhamento de categorias e transações
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {monthlyTimeline.map((mo) => {
            const isSelected = selectedMonthIndex === mo.index;
            const isPositive = mo.savings >= 0;

            return (
              <div
                key={mo.index}
                onClick={() => setSelectedMonthIndex(isSelected ? null : mo.index)}
                className={`p-4 rounded-2xl border transition cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 shadow-xl shadow-blue-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    {mo.name}
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                  </span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {fmt(mo.savings)}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Receitas:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{fmt(mo.income)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Despesas:</span>
                    <span className="font-mono text-rose-400 font-semibold">{fmt(mo.expense)}</span>
                  </div>
                  {mo.investments > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Investimentos:</span>
                      <span className="font-mono text-amber-400 font-semibold">{fmt(mo.investments)}</span>
                    </div>
                  )}
                </div>

                {/* Income vs Expense Ratio Bar */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{
                        width: `${Math.min(
                          100,
                          mo.income > 0 ? Math.round((mo.expense / mo.income) * 100) : 100
                        )}%`,
                      }}
                    />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Selected Month Details Drawer/Modal */}
      {selectedMonthData && (
        <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-6 space-y-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Detalhamento do Mês: {selectedMonthData.name} {selectedYear}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedMonthData.txCount} transações registradas neste período
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMonthIndex(null)}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Categories */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" /> Categoria de Gastos
              </h4>
              {selectedMonthData.categories.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Nenhuma despesa no mês</p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {selectedMonthData.categories.map((c) => (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span className="font-semibold">{c.name}</span>
                        <span className="font-mono text-rose-400">{fmt(c.amount)} ({c.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${c.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Expenses */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" /> Maiores Gastos do Mês
              </h4>
              {selectedMonthData.topExpenses.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Nenhum gasto neste mês</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedMonthData.topExpenses.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div>
                        <p className="text-xs font-semibold text-white">{t.description}</p>
                        <span className="text-[10px] text-slate-400">{t.category} • {t.date}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400">{fmt(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Income */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Maiores Receitas do Mês
              </h4>
              {selectedMonthData.topIncome.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Nenhuma receita neste mês</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedMonthData.topIncome.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div>
                        <p className="text-xs font-semibold text-white">{t.description}</p>
                        <span className="text-[10px] text-slate-400">{t.category} • {t.date}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">{fmt(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Smart Comparison Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-purple-400" />
              Comparação Inteligente de Períodos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare a evolução financeira entre dois meses específicos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={compMonthA}
              onChange={(e) => setCompMonthA(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>

            <span className="text-xs font-bold text-slate-500">VS</span>

            <select
              value={compMonthB}
              onChange={(e) => setCompMonthB(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {compDataA && compDataB && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Receitas Comparison */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Receitas ({compDataA.shortName} vs {compDataB.shortName})
              </span>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-mono text-slate-300">{compDataA.shortName}: {fmt(compDataA.income)}</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{compDataB.shortName}: {fmt(compDataB.income)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex justify-between text-xs">
                <span className="text-slate-400">Diferença:</span>
                <span className={`font-mono font-bold ${compDataB.income >= compDataA.income ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fmt(compDataB.income - compDataA.income)}
                </span>
              </div>
            </div>

            {/* Despesas Comparison */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Despesas ({compDataA.shortName} vs {compDataB.shortName})
              </span>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-mono text-slate-300">{compDataA.shortName}: {fmt(compDataA.expense)}</span>
                <span className="text-sm font-mono font-bold text-rose-400">{compDataB.shortName}: {fmt(compDataB.expense)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex justify-between text-xs">
                <span className="text-slate-400">Diferença:</span>
                <span className={`font-mono font-bold ${compDataB.expense <= compDataA.expense ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fmt(compDataB.expense - compDataA.expense)}
                </span>
              </div>
            </div>

            {/* Resultado Líquido Comparison */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Economia ({compDataA.shortName} vs {compDataB.shortName})
              </span>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-mono text-slate-300">{compDataA.shortName}: {fmt(compDataA.savings)}</span>
                <span className="text-sm font-mono font-bold text-blue-400">{compDataB.shortName}: {fmt(compDataB.savings)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex justify-between text-xs">
                <span className="text-slate-400">Diferença:</span>
                <span className={`font-mono font-bold ${compDataB.savings >= compDataA.savings ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fmt(compDataB.savings - compDataA.savings)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
