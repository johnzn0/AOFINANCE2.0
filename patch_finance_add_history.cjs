const fs = require('fs');
const file = 'src/hooks/useFinance.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `         if (existingInvIndex >= 0) {
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
         }`;

const replacement = `         if (existingInvIndex >= 0) {
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
         }`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
