const fs = require('fs');
const file = 'src/components/views/TransactionsView.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetImport = `import { fmt, formatDate, todayISO } from '../../utils/formatters';`;
const newImport = `import { fmt, formatDate, todayISO, calculateAccountBalance } from '../../utils/formatters';`;

if (code.includes(targetImport)) {
   code = code.replace(targetImport, newImport);
}

const targetBalance = `let runningBalance = state.transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);`;
const newBalance = `let runningBalance = state.accounts.reduce((sum, acc) => sum + calculateAccountBalance(acc.id, state), 0);`;

code = code.replace(targetBalance, newBalance);
fs.writeFileSync(file, code);
