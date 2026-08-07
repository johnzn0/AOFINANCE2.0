const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "<TransactionsView\n                state={finance.state}\n                onAddTransaction={finance.addTransaction}\n                onDeleteTransaction={finance.deleteTransaction}\n              />",
  "<TransactionsView\n                state={finance.state}\n                onAddTransaction={finance.addTransaction}\n                onDeleteTransaction={finance.deleteTransaction}\n                onContributeToGoal={finance.contributeToGoal}\n                onContributeToInvestment={finance.addInvestmentContribution}\n              />"
);

fs.writeFileSync('src/App.tsx', code);
