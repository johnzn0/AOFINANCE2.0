import { Transaction, Investment } from '../types';

export type FilterPreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'last_6_months'
  | 'last_12_months'
  | 'this_year'
  | 'last_year'
  | 'all_time'
  | 'custom';

export interface DateRange {
  preset: FilterPreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function getDateRangeForPreset(
  preset: FilterPreset,
  customStart?: string,
  customEnd?: string,
  targetYear?: number
): DateRange {
  const now = new Date();
  const currentYear = targetYear || now.getFullYear();

  switch (preset) {
    case 'today': {
      const todayStr = formatDateISO(now);
      return { preset, startDate: todayStr, endDate: todayStr, label: 'Hoje' };
    }
    case 'this_week': {
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const mon = new Date(now);
      mon.setDate(now.getDate() + diffToMon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return {
        preset,
        startDate: formatDateISO(mon),
        endDate: formatDateISO(sun),
        label: 'Esta Semana',
      };
    }
    case 'this_month': {
      const y = now.getFullYear();
      const m = now.getMonth();
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return {
        preset,
        startDate: formatDateISO(start),
        endDate: formatDateISO(end),
        label: 'Este Mês',
      };
    }
    case 'last_month': {
      const y = now.getFullYear();
      const m = now.getMonth();
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return {
        preset,
        startDate: formatDateISO(start),
        endDate: formatDateISO(end),
        label: 'Mês Anterior',
      };
    }
    case 'last_7_days': {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return {
        preset,
        startDate: formatDateISO(start),
        endDate: formatDateISO(now),
        label: 'Últimos 7 Dias',
      };
    }
    case 'last_30_days': {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      return {
        preset,
        startDate: formatDateISO(start),
        endDate: formatDateISO(now),
        label: 'Últimos 30 Dias',
      };
    }
    case 'last_90_days': {
      const start = new Date(now);
      start.setDate(now.getDate() - 89);
      return {
        preset,
        startDate: formatDateISO(start),
        endDate: formatDateISO(now),
        label: 'Últimos 90 Dias',
      };
    }
    case 'last_6_months': {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 5);
      start.setDate(1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        preset,
        startDate: formatDateISO(start),
        endDate: formatDateISO(end),
        label: 'Últimos 6 Meses',
      };
    }
    case 'last_12_months': {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 11);
      start.setDate(1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        preset,
        startDate: formatDateISO(start),
        endDate: formatDateISO(end),
        label: 'Últimos 12 Meses',
      };
    }
    case 'this_year': {
      return {
        preset,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        label: `Ano de ${currentYear}`,
      };
    }
    case 'last_year': {
      const prevY = currentYear - 1;
      return {
        preset,
        startDate: `${prevY}-01-01`,
        endDate: `${prevY}-12-31`,
        label: `Ano de ${prevY}`,
      };
    }
    case 'all_time': {
      return {
        preset,
        startDate: '2000-01-01',
        endDate: '2099-12-31',
        label: 'Todo o Período',
      };
    }
    case 'custom': {
      const s = customStart || formatDateISO(now);
      const e = customEnd || formatDateISO(now);
      return {
        preset,
        startDate: s,
        endDate: e,
        label: `Personalizado (${s} até ${e})`,
      };
    }
    default:
      return {
        preset: 'this_year',
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        label: `Ano de ${currentYear}`,
      };
  }
}

export function getPreviousPeriodRange(range: DateRange): DateRange {
  const start = parseISO(range.startDate);
  const end = parseISO(range.endDate);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const prevEnd = new Date(start);
  prevEnd.setDate(start.getDate() - 1);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevEnd.getDate() - diffDays + 1);

  return {
    preset: 'custom',
    startDate: formatDateISO(prevStart),
    endDate: formatDateISO(prevEnd),
    label: 'Período Anterior',
  };
}

export interface PeriodMetrics {
  income: number;
  expense: number;
  savings: number;
  investments: number;
  netWorth: number;
  balance: number;
  txCount: number;
}

export function calculateMetricsForRange(
  transactions: Transaction[],
  investments: Investment[],
  range: DateRange,
  allTransactionsUpToRangeEnd?: Transaction[]
): PeriodMetrics {
  const rangeTx = transactions.filter(
    (t) => t.date >= range.startDate && t.date <= range.endDate
  );

  const income = rangeTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = rangeTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;
  const balance = savings;

  // Investment contributions in range
  const invTx = rangeTx
    .filter(
      (t) =>
        t.category === 'Investimentos' ||
        t.description.toLowerCase().includes('aporte') ||
        t.description.toLowerCase().includes('investimento')
    )
    .reduce((s, t) => s + (t.type === 'expense' ? t.amount : 0), 0);

  // Bank balance accumulated up to range end
  const upToTx = (allTransactionsUpToRangeEnd || transactions).filter(
    (t) => t.date <= range.endDate
  );
  const accumulatedBank = upToTx.reduce(
    (s, t) => s + (t.type === 'income' ? t.amount : -t.amount),
    0
  );

  const totalInvestedCurrent = investments.reduce((s, i) => s + i.current, 0);
  const netWorth = accumulatedBank + totalInvestedCurrent;

  return {
    income,
    expense,
    savings,
    investments: invTx,
    netWorth,
    balance,
    txCount: rangeTx.length,
  };
}

export function calcVariation(current: number, previous: number) {
  const diff = current - previous;
  if (previous === 0) {
    return { pct: current > 0 ? 100 : 0, diff, isUp: current > 0 };
  }
  const pct = Math.round((diff / Math.abs(previous)) * 100);
  return { pct, diff, isUp: diff >= 0 };
}

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((field) => {
            const val = row[field] === undefined || row[field] === null ? '' : String(row[field]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
