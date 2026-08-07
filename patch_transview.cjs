const fs = require('fs');
let code = fs.readFileSync('src/components/views/TransactionsView.tsx', 'utf8');

code = code.replace(
  "export const TransactionsView: React.FC<TransactionsViewProps> = ({\n  state,\n  onAddTransaction,\n  onDeleteTransaction,\n}) => {",
  "export const TransactionsView: React.FC<TransactionsViewProps> = ({\n  state,\n  onAddTransaction,\n  onDeleteTransaction,\n  onContributeToGoal,\n  onContributeToInvestment\n}) => {"
);

fs.writeFileSync('src/components/views/TransactionsView.tsx', code);
