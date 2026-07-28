import { useState, useEffect, useCallback } from 'react';
import { AppState, Transaction, Account, Transfer, CreditCard, CardPurchase, RecurringBill, Goal, Investment, UserSettings, UserProfile } from '../types';
import { initialData, sampleData } from '../data/initialData';
import { uid, todayISO, round2, addMonths } from '../utils/formatters';
import {
  syncUserWithCloudSql,
  loadStateFromCloudSql,
  saveStateToCloudSql,
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

    async function checkSession() {
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
        const syncUser = async (user: any) => {
          if (!isMounted || !user) return;
          const email = user.email || '';
          const name = user.user_metadata?.full_name || email.split('@')[0];
          try {
            const res = await fetch('/api/auth/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                uid: user.id,
                email,
                displayName: name,
              }),
            });
            const prof = await res.json();
            if (prof && !prof.error) {
              setUserProfile(prof);
              setCurrentUser({
                uid: prof.uid,
                email: prof.email,
                displayName: prof.displayName,
              });
            }
          } catch (e) {
            console.error('Failed to sync Supabase user with Cloud SQL', e);
          }
        };

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
        const supabase = getSupabase();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const email = session.user.email || '';
            const name = session.user.user_metadata?.full_name || email.split('@')[0];
            try {
              const res = await fetch('/api/auth/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: session.user.id, email, displayName: name }),
              });
              const prof = await res.json();
              if (prof && !prof.error) {
                setUserProfile(prof);
                setCurrentUser({ uid: prof.uid, email: prof.email, displayName: prof.displayName });
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    checkSession();

    return () => {
      isMounted = false;
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Load state from Cloud SQL when user changes
  useEffect(() => {
    if (!currentUser) return;
    loadStateFromCloudSql()
      .then((cloudState) => {
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
        }
      })
      .catch((err) => {
        console.warn('Could not load state from Cloud SQL, using local state', err);
      });
  }, [currentUser]);

  // Save to localStorage & Cloud SQL on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (currentUser) {
        saveStateToCloudSql(state)
          .then(() => {
            setIsCloudSynced(true);
          })
          .catch((err) => {
            console.warn('Failed to save state to Cloud SQL', err);
          });
      }
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [state, currentUser]);

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
      if (installments > 1) {
        const perAmt = round2(tx.amount / installments);
        const groupId = uid();
        for (let i = 0; i < installments; i++) {
          newTxList.push({
            ...tx,
            id: uid(),
            date: addMonths(tx.date, i),
            description: `${tx.description} (${i + 1}/${installments})`,
            amount: perAmt,
            groupId,
            attachment: i === 0 ? tx.attachment : null,
          });
        }
      } else {
        newTxList.push({ ...tx, id: uid() });
      }
      return { ...prev, transactions: newTxList };
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
        date: todayISO(),
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

  const contributeToGoal = useCallback((goalId: string, amount: number, accountId: string) => {
    setState((prev) => {
      const goal = prev.goals.find((g) => g.id === goalId);
      if (!goal || amount <= 0) return prev;

      const newTx: Transaction = {
        id: uid(),
        date: todayISO(),
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

  const addInvestment = useCallback((inv: Omit<Investment, 'id' | 'date'>) => {
    setState((prev) => ({
      ...prev,
      investments: [
        ...prev.investments,
        { ...inv, id: uid(), date: todayISO() },
      ],
    }));
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

  const withdrawInvestment = useCallback((id: string, amount: number) => {
    setState((prev) => {
      const inv = prev.investments.find((i) => i.id === id);
      if (!inv || amount <= 0 || amount > inv.current + 0.01) return prev;

      const ratio = amount / inv.current;
      const investedCut = inv.invested * ratio;
      const nextCurrent = Math.max(0, inv.current - amount);
      const nextInvested = Math.max(0, inv.invested - investedCut);

      const newTx: Transaction = {
        id: uid(),
        date: todayISO(),
        type: 'income',
        category: 'Resgate de Investimento',
        description: `Resgate de ${inv.name}`,
        amount: round2(amount),
        accountId: prev.accounts[0]?.id || 'acc-1',
      };

      const updatedInvestments = prev.investments
        .map((i) => (i.id === id ? { ...i, current: round2(nextCurrent), invested: round2(nextInvested) } : i))
        .filter((i) => i.current > 0.01);

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        investments: updatedInvestments,
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
        saveStateToCloudSql(freshData).catch((err) => {
          console.warn('Failed to sync reset state to Cloud SQL', err);
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
        saveStateToCloudSql(emptyData).catch((err) => {
          console.warn('Failed to sync clear state to Cloud SQL', err);
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
    try {
      const supabase = getSupabase();
      if (supabase) {
        const isInIframe = window.self !== window.top;
        const redirectUrl = window.location.origin;

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: isInIframe,
          },
        });

        if (error) throw error;

        if (isInIframe && data?.url) {
          const popup = window.open(data.url, '_blank', 'width=500,height=600');
          if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            window.location.href = data.url;
          }
        }
        return;
      }
      throw new Error('Supabase não está configurado. Por favor, adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no seu .env para ativar a autenticação com Google via Supabase.');
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      throw err;
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
      if (error) throw error;
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
    updateInvestment,
    deleteInvestment,
    withdrawInvestment,
    updateSettings,
    resetDataToSample,
    clearAllData,
    importStateJSON,
  };
}
