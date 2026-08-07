const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFinance.ts', 'utf8');

code = code.replace(
  "id: uid(),\n        date: date || todayISO(),\n        type: 'expense',\n        category: 'Cartão de crédito',",
  "id: uid(),\n        date: todayISO(),\n        type: 'expense',\n        category: 'Cartão de crédito',"
);
fs.writeFileSync('src/hooks/useFinance.ts', code);
