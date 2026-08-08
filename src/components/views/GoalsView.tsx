import React, { useState } from 'react';
import { Target, Shield, Sparkles, Plus, Trash2, ArrowDownRight, Wallet } from 'lucide-react';
import { AppState, Goal, GoalKind } from '../../types';
import { fmt, round2 } from '../../utils/formatters';

interface GoalsViewProps {
  state: AppState;
  onAddGoal: (
    goal: Omit<Goal, 'id' | 'saved' | 'createdDate'>,
    initialSaved?: number,
    accountId?: string
  ) => void;
  onDeleteGoal: (id: string) => void;
  onOpenGoalContrib: (goalId: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  state,
  onAddGoal,
  onDeleteGoal,
  onOpenGoalContrib,
}) => {
  const [kind, setKind] = useState<GoalKind>('meta');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');

  const totalSavedAll = React.useMemo(() => {
    return round2(state.goals.reduce((s, g) => s + g.saved, 0));
  }, [state.goals]);
  const emergencyGoal = state.goals.find((g) => g.kind === 'reserva');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(target);
    if (!name.trim() || !targetVal || targetVal <= 0) return;

    onAddGoal(
      {
        name: name.trim(),
        kind,
        target: targetVal,
        monthlyAmount: kind === 'objetivo' ? parseFloat(monthlyAmount) || 0 : 0,
        accountId: kind === 'objetivo' ? accountId : null,
      },
      parseFloat(saved) || 0,
      parseFloat(saved) > 0 ? accountId : undefined
    );

    setName('');
    setTarget('');
    setSaved('');
    setMonthlyAmount('');
  };

  const kindLabels: Record<GoalKind, string> = {
    meta: 'Meta Financeira',
    reserva: 'Reserva de Emergência',
    objetivo: 'Objetivo Mensal',
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-serif font-bold text-white mb-1">Metas & Objetivos</h2>
        <p className="text-slate-400 text-sm">Acompanhe seus planos e reservas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-slate-700 transition">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
            Metas Ativas
          </span>
          <span className="text-3xl font-mono font-bold text-slate-100">
            {state.goals.length}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-slate-700 transition">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
            Acumulado Total
          </span>
          <span className="text-3xl font-mono font-bold text-blue-400">
            {fmt(totalSavedAll)}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-slate-700 transition">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
            Reserva de Emergência
          </span>
          <span className="text-3xl font-mono font-bold text-emerald-400">
            {emergencyGoal
              ? `${Math.round((emergencyGoal.saved / emergencyGoal.target) * 100)}%`
              : 'Não criada'}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Col: Goals List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Seus Planos
            </h3>
          </div>

          {state.goals.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center flex flex-col items-center">
              <Target className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm">Nenhuma meta cadastrada ainda.</p>
              <p className="text-slate-500 text-xs mt-1">Crie sua primeira meta ao lado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.goals.map((g) => {
                const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
                return (
                  <div
                    key={g.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col justify-between space-y-5 shadow-sm"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 uppercase tracking-wider">
                          {kindLabels[g.kind]}
                        </span>
                        <button
                          onClick={() => onDeleteGoal(g.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                         <h4 className="font-serif font-bold text-xl text-white mb-1">{g.name}</h4>
                         <p className="text-2xl font-bold font-mono text-emerald-400">
                           {fmt(g.saved)}
                         </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                          <span>Progresso</span>
                          <span>{fmt(g.target)}</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full transition-all duration-700 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-medium block text-right mt-1 text-slate-500">
                          {pct}% Concluído
                        </span>
                      </div>

                      {g.kind === 'objetivo' && (
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/50">
                           <p className="text-[11px] text-slate-400 font-medium">
                             Aporte automático: <strong className="text-slate-200">{fmt(g.monthlyAmount || 0)}</strong>/mês
                           </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onOpenGoalContrib(g.id)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 mt-2"
                    >
                      <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                      <span>Investir</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Add Goal Form */}
        <div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-white mb-6">Criar Nova Meta</h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Tipo de Meta
                </label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as GoalKind)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition"
                >
                  <option value="meta">Meta Financeira (Livre)</option>
                  <option value="reserva">Reserva de Emergência</option>
                  <option value="objetivo">Objetivo Mensal (Recorrente)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  placeholder="Ex: Viagem para Europa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Valor Alvo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Já tenho guardado (R$) <span className="text-slate-600 font-normal">(Opcional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={saved}
                  onChange={(e) => setSaved(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500 outline-none transition"
                />
              </div>

              {kind === 'objetivo' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Aporte Mensal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500 outline-none transition"
                  />
                </div>
              )}

              {(kind === 'objetivo' || (parseFloat(saved) > 0)) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Conta {kind === 'objetivo' ? 'para débito' : 'de Origem'}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition"
                  >
                    {state.accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition shadow-lg shadow-blue-600/20 mt-4"
              >
                Salvar Meta
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
