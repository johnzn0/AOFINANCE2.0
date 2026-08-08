const fs = require('fs');
let code = fs.readFileSync('src/components/views/ReportsView.tsx', 'utf8');

code = code.replace("import React from 'react';", "import React, { useMemo } from 'react';");

const target = code.match(/const allTx = state\.transactions;[\s\S]*?const tagEntries = Object\.entries\(tagTotals\)\.sort\(\(a, b\) => b\[1\] - a\[1\]\);/)[0];

const replacement = `const { 
    totalIncome, totalExpense, netProfit, 
    highestExpense, highestIncome, 
    monthsData, catTotalSum, catEntries, tagEntries 
  } = useMemo(() => {
    const allTx = state.transactions;
    const totalIncome = allTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netProfit = totalIncome - totalExpense;

    const highestExpense = [...allTx].filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0];
    const highestIncome = [...allTx].filter(t => t.type === 'income').sort((a, b) => b.amount - a.amount)[0];

    const now = new Date();
    const monthsData = [];
    const currentInvTotal = state.investments.reduce((s, i) => s + i.current, 0);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
      const bankBalanceUpTo = allTx.filter(t => t.date <= endOfMonth).reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      monthsData.push({ label, Patrimonio: bankBalanceUpTo + currentInvTotal });
    }

    const catTotals: Record<string, number> = {};
    allTx.filter(t => t.type === 'expense').forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });
    const catTotalSum = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1;
    const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

    const tagTotals: Record<string, number> = {};
    allTx.filter(t => t.type === 'expense').forEach(t => {
      (t.tags || []).forEach(tag => {
        tagTotals[tag] = (tagTotals[tag] || 0) + t.amount;
      });
    });
    const tagEntries = Object.entries(tagTotals).sort((a, b) => b[1] - a[1]);

    return { totalIncome, totalExpense, netProfit, highestExpense, highestIncome, monthsData, catTotalSum, catEntries, tagEntries };
  }, [state.transactions, state.investments]);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/views/ReportsView.tsx', code);
