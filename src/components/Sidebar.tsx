import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  CreditCard as CreditCardIcon,
  TrendingUp,
  Target,
  CalendarDays,
  BarChart3,
  Calendar as CalendarIcon,
  Calculator,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Download,
  Sparkles,
} from 'lucide-react';
import { TabPage, AppState, UserProfile } from '../types';
import { monthLabel } from '../utils/formatters';

interface SidebarProps {
  currentPage: TabPage;
  onSelectPage: (page: TabPage) => void;
  cursor: Date;
  onShiftMonth: (delta: number) => void;
  state: AppState;
  userProfile?: UserProfile | null;
  onOpenAssistant?: () => void;
}

export const NAV_ITEMS: { id: TabPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transações', icon: Receipt },
  { id: 'accounts', label: 'Contas & Cartões', icon: CreditCardIcon },
  { id: 'investments', label: 'Investimentos', icon: TrendingUp },
  { id: 'goals', label: 'Metas', icon: Target },
  { id: 'annual', label: 'Visão Anual', icon: CalendarDays },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'calendar', label: 'Calendário', icon: CalendarIcon },
  { id: 'simulator', label: 'Simulador', icon: Calculator },
  { id: 'settings', label: 'Configurações', icon: SettingsIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  cursor,
  onShiftMonth,
  state,
  userProfile,
  onOpenAssistant,
}) => {
  const profileName = userProfile?.displayName || state.settings.profileName || 'Configurar Perfil';
  const initial = profileName.trim().charAt(0).toUpperCase() || '?';
  const isAdmin = userProfile?.role === 'admin';

  const itemsToRender = [...NAV_ITEMS];
  if (isAdmin && !itemsToRender.some((i) => i.id === 'admin')) {
    itemsToRender.push({ id: 'admin', label: 'Administração', icon: Shield });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-5 shrink-0 min-h-screen text-slate-100 sticky top-0 h-screen">
      {/* Brand logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 bg-slate-950 flex items-center justify-center text-blue-400 font-serif font-bold text-lg shadow-md shadow-blue-500/10">
          AO
        </div>
        <div>
          <h1 className="font-serif font-semibold text-xl tracking-tight leading-none text-white">
            {state.settings.appName || 'AOFINANCE'}
          </h1>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
            Gestão Pessoal
          </span>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1">
        {itemsToRender.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* AI Assistant Button (discreet) */}
      {onOpenAssistant && (
        <button
          onClick={onOpenAssistant}
          className="mt-2 flex items-center justify-between px-3 py-2 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition text-left"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-medium text-slate-300">Assistente IA</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
            Voz
          </span>
        </button>
      )}

      {/* Month picker */}
      <div className="pt-4 mt-auto border-t border-slate-800 flex flex-col gap-2">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Período do Mês
        </label>
        <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-1.5">
          <button
            onClick={() => onShiftMonth(-1)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs font-medium text-slate-200 capitalize">
            {monthLabel(cursor)}
          </span>
          <button
            onClick={() => onShiftMonth(1)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profile chip */}
      <button
        onClick={() => onSelectPage('settings')}
        className="mt-4 flex items-center gap-3 p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl transition text-left group"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-blue-400/30 shadow">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-slate-100 truncate group-hover:text-blue-400 transition">
            {profileName}
          </div>
          <div className="text-[10px] text-slate-400 truncate">Ver perfil & ajustes</div>
        </div>
        <User className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
      </button>
    </aside>
  );
};
