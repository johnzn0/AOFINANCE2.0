import React, { useState } from 'react';
import { X, CheckCircle2, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../utils/formatters';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    name: string;
    salary: number;
    banks: string[];
    cards: string[];
    goalName: string;
    goalTarget: number;
    categories: string[];
  }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [salary, setSalary] = useState('');
  const [banks, setBanks] = useState('Nubank, Itaú');
  const [cards, setCards] = useState('Nubank Ultravioleta');
  const [goalName, setGoalName] = useState('Reserva de Emergência');
  const [goalTarget, setGoalTarget] = useState('10000');
  const [selectedCats, setSelectedCats] = useState<string[]>([...DEFAULT_CATEGORIES]);

  if (!isOpen) return null;

  const toggleCategory = (cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleFinish = () => {
    onComplete({
      name: name.trim() || 'Usuário',
      salary: parseFloat(salary) || 0,
      banks: banks
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean),
      cards: cards
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      goalName: goalName.trim(),
      goalTarget: parseFloat(goalTarget) || 0,
      categories: selectedCats,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 mb-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? 'w-6 bg-blue-500'
                  : i < step
                  ? 'w-2 bg-blue-500/40'
                  : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full border-2 border-blue-500 bg-slate-950 flex items-center justify-center text-blue-400 font-serif font-bold text-2xl mx-auto shadow-lg shadow-blue-500/20">
              AO
            </div>
            <h3 className="text-2xl font-serif font-bold text-white">Bem-vindo(a) ao AOFINANCE</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              Configure sua estrutura financeira pessoal em menos de 2 minutos para um acompanhamento preciso e seguro.
            </p>
            <button
              onClick={() => setStep(1)}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
            >
              <span>Começar Configuração</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1: Name & Salary */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-serif font-bold text-white">Como podemos te chamar?</h3>
            <p className="text-xs text-slate-400">Seus dados ficam mantidos em seu dispositivo.</p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Seu Nome
              </label>
              <input
                type="text"
                placeholder="Ex.: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Renda Mensal estimada (R$) <span className="text-slate-500 font-normal">(Opcional)</span>
              </label>
              <input
                type="number"
                placeholder="Ex.: 5000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Banks */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-xl font-serif font-bold text-white">Quais bancos você utiliza?</h3>
            <p className="text-xs text-slate-400">Separe os nomes por vírgula para criar suas contas bancárias.</p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Contas Bancárias
              </label>
              <input
                type="text"
                placeholder="Ex.: Nubank, Itaú, C6 Bank"
                value={banks}
                onChange={(e) => setBanks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Credit Cards */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-serif font-bold text-white">Cartões de Crédito</h3>
            <p className="text-xs text-slate-400">
              Separe os cartões por vírgula. Limites e datas podem ser personalizados depois.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Seus Cartões
              </label>
              <input
                type="text"
                placeholder="Ex.: Nubank Ultravioleta, Itaú Click"
                value={cards}
                onChange={(e) => setCards(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Primary Goal */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-xl font-serif font-bold text-white">Alguma meta em mente?</h3>
            <p className="text-xs text-slate-400">
              Crie seu primeiro objetivo financeiro ou reserva de emergência.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Nome da Meta
              </label>
              <input
                type="text"
                placeholder="Ex.: Reserva de Emergência, Viagem"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Valor Alvo (R$)
              </label>
              <input
                type="number"
                placeholder="Ex.: 10000"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(5)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Categories Selection */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-xl font-serif font-bold text-white">Categorias de Lançamentos</h3>
            <p className="text-xs text-slate-400">
              Selecione as categorias que deseja utilizar em suas despesas e receitas.
            </p>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 border border-slate-800 rounded-xl bg-slate-950/50">
              {DEFAULT_CATEGORIES.map((cat) => {
                const isSelected = selectedCats.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Concluir e Entrar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
