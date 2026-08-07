import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Clock,
  ArrowRightLeft,
  X,
  Check,
  CalendarDays,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import {
  FilterPreset,
  DateRange,
  getDateRangeForPreset,
} from '../../utils/dateFilter';

interface GlobalDateFilterProps {
  currentRange: DateRange;
  onChangeRange: (newRange: DateRange) => void;
  isComparing?: boolean;
  onToggleCompare?: (enabled: boolean) => void;
  selectedYear?: number;
  onChangeYear?: (year: number) => void;
  className?: string;
}

const PRIMARY_PRESETS: { id: FilterPreset; label: string }[] = [
  { id: 'this_month', label: 'Este Mês' },
  { id: 'this_year', label: 'Este Ano' },
  { id: 'last_12_months', label: '12 Meses' },
  { id: 'all_time', label: 'Todo Período' },
];

const ALL_PRESETS_GROUPED: { group: string; items: { id: FilterPreset; label: string }[] }[] = [
  {
    group: 'Curto Prazo',
    items: [
      { id: 'today', label: 'Hoje' },
      { id: 'this_week', label: 'Esta Semana' },
      { id: 'last_7_days', label: 'Últimos 7 Dias' },
      { id: 'last_30_days', label: 'Últimos 30 Dias' },
    ],
  },
  {
    group: 'Meses & Trimestres',
    items: [
      { id: 'this_month', label: 'Este Mês' },
      { id: 'last_month', label: 'Mês Anterior' },
      { id: 'last_90_days', label: 'Últimos 90 Dias' },
      { id: 'last_6_months', label: 'Últimos 6 Meses' },
    ],
  },
  {
    group: 'Anual & Longo Prazo',
    items: [
      { id: 'last_12_months', label: 'Últimos 12 Meses' },
      { id: 'this_year', label: 'Este Ano' },
      { id: 'last_year', label: 'Ano Anterior' },
      { id: 'all_time', label: 'Todo o Período' },
    ],
  },
];

export const GlobalDateFilter: React.FC<GlobalDateFilterProps> = ({
  currentRange,
  onChangeRange,
  isComparing = false,
  onToggleCompare,
  selectedYear = new Date().getFullYear(),
  onChangeYear,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(currentRange.startDate);
  const [customEnd, setCustomEnd] = useState(currentRange.endDate);

  const handleSelectPreset = (preset: FilterPreset) => {
    if (preset === 'custom') {
      onChangeRange(getDateRangeForPreset('custom', customStart, customEnd));
    } else {
      const newR = getDateRangeForPreset(preset, undefined, undefined, selectedYear);
      setCustomStart(newR.startDate);
      setCustomEnd(newR.endDate);
      onChangeRange(newR);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      onChangeRange(getDateRangeForPreset('custom', customStart, customEnd));
      setIsOpen(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Filter Control Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-md space-y-2">
        {/* Mobile Top Row / Desktop Main Row */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 sm:pb-0 sm:border-0">
          
          {/* Active Range Badge */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0"
          >
            <CalendarDays className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono text-xs">
              {currentRange.startDate.slice(8, 10)}/{currentRange.startDate.slice(5, 7)} -{' '}
              {currentRange.endDate.slice(8, 10)}/{currentRange.endDate.slice(5, 7)}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Action Tools: Compare & Open All Filters */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleCompare && (
              <button
                type="button"
                onClick={() => onToggleCompare(!isComparing)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition active:scale-95 ${
                  isComparing
                    ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Comparar com Período Anterior"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Comparar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Mais Filtros</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Horizontal Scroll Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
          <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-wider pr-2 border-r border-slate-800 shrink-0">
            <Filter className="w-3 h-3 text-blue-400" />
            <span>Filtro</span>
          </div>

          {PRIMARY_PRESETS.map((opt) => {
            const isActive = currentRange.preset === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectPreset(opt.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-950/80 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Backdrop & Categorized Filter Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" /> Selecionar Período de Análise
              </h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grouped Filter Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ALL_PRESETS_GROUPED.map((group) => (
                <div key={group.group} className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block border-b border-slate-800/60 pb-1">
                    {group.group}
                  </span>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = currentRange.preset === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            handleSelectPreset(item.id);
                            setIsOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-950/60 border border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{item.label}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Date Range & Year Selection */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Intervalo Customizado
              </span>
              <form onSubmit={handleApplyCustom} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <Check className="w-3.5 h-3.5" /> Aplicar Datas
                </button>
              </form>

              {onChangeYear && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Ano de Referência:</span>
                  <div className="flex items-center gap-1.5">
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          onChangeYear(y);
                          const r = getDateRangeForPreset('this_year', undefined, undefined, y);
                          onChangeRange(r);
                          setIsOpen(false);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                          selectedYear === y
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

