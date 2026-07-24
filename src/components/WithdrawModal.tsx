import React, { useState } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { Investment } from '../types';
import { fmt } from '../utils/formatters';

interface WithdrawModalProps {
  investment: Investment | null;
  onClose: () => void;
  onConfirm: (id: string, amount: number) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  investment,
  onClose,
  onConfirm,
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  if (!investment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Informe um valor válido maior que R$ 0,00.');
      return;
    }
    if (val > investment.current + 0.01) {
      setError('O valor do resgate não pode ser superior ao saldo atual do ativo.');
      return;
    }
    onConfirm(investment.id, val);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-white">Resgatar Investimento</h3>
            <p className="text-xs text-slate-400">{investment.name}</p>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-4 flex justify-between items-center text-xs">
          <span className="text-slate-400">Saldo atual no ativo:</span>
          <span className="font-mono text-emerald-400 font-semibold">
            {fmt(investment.current)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
              Valor a Resgatar (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={investment.current}
              placeholder="0,00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <p className="text-[11px] text-slate-500 leading-relaxed">
            O valor resgatado entrará automaticamente como uma receita de &quot;Resgate de Investimento&quot; em seu saldo disponível em conta.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-emerald-600/20"
            >
              Confirmar Resgate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
