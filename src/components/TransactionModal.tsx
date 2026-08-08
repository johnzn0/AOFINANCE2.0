import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Paperclip, UploadCloud, Plus, Sparkles } from 'lucide-react';
import { AppState, Transaction, TransactionType } from '../types';
import { fmt, todayISO } from '../utils/formatters';
import { predictCategory, CategoryPrediction } from '../utils/categoryClassifier';

interface TransactionModalProps {
  onContributeToGoal?: (goalId: string, amount: number, accountId: string, date?: string) => void;
  onContributeToInvestment?: (id: string, amount: number, accountId: string, date: string) => void;
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onAddTransaction: (tx: Omit<Transaction, 'id'>, installments?: number) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Moradia': '🏠',
  'Alimentação': '🍔',
  'Transporte': '🚗',
  'Saúde': '💊',
  'Educação': '📚',
  'Lazer': '🎬',
  'Salário': '💰',
  'Investimentos': '📈',
  'Outros': '🏷️'
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  state,
  onAddTransaction,
  onContributeToGoal,
  onContributeToInvestment
}) => {
  const [type, setType] = useState<TransactionType | 'transfer' | 'investment'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(state.settings.categories[0] || 'Outros');
  const [date, setDate] = useState(todayISO());
  const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(state.accounts.length > 1 ? state.accounts[1].id : '');
  
  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Installments
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState('2');
  const [destinationId, setDestinationId] = useState('');

  // Smart Category Prediction
  const [suggestion, setSuggestion] = useState<CategoryPrediction | null>(null);

  useEffect(() => {
    if (description.trim().length >= 3 && type !== 'transfer' && type !== 'investment') {
      const pred = predictCategory(
        description,
        type === 'income' ? 'income' : 'expense',
        state.transactions,
        state.settings.categories
      );
      if (pred.category && pred.confidence >= 0.35) {
        setSuggestion(pred);
      } else {
        setSuggestion(null);
      }
    } else {
      setSuggestion(null);
    }
  }, [description, type, state.transactions, state.settings.categories]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val) {
      val = (parseInt(val) / 100).toFixed(2);
      setAmountStr(val);
    } else {
      setAmountStr('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountStr);
    if (!amt || amt <= 0 || !description.trim()) return;

    if (type === 'investment' && destinationId) {
       // Is it a goal or investment?
       const goal = state.goals.find(g => g.id === destinationId);
       const inv = state.investments.find(i => i.id === destinationId);
       if (goal && onContributeToGoal) {
          onContributeToGoal(goal.id, amt, accountId, date);
          onClose();
          return;
       } else if (inv && onContributeToInvestment) {
          onContributeToInvestment(inv.id, amt, accountId, date);
          onClose();
          return;
       }
    }

    let finalType: TransactionType = 'expense';
    let finalCategory = category;

    if (type === 'income') finalType = 'income';
    if (type === 'expense') finalType = 'expense';
    if (type === 'transfer') {
      finalType = 'expense';
      finalCategory = 'Transferência';
    }
    if (type === 'investment') {
      finalType = 'expense';
      finalCategory = 'Investimentos';
    }

    onAddTransaction(
      {
        date,
        type: finalType,
        category: finalCategory,
        description: description.trim(),
        amount: amt,
        accountId: accountId,
        tags: tags.length > 0 ? tags : undefined,
      },
      isInstallment ? parseInt(installments) : 1
    );
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      {/* Drawer */}
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
        
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h2 className="text-lg font-serif font-bold text-white">Nova Transação</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <form id="tx-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Type Selector */}
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
              {(['expense', 'income', 'transfer', 'investment'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    type === t ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t === 'expense' ? 'Despesa' : t === 'income' ? 'Receita' : t === 'transfer' ? 'Transferência' : 'Investimento'}
                </button>
              ))}
            </div>

            {/* Giant Amount Input */}
            <div className="text-center bg-slate-950/50 p-6 rounded-xl border border-slate-800 border-dashed">
               <p className="text-xs uppercase font-bold text-slate-500 mb-2">Valor da Transação</p>
               <div className="flex items-center justify-center text-4xl font-mono font-bold text-white">
                 <span className="text-xl text-slate-500 mr-1">R$</span>
                 <input
                   type="text"
                   value={amountStr}
                   onChange={handleAmountChange}
                   placeholder="0,00"
                   className="bg-transparent w-48 text-center focus:outline-none placeholder-slate-700"
                   autoFocus
                 />
               </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Descrição</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Almoço no shopping"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
                {suggestion && suggestion.category !== category && (
                  <div className="mt-2 flex items-center justify-between bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-2 text-xs text-emerald-300 animate-fadeIn">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Sugestão Inteligente: <strong className="text-white">{suggestion.category}</strong>
                        {suggestion.source.includes('history') && ' (baseado no seu histórico)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCategory(suggestion.category)}
                      className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded text-[10px] hover:bg-emerald-400 transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                {type !== 'transfer' && type !== 'investment' && (
                  <div>
                    <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Categoria</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
                    >
                      {state.settings.categories.map(c => (
                        <option key={c} value={c}>{CATEGORY_EMOJIS[c] || '🏷️'} {c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Accounts */}
              <div className="grid grid-cols-2 gap-4">
                <div className={type === 'transfer' ? 'col-span-1' : 'col-span-2'}>
                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">
                    {type === 'income' ? 'Conta de Destino' : 'Conta de Origem'}
                  </label>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {state.accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                
                {type === 'transfer' && (
                  <div>
                    <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Conta Destino</label>
                    <select
                      value={toAccountId}
                      onChange={e => setToAccountId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {state.accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {type === 'investment' && (state.goals.length > 0 || state.investments.length > 0) && (
                  <div className="col-span-2 mt-2">
                    <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Destino do Investimento/Meta <span className="text-slate-600 font-normal">(Opcional)</span></label>
                    <select
                      value={destinationId}
                      onChange={e => setDestinationId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Nenhum (Apenas registrar despesa)</option>
                      {state.goals.length > 0 && (
                        <optgroup label="Metas e Objetivos">
                          {state.goals.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {state.investments.length > 0 && (
                        <optgroup label="Investimentos">
                          {state.investments.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}
              </div>

            </div>
            {/* Tags (Notion style) */}
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Tags</label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 flex flex-wrap gap-2 items-center focus-within:border-blue-500 transition-colors">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-md">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? "Digite e aperte Enter..." : ""}
                  className="bg-transparent flex-1 min-w-[100px] text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Installments (only for expenses) */}
            {(type === 'expense' || type === 'investment') && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={e => setIsInstallment(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0"
                  />
                  <span className="text-sm font-medium text-slate-300">Parcelar transação</span>
                </label>
                
                {isInstallment && (
                  <div className="mt-3 pl-6 border-l-2 border-slate-800 flex items-center gap-4 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Parcelas</label>
                      <input
                        type="number"
                        min="2" max="120"
                        value={installments}
                        onChange={e => setInstallments(e.target.value)}
                        className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Valor por Parcela</label>
                      <p className="font-mono text-sm text-slate-300 mt-2">
                        {amountStr ? fmt(parseFloat(amountStr) / parseInt(installments || '1')) : 'R$ 0,00'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attachments */}
            <div>
               <label className="block text-xs uppercase font-semibold text-slate-400 mb-2">Comprovante</label>
               <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:bg-slate-950/50 hover:border-slate-700 transition-colors cursor-pointer flex flex-col items-center gap-2">
                 <UploadCloud className="w-8 h-8 text-slate-600" />
                 <p className="text-sm text-slate-400">Arraste e solte ou <span className="text-blue-400">clique para anexar</span></p>
                 <p className="text-xs text-slate-600">PDF, JPG, PNG (Max 5MB)</p>
               </div>
            </div>

          </form>
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-950">
          <button
            form="tx-form"
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Salvar Transação
          </button>
        </div>

      </div>
    </div>
  );
};
