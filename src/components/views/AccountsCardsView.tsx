import React, { useState } from 'react';
import {
  Landmark,
  ArrowRightLeft,
  CreditCard as CreditCardIcon,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AppState,
  Account,
  CreditCard,
  CardPurchase,
  RecurringBill,
} from '../../types';
import {
  fmt,
  calculateAccountBalance,
  round2,
  formatDate,
  todayISO,
  accountName,
} from '../../utils/formatters';

interface AccountsCardsViewProps {
  state: AppState;
  onAddAccount: (name: string, type?: Account['type']) => void;
  onRemoveAccount: (id: string) => void;
  onAddTransfer: (tr: {
    fromId: string;
    toId: string;
    amount: number;
    date: string;
    note?: string;
  }) => void;
  onDeleteTransfer: (id: string) => void;
  onAddCard: (card: Omit<CreditCard, 'id'>) => void;
  onRemoveCard: (id: string) => void;
  onAddCardPurchase: (
    purchase: Omit<CardPurchase, 'id' | 'paid' | 'invoiceMonth'>,
    installments: number,
    card: CreditCard
  ) => void;
  onPayCardInvoice: (cardId: string, invoiceMonth: string, accountId: string) => void;
  onDeleteCardPurchase: (id: string) => void;
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
  onRemoveRecurringBill,
}) => {
  // Account Form
  const [newAccName, setNewAccName] = useState('');

  // Transfer Form
  const [trFrom, setTrFrom] = useState(state.accounts[0]?.id || '');
  const [trTo, setTrTo] = useState(state.accounts[1]?.id || state.accounts[0]?.id || '');
  const [trAmount, setTrAmount] = useState('');
  const [trDate, setTrDate] = useState(todayISO());
  const [trNote, setTrNote] = useState('');

  // Card Form
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardClosing, setCardClosing] = useState('10');
  const [cardDue, setCardDue] = useState('17');

  // Card Purchase Form
  const [cpCardId, setCpCardId] = useState(state.cards[0]?.id || '');
  const [cpDesc, setCpDesc] = useState('');
  const [cpCat, setCpCat] = useState(state.settings.categories[0] || 'Outros');
  const [cpDate, setCpDate] = useState(todayISO());
  const [cpAmount, setCpAmount] = useState('');
  const [cpInstallments, setCpInstallments] = useState('1');

  // Recurring Bill Form
  const [billName, setBillName] = useState('');
  const [billDay, setBillDay] = useState('10');
  const [billAmount, setBillAmount] = useState('');
  const [billCategory, setBillCategory] = useState(state.settings.categories[0] || 'Outros');
  const [billAccount, setBillAccount] = useState(state.accounts[0]?.id || '');

  // Pay invoice account selection state
  const [payAccounts, setPayAccounts] = useState<Record<string, string>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    onAddAccount(newAccName.trim());
    setNewAccName('');
  };

  const handleAddTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(trAmount);
    if (!val || val <= 0 || !trFrom || !trTo || trFrom === trTo) return;
    onAddTransfer({
      fromId: trFrom,
      toId: trTo,
      amount: val,
      date: trDate || todayISO(),
      note: trNote.trim(),
    });
    setTrAmount('');
    setTrNote('');
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;
    onAddCard({
      name: cardName.trim(),
      limit: parseFloat(cardLimit) || 0,
      closingDay: Math.min(31, Math.max(1, parseInt(cardClosing) || 10)),
      dueDay: Math.min(31, Math.max(1, parseInt(cardDue) || 17)),
    });
    setCardName('');
    setCardLimit('');
  };

  const handleAddCardPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const card = state.cards.find((c) => c.id === (cpCardId || state.cards[0]?.id));
    const val = parseFloat(cpAmount);
    if (!card || !val || val <= 0 || !cpDesc.trim()) return;

    onAddCardPurchase(
      {
        cardId: card.id,
        date: cpDate || todayISO(),
        description: cpDesc.trim(),
        category: cpCat,
        amount: val,
      },
      Math.max(1, parseInt(cpInstallments) || 1),
      card
    );

    setCpDesc('');
    setCpAmount('');
    setCpInstallments('1');
  };

  const handleAddRecurringBill = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(billAmount);
    if (!billName.trim() || !val || val <= 0) return;
    onAddRecurringBill({
      name: billName.trim(),
      day: Math.min(31, Math.max(1, parseInt(billDay) || 1)),
      amount: val,
      category: billCategory,
      accountId: billAccount || state.accounts[0]?.id || 'acc-1',
      active: true,
    });
    setBillName('');
    setBillAmount('');
  };

  const toggleExpandCard = (cardId: string) => {
    setExpandedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  return (
    <div className="space-y-8">
      {/* Bank Accounts & Transfers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Accounts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
            <Landmark className="w-4 h-4 text-blue-400" />
            <span>Contas Bancárias</span>
          </div>

          <div className="space-y-2">
            {state.accounts.map((acc) => {
              const bal = calculateAccountBalance(acc.id, state);
              return (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-100 block">{acc.name}</span>
                    <span className="text-[10px] text-slate-500">
                      ID: {acc.id} · {acc.type || 'Corrente'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono font-bold ${
                        bal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {fmt(bal)}
                    </span>
                    {state.accounts.length > 1 && (
                      <button
                        onClick={() => onRemoveAccount(acc.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Remover conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleAddAccount} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Nome da nova conta (Ex.: C6 Bank, Caixinha)"
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
            >
              Adicionar
            </button>
          </form>
        </div>

        {/* Transfers */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
            <span>Transferência Entre Contas</span>
          </div>

          <form onSubmit={handleAddTransfer} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">De</label>
                <select
                  value={trFrom}
                  onChange={(e) => setTrFrom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                >
                  {state.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">Para</label>
                <select
                  value={trTo}
                  onChange={(e) => setTrTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                >
                  {state.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={trAmount}
                  onChange={(e) => setTrAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">Data</label>
                <input
                  type="date"
                  value={trDate}
                  onChange={(e) => setTrDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Observação (Ex.: Cobrir fatura, reserva)"
                value={trNote}
                onChange={(e) => setTrNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition"
            >
              Transferir Saldo
            </button>
          </form>

          {/* Transfers History */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {state.transfers.slice(0, 5).map((tr) => (
              <div
                key={tr.id}
                className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-800/80 rounded-lg text-[11px]"
              >
                <span className="text-slate-400 truncate">
                  {formatDate(tr.date)} · {accountName(tr.fromId, state.accounts)} →{' '}
                  {accountName(tr.toId, state.accounts)}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-medium text-slate-200">{fmt(tr.amount)}</span>
                  <button
                    onClick={() => onDeleteTransfer(tr.id)}
                    className="p-0.5 rounded text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Credit Cards Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-6">
        <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
          <CreditCardIcon className="w-4 h-4 text-blue-400" />
          <span>Cartões de Crédito & Faturas</span>
        </div>

        {/* Existing Cards List */}
        <div className="space-y-4">
          {state.cards.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">
              Nenhum cartão de crédito cadastrado.
            </p>
          ) : (
            state.cards.map((card) => {
              const pendingPurchases = state.cardPurchases.filter(
                (p) => p.cardId === card.id && !p.paid
              );
              const totalOpen = round2(
                pendingPurchases.reduce((s, p) => s + p.amount, 0)
              );

              // Group pending purchases by invoiceMonth
              const byMonth: Record<string, CardPurchase[]> = {};
              pendingPurchases.forEach((p) => {
                (byMonth[p.invoiceMonth] = byMonth[p.invoiceMonth] || []).push(p);
              });
              const months = Object.keys(byMonth).sort();

              const isExpanded = expandedCards[card.id];

              return (
                <div
                  key={card.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="font-semibold text-sm text-white">{card.name}</h4>
                      <p className="text-[10px] text-slate-400">
                        Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                        {card.limit > 0 ? ` · Limite: ${fmt(card.limit)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total em aberto</span>
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          {fmt(totalOpen)}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemoveCard(card.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Invoice Months */}
                  {months.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhuma compra pendente.</p>
                  ) : (
                    <div className="space-y-3">
                      {(isExpanded ? months : months.slice(0, 1)).map((m) => {
                        const items = byMonth[m];
                        const monthTotal = round2(
                          items.reduce((s, p) => s + p.amount, 0)
                        );
                        const selectedPayAcc =
                          payAccounts[`${card.id}_${m}`] || state.accounts[0]?.id || '';

                        return (
                          <div
                            key={m}
                            className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs space-y-2"
                          >
                            <div className="flex justify-between items-center font-semibold text-slate-200">
                              <span>Fatura {m}</span>
                              <span className="font-mono text-amber-400">{fmt(monthTotal)}</span>
                            </div>

                            <div className="space-y-1">
                              {items.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex justify-between text-slate-400 text-[11px]"
                                >
                                  <span>{p.description}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono">{fmt(p.amount)}</span>
                                    <button
                                      onClick={() => onDeleteCardPurchase(p.id)}
                                      className="text-slate-500 hover:text-rose-400"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Pay invoice button */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                              <select
                                value={selectedPayAcc}
                                onChange={(e) =>
                                  setPayAccounts((prev) => ({
                                    ...prev,
                                    [`${card.id}_${m}`]: e.target.value,
                                  }))
                                }
                                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-[11px]"
                              >
                                {state.accounts.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() =>
                                  onPayCardInvoice(card.id, m, selectedPayAcc)
                                }
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-[11px] transition"
                              >
                                Pagar Fatura
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {months.length > 1 && (
                        <button
                          onClick={() => toggleExpandCard(card.id)}
                          className="w-full text-center text-[11px] text-blue-400 hover:underline py-1 flex items-center justify-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <span>Ocultar faturas futuras</span>
                              <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <span>
                                + {months.length - 1} fatura(s) futura(s) em aberto
                              </span>
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add Card & Purchase Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          {/* Add New Card */}
          <form onSubmit={handleAddCard} className="space-y-3 text-xs">
            <h4 className="font-semibold text-slate-200">Novo Cartão</h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nome do cartão"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                required
                className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white"
              />
              <input
                type="number"
                placeholder="Limite (R$)"
                value={cardLimit}
                onChange={(e) => setCardLimit(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Dia Fechamento"
                value={cardClosing}
                onChange={(e) => setCardClosing(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white"
              />
              <input
                type="number"
                placeholder="Dia Vencimento"
                value={cardDue}
                onChange={(e) => setCardDue(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition"
            >
              Adicionar Cartão
            </button>
          </form>

          {/* Add Card Purchase */}
          <form onSubmit={handleAddCardPurchase} className="space-y-3 text-xs">
            <h4 className="font-semibold text-slate-200">Lançar Compra no Cartão</h4>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={cpCardId}
                onChange={(e) => setCpCardId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white"
              >
                {state.cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Descrição da compra"
                value={cpDesc}
                onChange={(e) => setCpDesc(e.target.value)}
                required
                className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Valor Total"
                value={cpAmount}
                onChange={(e) => setCpAmount(e.target.value)}
                required
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white font-mono"
              />
              <input
                type="number"
                min="1"
                max="60"
                placeholder="Parcelas"
                value={cpInstallments}
                onChange={(e) => setCpInstallments(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white font-mono"
              />
              <input
                type="date"
                value={cpDate}
                onChange={(e) => setCpDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition"
            >
              Lançar Compra
            </button>
          </form>
        </div>
      </div>

      {/* Recurring Bills Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Contas Fixas & Recorrentes</span>
        </div>

        <div className="space-y-2">
          {state.recurringBills.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs"
            >
              <div>
                <span className="font-semibold text-slate-100 block">{b.name}</span>
                <span className="text-[10px] text-slate-400">
                  Todo dia {b.day} · {b.category} · {accountName(b.accountId, state.accounts)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold text-rose-400">{fmt(b.amount)}</span>
                <button
                  onClick={() => onToggleRecurringBill(b.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    b.active
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {b.active ? 'Ativa' : 'Pausada'}
                </button>
                <button
                  onClick={() => onRemoveRecurringBill(b.id)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Recurring Bill Form */}
        <form onSubmit={handleAddRecurringBill} className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 text-xs">
          <input
            type="text"
            placeholder="Nome (Ex.: Netflix, Aluguel)"
            value={billName}
            onChange={(e) => setBillName(e.target.value)}
            required
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white sm:col-span-2"
          />
          <input
            type="number"
            min="1"
            max="31"
            placeholder="Dia do mês"
            value={billDay}
            onChange={(e) => setBillDay(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Valor (R$)"
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
            required
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
          />
          <button
            type="submit"
            className="py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition"
          >
            Adicionar Conta
          </button>
        </form>
      </div>
    </div>
  );
};
