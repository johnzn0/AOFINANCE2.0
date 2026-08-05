import React, { useState } from 'react';
import { Target, Shield, Sparkles, Plus, Trash2, ArrowDownRight } from 'lucide-react';
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
  const [saved, setSaved] = useState('0');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');

  const totalSavedAll = round2(state.goals.reduce((s, g) => s + g.saved, 0));
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
    setSaved('0');
    setMonthlyAmount('');
  };

  const kindLabels: Record<GoalKind, string> = {
    meta: 'Meta Financeira',
    reserva: 'Reserva de Emergência',
    objetivo: 'Objetivo Mensal (Aporte Auto)',
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Metas Ativas
          </span>
          <span className="text-2xl font-mono font-bold text-slate-200">
            {state.goals.length}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Total Acumulado nas Metas
          </span>
          <span className="text-2xl font-mono font-bold text-blue-400">
            {fmt(totalSavedAll)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Reserva de Emergência
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-400">
            {emergencyGoal
              ? `${Math.round((emergencyGoal.saved / emergencyGoal.target) * 100)}%`
              : 'Não criada'}
          </span>
          <p className="text-[10px] text-slate-500 mt-1">
            {emergencyGoal ? `${fmt(emergencyGoal.saved)} / ${fmt(emergencyGoal.target)}` : 'Crie sua reserva abaixo'}
          </p>
        </div>
      </div>

      {/* Goal Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-serif font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-400" />
          <span>Nova Meta ou Reserva</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                Tipo
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as GoalKind)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
              >
                <option value="meta">Meta Financeira</option>
                <option value="reserva">Reserva de Emergência</option>
                <option value="objetivo">Objetivo Mensal (Aporte Automático)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                Nome do Objetivo
              </label>
              <input
                type="text"
                placeholder="Ex.: Viagem para Itália, Comprar Carro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                Valor da Meta (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                Já Guardado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={saved}
                onChange={(e) => setSaved(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>

            {kind === 'objetivo' && (
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                  Aporte Mensal Automático (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
            )}
            {(kind === 'objetivo' || parseFloat(saved) > 0) && (
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                  Conta {kind === 'objetivo' ? 'para Aporte' : 'de Origem'}
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                >
                  {state.accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition shadow-md shadow-blue-600/20"
          >
            Adicionar Objetivo
          </button>
        </form>
      </div>

      {/* Goals Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-serif font-bold text-white">Seus Planos e Metas</h3>

        {state.goals.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
            Nenhuma meta cadastrada ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.goals.map((g) => {
              const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
              return (
                <div
                  key={g.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {kindLabels[g.kind]}
                      </span>
                      <button
                        onClick={() => onDeleteGoal(g.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-serif font-bold text-base text-white">{g.name}</h4>

                    <div className="space-y-1.5 text-xs pt-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Acumulado:</span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          {fmt(g.saved)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Objetivo Alvo:</span>
                        <span className="font-mono text-slate-200">{fmt(g.target)}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="pt-2">
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-blue-500 h-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-blue-400 font-mono font-medium block text-right mt-1">
                          {pct}% Concluído
                        </span>
                      </div>

                      {g.kind === 'objetivo' && (
                        <p className="text-[10px] text-slate-500 pt-1">
                          Aporte automático de {fmt(g.monthlyAmount || 0)} no início de cada mês.
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenGoalContrib(g.id)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Guardar Dinheiro</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
