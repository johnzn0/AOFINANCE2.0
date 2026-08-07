const fs = require('fs');
const file = 'src/components/views/InvestmentsView.tsx';

const content = `import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash,
  X,
  History,
  RefreshCw,
  Landmark,
  ChevronRight,
  MoreVertical,
  Banknote
} from 'lucide-react';
import { AppState, Investment, Account } from '../../types';
import { fmt, round2, formatDateFull, todayISO } from '../../utils/formatters';

interface InvestmentsViewProps {
  state: AppState;
  onAddInvestment: (inv: Omit<Investment, 'id' | 'date' | 'history'>, accountId?: string) => void;
  onAddInvestmentContribution?: (id: string, amount: number, accountId: string, date: string) => void;
  onUpdateInvestmentMarketValue?: (id: string, newCurrentValue: number, date: string) => void;
  onUpdateInvestment: (id: string, updated: Partial<Investment>) => void;
  onDeleteInvestment: (id: string) => void;
  onOpenWithdrawModal?: (id: string) => void;
  onWithdrawInvestment?: (id: string, amount: number, accountId?: string) => void;
}

export const InvestmentsView: React.FC<InvestmentsViewProps> = ({
  state,
  onAddInvestment,
  onAddInvestmentContribution,
  onUpdateInvestmentMarketValue,
  onUpdateInvestment,
  onDeleteInvestment,
  onWithdrawInvestment,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Investment | null>(null);
  const [modalType, setModalType] = useState<'details' | 'contribution' | 'updateValue' | 'withdraw' | null>(null);

  const totalInvested = state.investments.reduce((s, i) => s + i.invested, 0);
  const totalCurrent = state.investments.reduce((s, i) => s + i.current, 0);
  const totalReturn = totalCurrent - totalInvested;
  const returnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // Add Asset Form
  const [name, setName] = useState('');
  const [type, setType] = useState(state.settings.investmentTypes[0] || 'Renda Fixa');
  const [invested, setInvested] = useState('');
  const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const invVal = parseFloat(invested);
    if (!name.trim() || !invVal || invVal <= 0) return;

    onAddInvestment({
      name: name.trim(),
      type,
      invested: invVal,
      current: invVal,
    }, accountId);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setInvested('');
  };

  const [actionAmount, setActionAmount] = useState('');
  const [actionAccount, setActionAccount] = useState(state.accounts[0]?.id || '');
  const [actionDate, setActionDate] = useState(todayISO());

  const handleContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv || !onAddInvestmentContribution) return;
    const val = parseFloat(actionAmount);
    if (val > 0) {
      onAddInvestmentContribution(selectedInv.id, val, actionAccount, actionDate);
      setModalType(null);
      setActionAmount('');
    }
  };

  const handleUpdateValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv || !onUpdateInvestmentMarketValue) return;
    const val = parseFloat(actionAmount);
    if (!isNaN(val) && val >= 0) {
      onUpdateInvestmentMarketValue(selectedInv.id, val, actionDate);
      setModalType(null);
      setActionAmount('');
    }
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv || !onWithdrawInvestment) return;
    const val = parseFloat(actionAmount);
    if (val > 0 && val <= selectedInv.current + 0.01) {
      onWithdrawInvestment(selectedInv.id, val, actionAccount);
      setModalType(null);
      setActionAmount('');
    }
  };

  const openModal = (inv: Investment, type: 'details' | 'contribution' | 'updateValue' | 'withdraw') => {
    setSelectedInv(inv);
    setModalType(type);
    setActionAmount('');
    setActionDate(todayISO());
    if (type === 'updateValue') {
      setActionAmount(inv.current.toString());
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Investido</h3>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white font-mono">{fmt(totalInvested)}</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Saldo Atual</h3>
          </div>
          <p className="text-xl md:text-2xl font-bold text-blue-400 font-mono">{fmt(totalCurrent)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            {totalReturn >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingUp className="w-4 h-4 text-rose-400" />
            )}
            <h3 className={\`text-xs font-semibold uppercase tracking-wider \${totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
              Lucro / Prejuízo
            </h3>
          </div>
          <p className={\`text-xl md:text-2xl font-bold font-mono \${totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
            {fmt(totalReturn)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rentabilidade</h3>
          </div>
          <p className={\`text-xl md:text-2xl font-bold font-mono \${returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
            {returnPct > 0 ? '+' : ''}{returnPct.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-serif font-bold text-slate-100 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-blue-400" /> Minha Carteira
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Ativo
        </button>
      </div>

      {state.investments.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-8 text-center">
          <Landmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Você ainda não possui investimentos cadastrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.investments.map((inv) => {
            const profit = inv.current - inv.invested;
            const pct = inv.invested > 0 ? (profit / inv.invested) * 100 : 0;
            return (
              <div key={inv.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-100 truncate">{inv.name}</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 mt-1 inline-block">
                      {inv.type}
                    </span>
                  </div>
                  <button onClick={() => openModal(inv, 'details')} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">Investido</p>
                    <p className="font-mono text-sm text-slate-200">{fmt(inv.invested)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">Saldo Atual</p>
                    <p className="font-mono text-sm text-blue-400 font-medium">{fmt(inv.current)}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-800/50 mt-1 flex justify-between items-center">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Rentabilidade</p>
                    <p className={\`font-mono text-sm font-semibold \${pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
                      {pct > 0 ? '+' : ''}{pct.toFixed(2)}% ({fmt(profit)})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-800">
                  <button onClick={() => openModal(inv, 'contribution')} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-[10px] font-semibold uppercase">Aporte</span>
                  </button>
                  <button onClick={() => openModal(inv, 'updateValue')} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-[10px] font-semibold uppercase">Atualizar</span>
                  </button>
                  <button onClick={() => openModal(inv, 'withdraw')} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors">
                    <ArrowDownRight className="w-4 h-4" />
                    <span className="text-[10px] font-semibold uppercase">Resgate</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" /> Novo Ativo
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Nome do Ativo</label>
                <input
                  type="text"
                  placeholder="Ex: Tesouro Selic 2029"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Categoria</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {state.settings.investmentTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Aporte Inicial (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={invested}
                    onChange={(e) => setInvested(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Conta de Origem</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {state.accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white">
                  Cadastrar Ativo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modals */}
      {modalType && selectedInv && modalType !== 'details' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                {modalType === 'contribution' && <><ArrowUpRight className="w-5 h-5 text-blue-400" /> Novo Aporte</>}
                {modalType === 'updateValue' && <><RefreshCw className="w-5 h-5 text-emerald-400" /> Atualizar Valor</>}
                {modalType === 'withdraw' && <><ArrowDownRight className="w-5 h-5 text-rose-400" /> Resgate</>}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <p className="text-sm font-semibold text-slate-200">{selectedInv.name}</p>
              <div className="flex justify-between mt-1 text-xs text-slate-400 font-mono">
                <span>Inv: {fmt(selectedInv.invested)}</span>
                <span>Atual: {fmt(selectedInv.current)}</span>
              </div>
            </div>

            <form onSubmit={
              modalType === 'contribution' ? handleContribution : 
              modalType === 'updateValue' ? handleUpdateValue : 
              handleWithdraw
            } className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">
                  {modalType === 'contribution' && 'Valor do Aporte (R$)'}
                  {modalType === 'updateValue' && 'Novo Valor Total Atual (R$)'}
                  {modalType === 'withdraw' && 'Valor do Resgate (R$)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={modalType === 'updateValue' ? 0 : 0.01}
                  max={modalType === 'withdraw' ? selectedInv.current : undefined}
                  placeholder="0,00"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono text-lg"
                />
              </div>

              {modalType !== 'updateValue' && (
                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">
                    {modalType === 'contribution' ? 'Conta de Origem' : 'Conta de Destino'}
                  </label>
                  <select
                    value={actionAccount}
                    onChange={(e) => setActionAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {state.accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Data</label>
                <input
                  type="date"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800">
                  Cancelar
                </button>
                <button type="submit" className={\`px-4 py-2 rounded-lg text-sm font-medium text-white \${
                  modalType === 'contribution' ? 'bg-blue-600 hover:bg-blue-500' :
                  modalType === 'updateValue' ? 'bg-emerald-600 hover:bg-emerald-500' :
                  'bg-rose-600 hover:bg-rose-500'
                }\`}>
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details/History Modal */}
      {modalType === 'details' && selectedInv && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
              <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                {selectedInv.name}
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => onDeleteInvestment(selectedInv.id)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                  <Trash className="w-5 h-5" />
                </button>
                <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                    <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Total Investido</p>
                    <p className="font-mono text-lg font-medium text-slate-200">{fmt(selectedInv.invested)}</p>
                 </div>
                 <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                    <p className="text-xs font-semibold uppercase text-blue-400 mb-1">Saldo Atual</p>
                    <p className="font-mono text-lg font-bold text-blue-400">{fmt(selectedInv.current)}</p>
                 </div>
              </div>

              {/* History */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" /> Histórico do Ativo
                </h4>
                
                {(!selectedInv.history || selectedInv.history.length === 0) ? (
                   <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-950/50 rounded-lg border border-slate-800/50">Nenhum histórico encontrado.</p>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                    {selectedInv.history.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => {
                      const isAporte = entry.type === 'aporte';
                      const isResgate = entry.type === 'resgate';
                      const isUpdate = entry.type === 'atualizacao';
                      
                      return (
                        <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className={\`flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 \${
                             isAporte ? 'text-blue-400' : isResgate ? 'text-rose-400' : 'text-emerald-400'
                          }\`}>
                            {isAporte && <ArrowUpRight className="w-4 h-4" />}
                            {isResgate && <ArrowDownRight className="w-4 h-4" />}
                            {isUpdate && <RefreshCw className="w-4 h-4" />}
                          </div>
                          
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-slate-950 p-3 rounded-lg border border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                               <span className="text-xs font-semibold text-slate-400">{formatDateFull(entry.date)}</span>
                               <span className={\`text-xs font-bold uppercase \${
                                 isAporte ? 'text-blue-400' : isResgate ? 'text-rose-400' : entry.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                               }\`}>
                                  {isAporte ? 'Aporte' : isResgate ? 'Resgate' : 'Mercado'}
                               </span>
                            </div>
                            <p className={\`font-mono text-sm font-medium \${
                               isAporte ? 'text-blue-400' : isResgate ? 'text-rose-400' : entry.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }\`}>
                              {isUpdate && entry.amount > 0 ? '+' : ''}{isResgate ? '-' : ''}{fmt(Math.abs(entry.amount))}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`
fs.writeFileSync(file, content);
console.log('InvestmentsView completely rewritten');
