import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { AppState, Transaction, RecurringBill } from '../../types';
import { fmt, monthLabel, todayISO, formatDate } from '../../utils/formatters';

interface CalendarViewProps {
  state: AppState;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'date'> & { date: string }, installments?: number) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const CalendarView: React.FC<CalendarViewProps> = ({ state, onAddTransaction }) => {
  const [calCursor, setCalCursor] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const year = calCursor.getFullYear();
  const month = calCursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Group transaction & recurring bill data by day number
  const dayData: Record<
    number,
    { income: number; expense: number; items: Transaction[]; bills: RecurringBill[] }
  > = {};

  for (let d = 1; d <= daysInMonth; d++) {
    dayData[d] = { income: 0, expense: 0, items: [], bills: [] };
  }

  state.transactions.forEach((t) => {
    const [ty, tm, td] = t.date.split('-').map(Number);
    if (ty === year && tm === month + 1 && dayData[td]) {
      if (t.type === 'income') dayData[td].income += t.amount;
      if (t.type === 'expense') dayData[td].expense += t.amount;
      dayData[td].items.push(t);
    }
  });

  state.recurringBills
    .filter((b) => b.active && b.day <= daysInMonth)
    .forEach((b) => {
      if (dayData[b.day]) {
        dayData[b.day].bills.push(b);
      }
    });

  const selectedDayDetails = selectedDay ? dayData[selectedDay] : null;

  return (
    <div className="space-y-6">
      {/* Calendar Month Navigation Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-400" />
          <h3 className="font-serif font-bold text-white text-base capitalize">
            {monthLabel(calCursor)}
          </h3>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => {
              const prev = new Date(calCursor);
              prev.setMonth(prev.getMonth() - 1);
              setCalCursor(prev);
            }}
            className="p-1 text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const next = new Date(calCursor);
              next.setMonth(next.getMonth() + 1);
              setCalCursor(next);
            }}
            className="p-1 text-slate-400 hover:text-white transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[600px]">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800"
            >
              {wd}
            </div>
          ))}

          {/* Empty prefix cells for start of month */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[70px] bg-slate-950/20 rounded-xl" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const info = dayData[d];
            const isSelected = selectedDay === d;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
              d
            ).padStart(2, '0')}`;
            const isToday = dateStr === todayISO();

            return (
              <button
                key={`day-${d}`}
                onClick={() => setSelectedDay(d)}
                className={`min-h-[74px] p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                    : isToday
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span
                    className={`text-xs font-semibold ${
                      isToday ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    {d}
                  </span>
                  {info.bills.length > 0 && (
                    <span
                      className="w-2 h-2 rounded-full bg-amber-400"
                      title={`Conta fixa: ${info.bills.map(b => b.name).join(', ')}`}
                    />
                  )}
                </div>

                <div className="space-y-0.5 text-[9px] mt-1 font-medium">
                  {info.income > 0 && (
                    <div className="text-emerald-400 truncate font-mono">+{fmt(info.income)}</div>
                  )}
                  {info.expense > 0 && (
                    <div className="text-rose-400 truncate font-mono">-{fmt(info.expense)}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      {selectedDay && selectedDayDetails && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-serif font-bold text-white flex items-center justify-between">
            <span>
              Lançamentos do Dia {selectedDay} de {monthLabel(calCursor)}
            </span>
            <span className="text-xs text-slate-400 font-normal">
              Receitas: <span className="text-emerald-400 font-semibold font-mono">{fmt(selectedDayDetails.income)}</span> · Despesas: <span className="text-rose-400 font-semibold font-mono">{fmt(selectedDayDetails.expense)}</span>
            </span>
          </h3>

          {selectedDayDetails.bills.length > 0 && (
            <div className="space-y-2">
              {selectedDayDetails.bills.map((b) => (
                <div key={b.id} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Vencimento: <strong>{b.name}</strong> ({fmt(b.amount)})
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      const payDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                      onAddTransaction({
                        date: payDate,
                        description: b.name,
                        amount: b.amount,
                        category: b.category,
                        accountId: b.accountId,
                        type: 'expense',
                        status: 'paid'
                      });
                    }}
                    className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-2 py-1 rounded transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Pagar
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedDayDetails.items.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              Nenhuma movimentação lançada para este dia.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayDetails.items.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-200 block">{t.description}</span>
                    <span className="text-[10px] text-slate-400">{t.category}</span>
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'} {fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
