const fs = require('fs');
const file = 'src/hooks/useFinance.ts';
let code = fs.readFileSync(file, 'utf8');

const targetAddTransaction = `  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>, installments = 1) => {
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
            description: \`\${tx.description} (\${i + 1}/\${installments})\`,
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
  }, []);`;

const replacementAddTransaction = `  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>, installments = 1) => {
    setState((prev) => {
      const newTxList = [...prev.transactions];
      const newInvestments = [...prev.investments];
      
      const isInvestment = tx.type === 'expense' && 
                           tx.category.toLowerCase().includes('investimento') && 
                           !tx.category.toLowerCase().includes('resgate');

      if (installments > 1) {
        const perAmt = round2(tx.amount / installments);
        const groupId = uid();
        for (let i = 0; i < installments; i++) {
          const finalDate = addMonths(tx.date, i);
          newTxList.push({
            ...tx,
            id: uid(),
            date: finalDate,
            description: \`\${tx.description} (\${i + 1}/\${installments})\`,
            amount: perAmt,
            groupId,
            attachment: i === 0 ? tx.attachment : null,
          });
          
          if (isInvestment) {
             newInvestments.push({
               id: uid(),
               name: \`\${tx.description} (\${i + 1}/\${installments})\`,
               type: 'Outros',
               invested: perAmt,
               current: perAmt,
               date: finalDate
             });
          }
        }
      } else {
        newTxList.push({ ...tx, id: uid() });
        if (isInvestment) {
           newInvestments.push({
             id: uid(),
             name: tx.description || tx.category,
             type: 'Outros',
             invested: tx.amount,
             current: tx.amount,
             date: tx.date
           });
        }
      }
      return { ...prev, transactions: newTxList, investments: newInvestments };
    });
  }, []);`;

code = code.replace(targetAddTransaction, replacementAddTransaction);

const targetAddInvestment = `  const addInvestment = useCallback((inv: Omit<Investment, 'id' | 'date'>) => {
    setState((prev) => ({
      ...prev,
      investments: [
        ...prev.investments,
        { ...inv, id: uid(), date: todayISO() },
      ],
    }));
  }, []);`;

const replacementAddInvestment = `  const addInvestment = useCallback((inv: Omit<Investment, 'id' | 'date'>, accountId?: string) => {
    setState((prev) => {
      const newInv = { ...inv, id: uid(), date: todayISO() };
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
  }, []);`;

code = code.replace(targetAddInvestment, replacementAddInvestment);

fs.writeFileSync(file, code);
console.log('useFinance add handlers patched');
