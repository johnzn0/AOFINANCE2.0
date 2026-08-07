const fs = require('fs');
const file = 'src/hooks/useFinance.ts';
let code = fs.readFileSync(file, 'utf8');

const targetAddTransaction = `  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>, installments = 1) => {
    setState((prev) => {
      const newTxList = [...prev.transactions];
      const newInvestments = [...prev.investments];
      
      const hasInvTag = tx.tags?.some(t => t.toLowerCase().includes('investimento'));
      const isInvestment = tx.type === 'expense' && 
                           (tx.category.toLowerCase().includes('investimento') || hasInvTag) && 
                           !tx.category.toLowerCase().includes('resgate');

      const processInvestment = (amount, date, description) => {
         const existingInvIndex = newInvestments.findIndex(inv => {
            const invName = inv.name.toLowerCase();
            const desc = description.toLowerCase();
            if (desc === invName) return true;
            if (tx.tags?.some(tag => tag.toLowerCase() === invName)) return true;
            if (desc.includes(invName) && invName.length > 3) return true;
            return false;
         });

         if (existingInvIndex >= 0) {
            newInvestments[existingInvIndex] = {
               ...newInvestments[existingInvIndex],
               invested: round2(newInvestments[existingInvIndex].invested + amount),
               current: round2(newInvestments[existingInvIndex].current + amount),
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
               date: date
            });
         }
      };

      if (installments > 1) {
        const perAmt = round2(tx.amount / installments);
        const groupId = uid();
        for (let i = 0; i < installments; i++) {
          const finalDate = addMonths(tx.date, i);
          const desc = \`\${tx.description} (\${i + 1}/\${installments})\`;
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
  }, []);`;

const replacementAddTransaction = `  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>, installments = 1) => {
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
            newInvestments[existingInvIndex] = {
               ...newInvestments[existingInvIndex],
               invested: round2(newInvestments[existingInvIndex].invested + amount),
               current: round2(newInvestments[existingInvIndex].current + amount),
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
               date: date
            });
         }
      };

      if (installments > 1) {
        const perAmt = round2(tx.amount / installments);
        const groupId = uid();
        for (let i = 0; i < installments; i++) {
          const finalDate = addMonths(tx.date, i);
          const desc = \`\${tx.description} (\${i + 1}/\${installments})\`;
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
  }, []);`;

code = code.replace(targetAddTransaction, replacementAddTransaction);
fs.writeFileSync(file, code);
console.log('useFinance add transaction smart patched v2');
