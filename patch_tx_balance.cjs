const fs = require('fs');
const file = 'src/components/views/TransactionsView.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `let runningBalance = state.accounts.reduce((sum, acc) => sum + acc.balance, 0);`;
const replacement = `let runningBalance = state.transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
