const fs = require('fs');
const file = 'src/hooks/useFinance.ts';
let code = fs.readFileSync(file, 'utf8');

const target = code.substring(
  code.indexOf("  const addInvestment = useCallback"),
  code.indexOf("  const updateSettings = useCallback")
);

const replacement = `  const addInvestment = useCallback((inv: Omit<Investment, 'id' | 'date'>, accountId?: string) => {
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
          description: \`Investimento: \${inv.name}\`,
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
        description: \`Aporte: \${inv.name}\`,
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
        description: \`Resgate de \${inv.name}\`,
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
`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
