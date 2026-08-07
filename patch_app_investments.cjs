const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `<InvestmentsView
                state={finance.state}
                onAddInvestment={finance.addInvestment}
                onUpdateInvestment={finance.updateInvestment}
                onDeleteInvestment={finance.deleteInvestment}
                onOpenWithdrawModal={(id) => setWithdrawInvId(id)}
              />`;

const replacement = `<InvestmentsView
                state={finance.state}
                onAddInvestment={finance.addInvestment}
                onAddInvestmentContribution={finance.addInvestmentContribution}
                onUpdateInvestmentMarketValue={finance.updateInvestmentMarketValue}
                onUpdateInvestment={finance.updateInvestment}
                onDeleteInvestment={finance.deleteInvestment}
                onWithdrawInvestment={finance.withdrawInvestment}
              />`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
