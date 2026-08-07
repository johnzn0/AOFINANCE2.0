import { useState, useEffect, useCallback } from 'react';
import { AppState, Transaction, Account, Transfer, CreditCard, CardPurchase, RecurringBill, Goal, Investment, UserSettings, UserProfile } from '../types';
import { initialData, sampleData } from '../data/initialData';
import { uid, todayISO, round2, addMonths } from '../utils/formatters';
import {
  syncUserWithSupabase,
  loadStateFromSupabase,
  saveStateToSupabase,
  loginWithApi,
  registerWithApi,
  resetPasswordWithApi,
  getCurrentUserProfile,
  removeStoredToken,
} from '../lib/api';
import { getSupabase } from '../lib/supabase';

const STORAGE_KEY = 'aofinance_app_state_v2';

export function useFinance() {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; displayName?: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialData,
          ...parsed,
          settings: {
            ...initialData.settings,
            ...(parsed.settings || {}),
            theme: {
              ...initialData.settings.theme,
              ...(parsed.settings?.theme || {}),
            },
          },
        };
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
    return initialData;
  });

  const [cursor, setCursor] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Track Auth state & Profile
  useEffect(() => {
    let isMounted = true;
    
    const syncUser = async (user: any) => {
      if (!isMounted || !user) return;
      try {
        const prof = await getCurrentUserProfile();
        if (prof) {
          setUserProfile({
            uid: prof.uid || user.id,
            email: prof.email || user.email || '',
            displayName: prof.displayName || user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : ''),
            role: prof.role || 'user',
            status: prof.status || 'pending',
            plan: prof.plan || 'free',
            createdAt: user.created_at || new Date().toISOString(),
            photoURL: user.user_metadata?.avatar_url,
          } as any);
          setCurrentUser({
            uid: prof.uid || user.id,
            email: prof.email || user.email || '',
            displayName: prof.displayName || user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : ''),
          });
        }
      } catch (e) {
        console.error('Failed to sync user', e);
      }
    };

    async function checkSession() {
      if (window.location.hash.includes('error=')) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const errCode = params.get('error');
        const errDesc = params.get('error_description');
        if (errDesc || errCode) {
          const cleanDesc = decodeURIComponent(errDesc || errCode || '').replace(/\+/g, ' ');
          if (cleanDesc.includes('provider is not enabled') || cleanDesc.includes('Unsupported provider') || errCode === 'unsupported_provider') {
            alert('Erro no login via Google (Provedor não ativado):\n\nO provedor Google precisa ser ativado no seu Supabase:\n1. Acesse https://supabase.com/dashboard\n2. Vá em Authentication > Providers > Google\n3. Ative o "Google Provider" e adicione seu Client ID & Secret.\n4. Em Authentication > URL Configuration, adicione a URL da sua aplicação nas Redirect URLs.');
          } else {
            alert('Erro no login via provedor: ' + cleanDesc);
          }
          window.location.hash = '';
        }
      }
      // If running inside a popup opened by Google OAuth:
      if (window.opener && window.opener !== window && (window.location.hash.includes('access_token') || window.location.search.includes('code'))) {
        const supabase = getSupabase();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            try {
              window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
            } catch (e) {}
            window.close();
            return;
          }
        }
      }

      try {
        const profile = await getCurrentUserProfile();
        if (profile && isMounted) {
          setUserProfile(profile);
          setCurrentUser({
            uid: profile.uid,
            email: profile.email,
            displayName: profile.displayName,
          });
          setIsAuthLoading(false);
          return;
        }
      } catch (err) {
        // No valid local token
      }

      const supabase = getSupabase();
      if (supabase) {
        const { data: subData } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;
          if (session?.user) {
            await syncUser(session.user);
            // If this is a popup, notify parent and close
            if (window.opener && window.opener !== window) {
              try {
                window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
              } catch (e) {}
              window.close();
              return;
            }
          }
          setIsAuthLoading(false);
        });

        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await syncUser(session.user);
          setIsAuthLoading(false);
          return;
        }
      }

      setIsAuthLoading(false);
    }

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_AUTH_SUCCESS' && isMounted) {
         window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    checkSession();

    return () => {
      isMounted = false;
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Load state from Supabase when user changes
  useEffect(() => {
    if (!currentUser) {
      setIsCloudLoaded(false);
      return;
    }

    let isMounted = true;
    setIsCloudLoaded(false);

    loadStateFromSupabase()
      .then((cloudState) => {
        if (!isMounted) return;
        if (cloudState) {
          setState({
            ...initialData,
            ...cloudState,
            settings: {
              ...initialData.settings,
              ...(cloudState.settings || {}),
            },
          });
          setIsCloudSynced(true);
          setIsCloudLoaded(true);
        } else {
          // If no cloud state yet for this user, upload initial state to cloud
          saveStateToSupabase(state)
            .then((res) => {
              if (isMounted) {
                setIsCloudSynced(res.success);
                setIsCloudLoaded(true);
              }
            })
            .catch(() => {
              if (isMounted) setIsCloudLoaded(true);
            });
        }
      })
      .catch((err) => {
        console.warn('Could not load state from Supabase, using local state', err);
        if (isMounted) setIsCloudLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid]);

  // Save to localStorage & Supabase on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (currentUser && isCloudLoaded) {
        saveStateToSupabase(state)
          .then((res) => {
            setIsCloudSynced(res.success);
          })
          .catch((err) => {
            console.warn('Failed to save state to Supabase', err);
            setIsCloudSynced(false);
          });
      }
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [state, currentUser, isCloudLoaded]);

  // Process recurring bills and goal objectives on load or date change
  useEffect(() => {
    const now = new Date();
    const todayDay = now.getDate();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let updated = false;

    let newTransactions = [...state.transactions];
    let newBills = state.recurringBills.map((b) => {
      if (b.active && b.lastGenMonth !== curMonth && todayDay >= b.day) {
        const dateStr = `${curMonth}-${String(b.day).padStart(2, '0')}`;
        newTransactions.push({
          id: uid(),
          date: dateStr,
          type: 'expense',
          category: b.category,
          description: b.name,
          amount: b.amount,
          accountId: b.accountId || state.accounts[0]?.id || 'acc-1',
        });
        updated = true;
        return { ...b, lastGenMonth: curMonth };
      }
      return b;
    });

    let newGoals = state.goals.map((g) => {
      if (g.kind === 'objetivo' && (g.monthlyAmount || 0) > 0 && g.lastContribMonth !== curMonth) {
        const mAmount = g.monthlyAmount || 0;
        newTransactions.push({
          id: uid(),
          date: `${curMonth}-01`,
          type: 'expense',
          category: 'Poupança/Metas',
          description: `Aporte automático: ${g.name}`,
          amount: mAmount,
          accountId: g.accountId || state.accounts[0]?.id || 'acc-1',
        });
        updated = true;
        return {
          ...g,
          saved: round2(g.saved + mAmount),
          lastContribMonth: curMonth,
        };
      }
      return g;
    });

    if (updated) {
      setState((prev) => ({
        ...prev,
        transactions: newTransactions,
        recurringBills: newBills,
        goals: newGoals,
      }));
    }
  }, []);

  const shiftMonth = useCallback((delta: number) => {
    setCursor((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  }, []);

  // Actions
  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>, installments = 1) => {
    setState((prev) => {
      const newTxList = [...prev.transactions];
      const newInvestments = [...prev.investments];
      
      const hasInvTag = tx.tags?.some(t => t.toLowerCase().includes('investimento'));
      const isInvestment = tx.type === 'expense' && 
                           (tx.category.toLowerCase().includes('investimento') || hasInvTag) && 
                           !tx.category.toLowerCase().includes('resgate');

      const processInvestment = (amount, date, description) => {
         let existingInvIndex = -1;
         
         const descLower = description.toLowerCase().trim();
         const tagsLower = (tx.tags || []).map(t => t.toLowerCase().trim());
         
         // 1. Exact match by name in description or tags
         existingInvIndex = newInvestments.findIndex(inv => {
            const invName = inv.name.toLowerCase().trim();
            if (descLower === invName) return true;
            if (tagsLower.includes(invName)) return true;
            return false;
         });
         
         // 2. Partial match in description or tags
         if (existingInvIndex === -1) {
             existingInvIndex = newInvestments.findIndex(inv => {
                const invName = inv.name.toLowerCase().trim();
                if (invName.length > 2 && descLower.includes(invName)) return true;
                if (descLower.length > 2 && invName.includes(descLower)) return true;
                
                for (const tag of tagsLower) {
                   if (tag === 'investimento' || tag === 'investimentos') continue;
                   if (tag.length > 2 && invName.includes(tag)) return true;
                   if (invName.length > 2 && tag.includes(invName)) return true;
                }
                return false;
             });
         }

         if (existingInvIndex >= 0) {
            const oldInv = newInvestments[existingInvIndex];
            newInvestments[existingInvIndex] = {
               ...oldInv,
               invested: round2(oldInv.invested + amount),
               current: round2(oldInv.current + amount),
               history: [...(oldInv.history || []), {
                 id: uid(),
                 date: date,
                 type: 'aporte',
                 amount: amount
               }]
            };
         } else {
            let newName = description;
            if (newName.toLowerCase().includes('investimento') && tx.tags && tx.tags.length > 0) {
               const potentialName = tx.tags.find(t => !t.toLowerCase().includes('investimento'));
               if (potentialName) newName = potentialName;
            }
            newInvestments.push({
               id: uid(),
               name: newName || 'Novo Investimento',
               type: 'Outros',
               invested: amount,
               current: amount,
               date: date,
               history: [{
                 id: uid(),
                 date: date,
                 type: 'aporte',
                 amount: amount
               }]
            });
         }
      };

      if (installments > 1) {
        const perAmt = round2(tx.amount / installments);
        const groupId = uid();
        for (let i = 0; i < installments; i++) {
          const finalDate = addMonths(tx.date, i);
          const desc = `${tx.description} (${i + 1}/${installments})`;
          newTxList.push({
            ...tx,
            id: uid(),
            date: finalDate,
            description: desc,
            amount: perAmt,
            groupId,
            attachment: i === 0 ? tx.attachment : null,
          });
          
          if (isInvestment) {
             processInvestment(perAmt, finalDate, desc);
          }
        }
      } else {
        newTxList.push({ ...tx, id: uid() });
        if (isInvestment) {
           processInvestment(tx.amount, tx.date, tx.description || tx.category);
        }
      }
      return { ...prev, transactions: newTxList, investments: newInvestments };
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  const addAccount = useCallback((name: string, type: Account['type'] = 'checking') => {
    setState((prev) => ({
      ...prev,
      accounts: [...prev.accounts, { id: uid(), name, type }],
    }));
  }, []);

  const removeAccount = useCallback((id: string) => {
    setState((prev) => {
      if (prev.accounts.length <= 1) return prev;
      return {
        ...prev,
        accounts: prev.accounts.filter((a) => a.id !== id),
      };
    });
  }, []);

  const addTransfer = useCallback((tr: Omit<Transfer, 'id'>) => {
    setState((prev) => ({
      ...prev,
      transfers: [{ ...tr, id: uid() }, ...prev.transfers],
    }));
  }, []);

  const deleteTransfer = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      transfers: prev.transfers.filter((t) => t.id !== id),
    }));
  }, []);

  const addCard = useCallback((card: Omit<CreditCard, 'id'>) => {
    setState((prev) => ({
      ...prev,
      cards: [...prev.cards, { ...card, id: uid() }],
    }));
  }, []);

  const removeCard = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== id),
      cardPurchases: prev.cardPurchases.filter((p) => p.cardId !== id),
    }));
  }, []);

  const addCardPurchase = useCallback(
    (purchase: Omit<CardPurchase, 'id' | 'paid' | 'invoiceMonth'>, installments = 1, card: CreditCard) => {
      setState((prev) => {
        const newPurchases = [...prev.cardPurchases];
        const groupId = uid();
        const perAmt = round2(purchase.amount / installments);

        const getInvoiceMonth = (c: CreditCard, dateStr: string) => {
          const d = new Date(dateStr + 'T00:00:00');
          if (d.getDate() > c.closingDay) d.setMonth(d.getMonth() + 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        };

        for (let i = 0; i < installments; i++) {
          const pDate = addMonths(purchase.date, i);
          newPurchases.push({
            ...purchase,
            id: uid(),
            date: pDate,
            description: installments > 1 ? `${purchase.description} (${i + 1}/${installments})` : purchase.description,
            amount: perAmt,
            invoiceMonth: getInvoiceMonth(card, pDate),
            paid: false,
            groupId,
          });
        }
        return { ...prev, cardPurchases: newPurchases };
      });
    },
    []
  );

  const payCardInvoice = useCallback((cardId: string, invoiceMonth: string, accountId: string) => {
    setState((prev) => {
      const card = prev.cards.find((c) => c.id === cardId);
      if (!card) return prev;
      const unpaid = prev.cardPurchases.filter((p) => p.cardId === cardId && p.invoiceMonth === invoiceMonth && !p.paid);
      const totalAmt = round2(unpaid.reduce((s, p) => s + p.amount, 0));
      if (totalAmt <= 0) return prev;

      const newTx: Transaction = {
        id: uid(),
        date: date || todayISO(),
        type: 'expense',
        category: 'Cartão de crédito',
        description: `Fatura ${card.name} (${invoiceMonth})`,
        amount: totalAmt,
        accountId: accountId || prev.accounts[0]?.id || 'acc-1',
      };

      const updatedPurchases = prev.cardPurchases.map((p) => {
        if (p.cardId === cardId && p.invoiceMonth === invoiceMonth) {
          return { ...p, paid: true };
        }
        return p;
      });

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        cardPurchases: updatedPurchases,
      };
    });
  }, []);

  const deleteCardPurchase = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      cardPurchases: prev.cardPurchases.filter((p) => p.id !== id),
    }));
  }, []);

  const addRecurringBill = useCallback((bill: Omit<RecurringBill, 'id'>) => {
    setState((prev) => ({
      ...prev,
      recurringBills: [...prev.recurringBills, { ...bill, id: uid() }],
    }));
  }, []);

  const toggleRecurringBill = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      recurringBills: prev.recurringBills.map((b) => (b.id === id ? { ...b, active: !b.active } : b)),
    }));
  }, []);

  const removeRecurringBill = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      recurringBills: prev.recurringBills.filter((b) => b.id !== id),
    }));
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'saved' | 'createdDate'>, initialSaved = 0) => {
    setState((prev) => ({
      ...prev,
      goals: [
        ...prev.goals,
        {
          ...goal,
          id: uid(),
          saved: initialSaved,
          createdDate: todayISO(),
        },
      ],
    }));
  }, []);

  const contributeToGoal = useCallback((goalId: string, amount: number, accountId: string, date?: string) => {
    setState((prev) => {
      const goal = prev.goals.find((g) => g.id === goalId);
      if (!goal || amount <= 0) return prev;

      const newTx: Transaction = {
        id: uid(),
        date: date || todayISO(),
        type: 'expense',
        category: 'Poupança/Metas',
        description: `Aporte: ${goal.name}`,
        amount: round2(amount),
        accountId: accountId || prev.accounts[0]?.id || 'acc-1',
      };

      const updatedGoals = prev.goals.map((g) =>
        g.id === goalId ? { ...g, saved: round2(g.saved + amount) } : g
      );

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        goals: updatedGoals,
      };
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }, []);

  const addInvestment = useCallback((inv: Omit<Investment, 'id' | 'date'>, accountId?: string) => {
    setState((prev) => {
      const newInv = {
         ...inv, 
         id: uid(), 
         date: todayISO(),
         history: [{
           id: uid(),
           date: todayISO(),
           type: 'aporte',
           amount: inv.invested
         }]
      };
      const newInvestments = [...prev.investments, newInv];
      
      if (inv.invested > 0 && accountId) {
        const newTx: Transaction = {
          id: uid(),
          date: todayISO(),
          type: 'expense',
          category: 'Investimentos',
          description: `Investimento: ${inv.name}`,
          amount: round2(inv.invested),
          accountId: accountId,
        };
        return {
          ...prev,
          investments: newInvestments,
          transactions: [newTx, ...prev.transactions],
        };
      }

      return {
        ...prev,
        investments: newInvestments,
      };
    });
  }, []);

  const addInvestmentContribution = useCallback((id: string, amount: number, accountId: string, date: string) => {
    setState((prev) => {
      const inv = prev.investments.find((i) => i.id === id);
      if (!inv || amount <= 0) return prev;

      const newHistory = {
        id: uid(),
        date: date,
        type: 'aporte' as const,
        amount: amount
      };

      const updatedInvestments = prev.investments.map(i => {
        if (i.id === id) {
          return {
             ...i,
             invested: round2(i.invested + amount),
             current: round2(i.current + amount),
             history: [...(i.history || []), newHistory]
          };
        }
        return i;
      });

      const newTx: Transaction = {
        id: uid(),
        date: date,
        type: 'expense',
        category: 'Investimentos',
        description: `Aporte: ${inv.name}`,
        amount: round2(amount),
        accountId: accountId,
      };

      return {
        ...prev,
        investments: updatedInvestments,
        transactions: [newTx, ...prev.transactions],
      };
    });
  }, []);

  const updateInvestmentMarketValue = useCallback((id: string, newCurrentValue: number, date: string) => {
    setState((prev) => {
      const inv = prev.investments.find((i) => i.id === id);
      if (!inv) return prev;

      const diff = newCurrentValue - inv.current;

      const newHistory = {
        id: uid(),
        date: date,
        type: 'atualizacao' as const,
        amount: diff
      };

      const updatedInvestments = prev.investments.map(i => {
        if (i.id === id) {
          return {
             ...i,
             current: round2(newCurrentValue),
             history: [...(i.history || []), newHistory]
          };
        }
        return i;
      });

      return {
        ...prev,
        investments: updatedInvestments
      };
    });
  }, []);

  const updateInvestment = useCallback((id: string, updated: Partial<Investment>) => {
    setState((prev) => ({
      ...prev,
      investments: prev.investments.map((inv) => (inv.id === id ? { ...inv, ...updated } : inv)),
    }));
  }, []);

  const deleteInvestment = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      investments: prev.investments.filter((inv) => inv.id !== id),
    }));
  }, []);

  const withdrawInvestment = useCallback((id: string, amount: number, accountId?: string) => {
    setState((prev) => {
      const inv = prev.investments.find((i) => i.id === id);
      if (!inv || amount <= 0 || amount > inv.current + 0.01) return prev;

      const ratio = amount / inv.current;
      const investedCut = inv.invested * ratio;
      const nextCurrent = Math.max(0, inv.current - amount);
      const nextInvested = Math.max(0, inv.invested - investedCut);

      const newHistory = {
        id: uid(),
        date: todayISO(),
        type: 'resgate' as const,
        amount: amount
      };

      const newTx: Transaction = {
        id: uid(),
        date: todayISO(),
        type: 'income',
        category: 'Resgate de Investimento',
        description: `Resgate de ${inv.name}`,
        amount: round2(amount),
        accountId: accountId || prev.accounts[0]?.id || 'acc-1',
      };

      let updatedInvestments = prev.investments.map((i) => {
        if (i.id === id) {
          return {
             ...i, 
             current: round2(nextCurrent), 
             invested: round2(nextInvested),
             history: [...(i.history || []), newHistory]
          };
        }
        return i;
      });

      // Remove entirely if empty
      updatedInvestments = updatedInvestments.filter((i) => i.current > 0.01);

      return {
        ...prev,
        investments: updatedInvestments,
        transactions: [newTx, ...prev.transactions],
      };
    });
  }, []);
  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
        theme: {
          ...prev.settings.theme,
          ...(newSettings.theme || {}),
        },
      },
    }));
  }, []);

  const resetDataToSample = useCallback(() => {
    const freshData = JSON.parse(JSON.stringify(sampleData));
    setState(freshData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
      if (currentUser) {
        saveStateToSupabase(freshData).catch((err) => {
          console.warn('Failed to sync reset state to Supabase', err);
        });
      }
    } catch (e) {
      console.error('Error in resetDataToSample:', e);
    }
  }, [currentUser]);

  const clearAllData = useCallback(() => {
    const emptyData: AppState = {
      accounts: [
        { id: 'acc-1', name: 'Conta Principal', type: 'checking', color: '#3B82F6' },
      ],
      transactions: [],
      transfers: [],
      cards: [],
      cardPurchases: [],
      recurringBills: [],
      goals: [],
      investments: [],
      settings: {
        ...initialData.settings,
      },
    };
    setState(emptyData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyData));
      if (currentUser) {
        saveStateToSupabase(emptyData).catch((err) => {
          console.warn('Failed to sync clear state to Supabase', err);
        });
      }
    } catch (e) {
      console.error('Error in clearAllData:', e);
    }
  }, [currentUser]);

  const importStateJSON = useCallback((jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        setState({
          ...initialData,
          ...parsed,
          settings: {
            ...initialData.settings,
            ...(parsed.settings || {}),
          },
        });
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON file', e);
    }
    return false;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase não está configurado.');
    }

    const isInIframe = window.self !== window.top;
    const redirectUrl = window.location.origin;

    // Se estiver em iframe (preview), abre uma janela antecipadamente para evitar bloqueador de popup
    let popupWindow: Window | null = null;
    if (isInIframe) {
      popupWindow = window.open('about:blank', 'supabase_google_auth', 'width=500,height=650');
      if (popupWindow) {
        popupWindow.document.write(`
          <div style="font-family:sans-serif; text-align:center; padding:40px; color:#333;">
            <h3>Conectando ao Google...</h3>
            <p style="font-size:13px; color:#666;">Aguarde o redirecionamento seguro da autenticação Supabase.</p>
          </div>
        `);
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isInIframe,
        },
      });

      if (error) {
        if (popupWindow) popupWindow.close();
        if (
          error.message?.includes('provider is not enabled') ||
          error.message?.includes('Unsupported provider') ||
          error.message?.includes('validation_failed')
        ) {
          throw new Error(
            'O provedor Google não está ativado no seu Supabase. Para ativar: Acesse https://supabase.com/dashboard > Authentication > Providers > Google, ative o botão "Enable Google Provider" e insira seu Client ID & Client Secret do Google OAuth.'
          );
        }
        throw error;
      }

      if (isInIframe && data?.url) {
        if (popupWindow && !popupWindow.closed) {
          popupWindow.location.href = data.url;
        } else {
          window.open(data.url, '_blank', 'width=500,height=650');
        }
      } else if (!isInIframe && data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      if (popupWindow && !popupWindow.closed) popupWindow.close();
      console.error('Google Sign in error:', err);
      let msg = err.message || 'Erro ao fazer login com o Google.';
      if (
        msg.includes('provider is not enabled') ||
        msg.includes('Unsupported provider') ||
        msg.includes('validation_failed')
      ) {
        msg =
          'O login com Google não funcionará até que seja ativado no painel do Supabase. Acesse: Dashboard Supabase > Authentication > Providers > Google, ative e cole as chaves do Google Cloud OAuth.';
      }
      throw new Error(msg);
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, pass: string) => {
    try {
      const res = await loginWithApi(email, pass);
      if (res.profile) {
        setUserProfile(res.profile);
        setCurrentUser({
          uid: res.profile.uid,
          email: res.profile.email,
          displayName: res.profile.displayName,
        });
      }
    } catch (err: any) {
      console.error('Email login error:', err);
      throw err;
    }
  }, []);

  const registerWithEmail = useCallback(async (email: string, pass: string, name: string) => {
    try {
      const res = await registerWithApi(email, pass, name);
      if (res.profile) {
        setUserProfile(res.profile);
        setCurrentUser({
          uid: res.profile.uid,
          email: res.profile.email,
          displayName: res.profile.displayName,
        });
      }
    } catch (err: any) {
      console.error('Email register error:', err);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (resetEmail: string, newPass?: string) => {
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) throw new Error('Por favor, informe seu e-mail.');

    if (newPass) {
      if (newPass.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
      }
      await resetPasswordWithApi(cleanEmail, newPass);
      return;
    }

    const meta = import.meta as any;
    const supUrl = meta.env?.VITE_SUPABASE_URL || '';
    const isRealSupabaseUrl = supUrl.includes('supabase.co') || supUrl.includes('supabase.in');
    const supabase = getSupabase();

    if (supabase && isRealSupabaseUrl) {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });
      if (error) {
        if (
          error.status === 500 ||
          error.message?.includes('500') ||
          error.message?.includes('Error sending') ||
          error.name === 'AuthRetryableFetchError'
        ) {
          throw new Error(
            'Erro 500 no Supabase. O serviço gratuito de e-mail do Supabase está desativado ou com limite excedido. Para resolver no Supabase: Vá em Authentication > Settings > SMTP e configure seu servidor de e-mail.'
          );
        }
        if (error.message?.includes('rate limit') || error.status === 429) {
          throw new Error('Limite de e-mails atingido. Aguarde alguns minutos ou configure um SMTP no painel do Supabase.');
        }
        throw error;
      }
      return;
    }

    try {
      await resetPasswordWithApi(cleanEmail);
    } catch (err: any) {
      if (!isRealSupabaseUrl && supUrl) {
        throw new Error(`O VITE_SUPABASE_URL informado ("${supUrl}") é o domínio do site (Netlify), e não a URL da API do Supabase. A URL do Supabase deve estar no formato https://<seu-projeto>.supabase.co.`);
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      removeStoredToken();
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      setUserProfile(null);
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      removeStoredToken();
      setUserProfile(null);
      setCurrentUser(null);
    }
  }, []);

  return {
    state,
    currentUser,
    userProfile,
    isAuthLoading,
    isCloudSynced,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    logout,
    cursor,
    setCursor,
    shiftMonth,
    addTransaction,
    deleteTransaction,
    addAccount,
    removeAccount,
    addTransfer,
    deleteTransfer,
    addCard,
    removeCard,
    addCardPurchase,
    payCardInvoice,
    deleteCardPurchase,
    addRecurringBill,
    toggleRecurringBill,
    removeRecurringBill,
    addGoal,
    contributeToGoal,
    deleteGoal,
    addInvestment,
    addInvestmentContribution,
    updateInvestmentMarketValue,
    updateInvestment,
    deleteInvestment,
    withdrawInvestment,
    updateSettings,
    resetDataToSample,
    clearAllData,
    importStateJSON,
  };
}
