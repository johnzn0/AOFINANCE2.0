import React from 'react';
import {
  Upload,
  PlusCircle,
  Sparkles,
  Building2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface ZeroTransactionsOnboardingProps {
  onOpenImportModal: () => void;
  onOpenAddTransactionModal: () => void;
  onLoadSampleData?: () => void;
  onNavigateToAccounts?: () => void;
}

export const ZeroTransactionsOnboarding: React.FC<ZeroTransactionsOnboardingProps> = ({
  onOpenImportModal,
  onOpenAddTransactionModal,
  onLoadSampleData,
  onNavigateToAccounts,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            Primeiros Passos
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Sua conta está sem lançamentos cadastrados!
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Escolha como deseja começar a gerenciar seus dados financeiros. Você pode importar um extrato bancário, registrar transações manualmente ou carregar dados demonstrativos para testar a plataforma.
          </p>
        </div>

        {onLoadSampleData && (
          <button
            onClick={onLoadSampleData}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/60 flex items-center gap-2 transition shrink-0 group"
          >
            <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            Carregar Dados Demonstrativos
          </button>
        )}
      </div>

      {/* Interactive Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Option 1: Import OFX/CSV */}
        <div className="bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 flex flex-col justify-between space-y-4 group transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Importar Extrato
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                OFX / CSV
              </span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Carregue o extrato fornecido pelo seu banco ou cartão para categorização e lançamento em lote instantâneo.
            </p>
          </div>

          <button
            onClick={onOpenImportModal}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition"
          >
            Importar Extrato
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Option 2: Add Manual Transaction */}
        <div className="bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 flex flex-col justify-between space-y-4 group transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Lançamento Manual
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Registre suas receitas ou despesas pontuais informando valor, data, categoria e conta de origem.
            </p>
          </div>

          <button
            onClick={onOpenAddTransactionModal}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
          >
            Novo Lançamento
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Option 3: Manage Accounts & Cards */}
        <div className="bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col justify-between space-y-4 group transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Contas & Cartões
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configure suas contas bancárias, saldos iniciais e limites dos cartões de crédito.
            </p>
          </div>

          <button
            onClick={onNavigateToAccounts}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition"
          >
            Gerenciar Contas
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
