import React from 'react';
import { ChevronLeft, ChevronRight, User, Database, LogOut, Shield, Sun, Moon } from 'lucide-react';
import { TabPage, AppState, UserProfile } from '../types';
import { monthLabel } from '../utils/formatters';

interface HeaderProps {
  currentPage: TabPage;
  cursor: Date;
  onShiftMonth: (delta: number) => void;
  onSelectPage: (page: TabPage) => void;
  state: AppState;
  userProfile?: UserProfile | null;
  onLogout?: () => void;
  onOpenAssistant?: () => void;
  isCloudSynced?: boolean;
  onToggleTheme?: () => void;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  cursor,
  onShiftMonth,
  onSelectPage,
  state,
  userProfile,
  onLogout,
  onOpenAssistant,
  isCloudSynced = true,
  onToggleTheme,
  onOpenInstallModal,
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
    admin: { title: 'Painel do Administrador', sub: 'Aprovação e gestão de acesso de usuários' },
  };

  const current = titles[currentPage] || { title: 'AOFINANCE', sub: 'Gestão Financeira' };
  const currentTheme = state.settings.themeMode || 'light';

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
          {currentPage === 'admin' && <Shield className="w-6 h-6 text-blue-400 shrink-0" />}
          <span>{current.title}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">{current.sub}</p>
      </div>

      {/* Mobile period & profile control */}
      <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
        {userProfile?.role === 'admin' && (
          <button
            onClick={() => onSelectPage('admin')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold hover:bg-purple-500/20 transition"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Painel Admin</span>
          </button>
        )}

        {/* Supabase cloud status pill - Admin Only */}
        {userProfile?.role === 'admin' && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">
            <Database className="w-3.5 h-3.5" />
            <span>Nuvem Ativa</span>
          </div>
        )}

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

        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition flex items-center justify-center"
            title={currentTheme === 'light' ? 'Mudar para Modo Escuro' : 'Mudar para Modo Claro'}
          >
            {currentTheme === 'light' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium transition"
            title="Sair da Conta"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        )}
      </div>
    </header>
  );
};
