import React from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { TabPage, AppState } from '../types';
import { monthLabel } from '../utils/formatters';

interface HeaderProps {
  currentPage: TabPage;
  cursor: Date;
  onShiftMonth: (delta: number) => void;
  onSelectPage: (page: TabPage) => void;
  state: AppState;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  cursor,
  onShiftMonth,
  onSelectPage,
  state,
}) => {
  const titles: Record<TabPage, { title: string; sub: string }> = {
    overview: { title: 'Visão Geral', sub: 'Seu resumo financeiro e alertas inteligentes' },
    transactions: { title: 'Transações', sub: 'Histórico de receitas, despesas e anexos' },
    accounts: { title: 'Contas & Cartões', sub: 'Saldos bancários, faturas e contas fixas' },
    investments: { title: 'Investimentos', sub: 'Rentabilidade e alocação de carteira' },
    goals: { title: 'Metas & Objetivos', sub: 'Reserva de emergência e planos de investimento' },
    annual: { title: 'Visão Anual', sub: 'Balanço financeiro completo do ano' },
    reports: { title: 'Centro de Relatórios', sub: 'Evolução patrimonial e comparativos' },
    calendar: { title: 'Calendário Financeiro', sub: 'Movimentações organizadas por dia' },
    simulator: { title: 'Simulador', sub: 'Projeção de juros compostos e aportes' },
    settings: { title: 'Configurações', sub: 'Perfil, categorias e backup de dados' },
  };

  const current = titles[currentPage] || { title: 'AOFINANCE', sub: 'Gestão Financeira' };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
          {current.title}
        </h2>
        <p className="text-xs text-slate-400 mt-1">{current.sub}</p>
      </div>

      {/* Mobile period & profile control */}
      <div className="flex items-center gap-3 self-start sm:self-auto">
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-mono">
          <button
            onClick={() => onShiftMonth(-1)}
            className="p-1 rounded text-slate-400 hover:text-white transition"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-slate-200 capitalize">{monthLabel(cursor)}</span>
          <button
            onClick={() => onShiftMonth(1)}
            className="p-1 rounded text-slate-400 hover:text-white transition"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onSelectPage('settings')}
          className="md:hidden flex items-center gap-2 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200"
        >
          <User className="w-3.5 h-3.5 text-blue-400" />
          <span className="truncate max-w-[80px]">
            {state.settings.profileName || 'Perfil'}
          </span>
        </button>
      </div>
    </header>
  );
};
