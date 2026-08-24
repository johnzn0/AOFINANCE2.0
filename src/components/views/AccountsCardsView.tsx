import React, { useState, useMemo } from 'react';
import { 
  Landmark, 
  ArrowRightLeft, 
  CreditCard as CreditCardIcon, 
  Clock, 
  Plus, 
  Trash2, 
  X,
  Wallet,
  Building2,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { OpenFinanceModal } from '../OpenFinanceModal';
import { AppState, Account, CreditCard, CardPurchase, RecurringBill, Transfer } from '../../types';
import { fmt, calculateAccountBalance, formatDate } from '../../utils/formatters';

interface AccountsCardsViewProps {
  state: AppState;
  onAddAccount: (name: string, type?: Account['type']) => void;
  onRemoveAccount?: (id: string) => void;
  onAddTransfer: (tr: Omit<Transfer, 'id'>) => void;
  onDeleteTransfer?: (id: string) => void;
  onAddCard: (card: Omit<CreditCard, 'id'>) => void;
  onRemoveCard?: (id: string) => void;
  onAddCardPurchase: (purchase: Omit<CardPurchase, 'id' | 'paid' | 'invoiceMonth'>, installments: number, card: CreditCard) => void;
  onPayCardInvoice: (cardId: string, invoiceMonth: string, accountId: string) => void;
  onDeleteCardPurchase?: (id: string) => void;
  onAddRecurringBill: (bill: Omit<RecurringBill, 'id'>) => void;
  onToggleRecurringBill: (id: string) => void;
  onRemoveRecurringBill: (id: string) => void;
}

export const AccountsCardsView: React.FC<AccountsCardsViewProps> = ({
  state,
  onAddAccount,
  onRemoveAccount,
  onAddTransfer,
  onDeleteTransfer,
  onAddCard,
  onRemoveCard,
  onAddCardPurchase,
  onPayCardInvoice,
  onDeleteCardPurchase,
  onAddRecurringBill,
  onToggleRecurringBill,
  onRemoveRecurringBill
}) => {
  // Modal States
  const [activeModal, setActiveModal] = useState<'none' | 'account' | 'card' | 'transfer' | 'purchase' | 'bill' | 'payInvoice'>('none');
  const [isOpenFinanceOpen, setIsOpenFinanceOpen] = useState(false);

  // Form States - Pay Invoice
  const [payInvoiceCardId, setPayInvoiceCardId] = useState('');
  const [payInvoiceAmount, setPayInvoiceAmount] = useState(0);
  const [payInvoiceAccountId, setPayInvoiceAccountId] = useState(state.accounts[0]?.id || '');
  const [payInvoiceMonth, setPayInvoiceMonth] = useState('');

  // Form States - Account
  const [accountName, setAccountName] = useState('');
  
  // Form States - Transfer
  const [transferFrom, setTransferFrom] = useState(state.accounts[0]?.id || '');
  const [transferTo, setTransferTo] = useState(state.accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  
  // Form States - Card
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardClosing, setCardClosing] = useState('');
  const [cardDue, setCardDue] = useState('');

  // Form States - Purchase
  const [cpCardId, setCpCardId] = useState(state.cards[0]?.id || '');
  const [cpAmount, setCpAmount] = useState('');
  const [cpDesc, setCpDesc] = useState('');

  // Handlers
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountName.trim()) {
      onAddAccount(accountName);
      setAccountName('');
      setActiveModal('none');
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount.replace(/[^0-9.]/g, ''));
    if (amt > 0 && transferFrom && transferTo && transferFrom !== transferTo) {
      onAddTransfer({
        fromId: transferFrom,
        toId: transferTo,
        amount: amt,
        date: new Date().toISOString().split('T')[0],
        note: 'Transferência entre contas'
      });
      setActiveModal('none');
      setTransferAmount('');
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardName && parseFloat(cardLimit) > 0) {
      onAddCard({
        name: cardName,
        limit: parseFloat(cardLimit),
        closingDay: parseInt(cardClosing || '25'),
        dueDay: parseInt(cardDue || '5')
      });
      setActiveModal('none');
      setCardName('');
      setCardLimit('');
      setCardClosing('');
      setCardDue('');
    }
  };

  const handleAddPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpDesc && parseFloat(cpAmount) > 0) {
      const card = state.cards.find(c => c.id === cpCardId);
      if (card) {
        onAddCardPurchase({
          cardId: cpCardId,
          description: cpDesc,
          category: 'Cartão de Crédito',
          amount: parseFloat(cpAmount),
          date: new Date().toISOString().split('T')[0]
        }, 1, card);
      }
      setActiveModal('none');
      setCpDesc('');
      setCpAmount('');
    }
  };

  const handlePayInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (payInvoiceCardId && payInvoiceAccountId && payInvoiceAmount > 0 && payInvoiceMonth) {
      onPayCardInvoice(payInvoiceCardId, payInvoiceMonth, payInvoiceAccountId);
      setActiveModal('none');
    }
  };

  // Helper calculation
  const totalBalance = useMemo(() => {
    return Math.round(state.accounts.reduce((sum, acc) => sum + calculateAccountBalance(acc.id, state), 0) * 100) / 100;
  }, [state.accounts, state.transactions]);

  return (
    <div className="space-y-8 pb-24 relative">
      
      {/* Overview Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h2 className="text-3xl font-serif font-bold text-white mb-1">Patrimônio</h2>
           <p className="text-slate-400 text-sm">Gerencie suas contas, saldos e cartões de crédito</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setActiveModal('transfer')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
             <ArrowRightLeft className="w-4 h-4" /> Transferir
           </button>
        </div>
      </div>

      {/* --- ACCOUNTS SECTION --- */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" /> Contas Bancárias
          </h3>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsOpenFinanceOpen(true)} className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold flex items-center gap-1 transition">
              <ShieldCheck className="w-4 h-4" /> Conectar Banco
            </button>
            <button onClick={() => setActiveModal('account')} className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold flex items-center gap-1 transition">
              <Plus className="w-4 h-4" /> Adicionar Manualmente
            </button>
          </div>
        </div>
        
        <OpenFinanceModal
          isOpen={isOpenFinanceOpen}
          onClose={() => setIsOpenFinanceOpen(false)}
          onSuccess={(accounts) => {
            accounts.forEach(acc => {
              onAddAccount(acc.name, 'checking');
            });
          }}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Box */}
          <div className="bg-slate-900 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-between h-32">
            <div className="text-emerald-400 opacity-90 text-sm font-semibold uppercase tracking-wider">Saldo Total</div>
            <div className="text-3xl font-bold font-mono text-white">{fmt(totalBalance)}</div>
          </div>

          {state.accounts.map(acc => {
            const bal = calculateAccountBalance(acc.id, state);
            return (
              <div key={acc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-slate-700 transition group cursor-pointer">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition">
                         <Building2 className="w-4 h-4" />
                       </div>
                       <span className="font-semibold text-slate-200">{acc.name}</span>
                    </div>
                 </div>
                 <div className="text-xl font-bold font-mono text-white">{fmt(bal)}</div>
              </div>
            );
          })}
        </div>
      </section>


      {/* --- CREDIT CARDS SECTION --- */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-blue-400" /> Cartões de Crédito
          </h3>
          <div className="flex gap-3">
            <button onClick={() => setActiveModal('purchase')} className="text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1 transition">
              <Plus className="w-4 h-4" /> Compra
            </button>
            <button onClick={() => setActiveModal('card')} className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1 transition">
              <Plus className="w-4 h-4" /> Adicionar Cartão
            </button>
          </div>
        </div>

        {state.cards.length === 0 ? (
           <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-8 text-center">
             <CreditCardIcon className="w-10 h-10 text-slate-700 mx-auto mb-3" />
             <p className="text-slate-400">Você ainda não tem cartões cadastrados.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.cards.map(card => {
               // Calculate used limit
               const currentMonth = new Date().toISOString().slice(0, 7);
               const currentInvoice = Math.round(state.cardPurchases.filter(p => p.cardId === card.id && p.date.startsWith(currentMonth)).reduce((s, p) => s + p.amount, 0) * 100) / 100;
               const usedPct = card.limit > 0 ? Math.min((currentInvoice / card.limit) * 100, 100) : 0;

               return (
                 <div key={card.id} className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden flex flex-col justify-between min-h-[220px] transition-all hover:border-slate-700">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <div className="relative z-10 flex justify-between items-start">
                       <span className="font-semibold text-slate-300 tracking-wide text-sm">{card.name}</span>
                       <div className="flex gap-1 items-center">
                          <div className="w-5 h-5 rounded-full bg-red-500/80 mix-blend-screen"></div>
                          <div className="w-5 h-5 rounded-full bg-yellow-500/80 mix-blend-screen -ml-2"></div>
                       </div>
                    </div>

                    <div className="relative z-10 mt-6 flex-1 flex flex-col justify-center">
                       <div className="text-xs text-slate-500 mb-1">Fatura Atual</div>
                       <div className="text-3xl font-mono text-white tracking-tight">{fmt(currentInvoice)}</div>
                    </div>
                       
                    <div className="relative z-10 mt-6 space-y-4">
                       <div className="space-y-1.5">
                         <div className="flex justify-between text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                           <span>Limite Usado</span>
                           <span className="font-mono">{fmt(currentInvoice)} / {fmt(card.limit)}</span>
                         </div>
                         <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${usedPct}%` }}></div>
                         </div>
                       </div>

                       <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                         <div className="flex gap-4 text-xs text-slate-500">
                           <span title="Fechamento">F: {card.closingDay}</span>
                           <span title="Vencimento">V: {card.dueDay}</span>
                         </div>
                         
                         {currentInvoice > 0 && (
                           <button 
                             onClick={() => {
                               setPayInvoiceCardId(card.id);
                               setPayInvoiceAmount(currentInvoice);
                               setPayInvoiceMonth(currentMonth);
                               setActiveModal('payInvoice');
                             }}
                             className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-full"
                           >
                             Pagar Fatura
                           </button>
                         )}
                       </div>
                    </div>
                 </div>
               )
            })}
          </div>
        )}
      </section>

      {/* --- MODALS OVERLAYS --- */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
             
             {/* Account Modal */}
             {activeModal === 'account' && (
               <form onSubmit={handleAddAccount} className="p-6">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-white">Nova Conta Bancária</h3>
                   <button type="button" onClick={() => setActiveModal('none')} className="text-slate-500 hover:text-white transition"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Nome da Instituição</label>
                      <input type="text" autoFocus value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Ex: Nubank, Itaú..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition" required />
                    </div>
                    <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition">Criar Conta</button>
                 </div>
               </form>
             )}

             {/* Transfer Modal */}
             {activeModal === 'transfer' && (
               <form onSubmit={handleTransfer} className="p-6">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-white">Transferência</h3>
                   <button type="button" onClick={() => setActiveModal('none')} className="text-slate-500 hover:text-white transition"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Origem</label>
                        <select value={transferFrom} onChange={e => setTransferFrom(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white focus:border-blue-500 outline-none">
                          {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Destino</label>
                        <select value={transferTo} onChange={e => setTransferTo(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white focus:border-blue-500 outline-none">
                          {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Valor (R$)</label>
                      <input type="number" step="0.01" min="0" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-xl focus:border-blue-500 outline-none text-center" required />
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition mt-2">Realizar Transferência</button>
                 </div>
               </form>
             )}

             {/* Card Modal */}
             {activeModal === 'card' && (
               <form onSubmit={handleAddCard} className="p-6">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-white">Novo Cartão</h3>
                   <button type="button" onClick={() => setActiveModal('none')} className="text-slate-500 hover:text-white transition"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Nome do Cartão</label>
                      <input type="text" autoFocus value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Ex: Nubank Ultravioleta" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Limite (R$)</label>
                      <input type="number" value={cardLimit} onChange={e => setCardLimit(e.target.value)} placeholder="5000.00" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:border-blue-500 outline-none" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Dia Vencimento</label>
                        <input type="number" min="1" max="31" value={cardDue} onChange={e => setCardDue(e.target.value)} placeholder="5" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Dia Fechamento</label>
                        <input type="number" min="1" max="31" value={cardClosing} onChange={e => setCardClosing(e.target.value)} placeholder="25" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" required />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition">Salvar Cartão</button>
                 </div>
               </form>
             )}

             {/* Purchase Modal */}
             {activeModal === 'purchase' && (
               <form onSubmit={handleAddPurchase} className="p-6">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-white">Lançar Compra</h3>
                   <button type="button" onClick={() => setActiveModal('none')} className="text-slate-500 hover:text-white transition"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Cartão</label>
                      <select value={cpCardId} onChange={e => setCpCardId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none">
                        {state.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Descrição</label>
                      <input type="text" value={cpDesc} onChange={e => setCpDesc(e.target.value)} placeholder="Ex: Ifood, Netflix" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Valor Total (R$)</label>
                      <input type="number" step="0.01" min="0" value={cpAmount} onChange={e => setCpAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-xl focus:border-blue-500 outline-none text-center" required />
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition mt-2">Registrar Compra</button>
                 </div>
               </form>
             )}

             {/* Pay Invoice Modal */}
             {activeModal === 'payInvoice' && (
               <form onSubmit={handlePayInvoice} className="p-6">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-white">Pagar Fatura</h3>
                   <button type="button" onClick={() => setActiveModal('none')} className="text-slate-500 hover:text-white transition"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="space-y-4">
                    <div className="text-center p-4 bg-slate-950 rounded-xl border border-slate-800 mb-2">
                       <div className="text-sm text-slate-400 mb-1">Fatura de {payInvoiceMonth}</div>
                       <div className="text-3xl font-mono text-white font-bold">{fmt(payInvoiceAmount)}</div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Conta de Pagamento</label>
                      <select value={payInvoiceAccountId} onChange={e => setPayInvoiceAccountId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none">
                        {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition mt-2">Confirmar Pagamento</button>
                 </div>
               </form>
             )}

          </div>
        </div>
      )}

    </div>
  );
};
