import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  TrendingUp,
  MoreHorizontal,
  Target,
  CalendarDays,
  BarChart3,
  Calendar,
  Calculator,
  Settings,
  Shield,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { TabPage, UserProfile } from '../types';
import { triggerHapticFeedback } from '../mobile/mobilePlatform';

interface MobileNavProps {
  currentPage: TabPage;
  onSelectPage: (page: TabPage) => void;
  userProfile?: UserProfile | null;
  onOpenAssistant?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentPage,
  onSelectPage,
  userProfile,
  onOpenAssistant,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isAdmin = userProfile?.role === 'admin';

  const handleSelect = (page: TabPage) => {
    triggerHapticFeedback('light');
    onSelectPage(page);
    setIsMoreOpen(false);
  };

  const primaryTabs: { id: TabPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Início', icon: LayoutDashboard },
    { id: 'transactions', label: 'Lançamentos', icon: Receipt },
    { id: 'accounts', label: 'Contas', icon: CreditCard },
    { id: 'investments', label: 'Investir', icon: TrendingUp },
  ];

  const secondaryTabs: { id: TabPage; label: string; desc: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { id: 'goals', label: 'Metas Financeiras', desc: 'Acompanhe seus objetivos e economias', icon: Target, color: 'text-amber-400 bg-amber-500/10' },
    { id: 'reports', label: 'Relatórios & Gráficos', desc: 'Análise detalhada de receitas e despesas', icon: BarChart3, color: 'text-emerald-400 bg-emerald-500/10' },
    { id: 'annual', label: 'Visão Anual', desc: 'Projeção e resumo consolidado do ano', icon: CalendarDays, color: 'text-indigo-400 bg-indigo-500/10' },
    { id: 'calendar', label: 'Calendário de Vencimentos', desc: 'Próximos pagamentos e agendamentos', icon: Calendar, color: 'text-cyan-400 bg-cyan-500/10' },
    { id: 'simulator', label: 'Simulador Financeiro', desc: 'Simulação de juros compostos e investimentos', icon: Calculator, color: 'text-purple-400 bg-purple-500/10' },
    { id: 'settings', label: 'Configurações', desc: 'Perfil, preferências, moedas e exportação', icon: Settings, color: 'text-slate-400 bg-slate-800' },
  ];

  if (isAdmin) {
    secondaryTabs.push({
      id: 'admin',
      label: 'Painel do Administrador',
      desc: 'Gestão de usuários e aprovações do sistema',
      icon: Shield,
      color: 'text-rose-400 bg-rose-500/10',
    });
  }

  const isMoreTabActive = secondaryTabs.some((t) => t.id === currentPage);

  return (
    <>
      {/* Native Mobile Bottom Sheet Modal for Secondary Pages */}
      {isMoreOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 md:hidden flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl pb-safe">
            {/* Sheet Handle */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-slate-700 rounded-full mx-auto" />
                <span className="font-serif font-bold text-sm text-white">Menu Adicional</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
              {onOpenAssistant && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback('medium');
                    setIsMoreOpen(false);
                    onOpenAssistant();
                  }}
                  className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-blue-600/20 to-amber-500/20 border border-blue-500/30 rounded-2xl text-left transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">Assistente IA AO FINANCE</h4>
                      <p className="text-[11px] text-slate-400">Consultoria financeira personalizada</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                </button>
              )}

              <div className="pt-2 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Módulos
              </div>

              {secondaryTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentPage === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelect(tab.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition active:scale-[0.98] ${
                      isActive
                        ? 'bg-blue-600/10 border-blue-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tab.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">{tab.label}</h4>
                        <p className="text-[10px] text-slate-400">{tab.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Native Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 z-40 px-2 py-1.5 pb-safe flex items-center justify-around shadow-2xl">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPage === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition text-[10px] font-medium active:scale-95 ${
                isActive
                  ? 'text-blue-400 font-bold bg-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-blue-400 scale-105' : 'text-slate-400'}`} />
              <span className="truncate max-w-[60px]">{tab.label}</span>
            </button>
          );
        })}

        {/* Mais Tab Button */}
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback('light');
            setIsMoreOpen(true);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition text-[10px] font-medium active:scale-95 ${
            isMoreTabActive || isMoreOpen
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoreHorizontal className={`w-5 h-5 mb-0.5 ${isMoreTabActive || isMoreOpen ? 'text-amber-400 scale-105' : 'text-slate-400'}`} />
          <span>Mais</span>
        </button>
      </nav>
    </>
  );
};
