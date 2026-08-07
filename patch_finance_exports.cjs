const fs = require('fs');
const file = 'src/hooks/useFinance.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `    addInvestment,
    updateInvestment,
    deleteInvestment,
    withdrawInvestment,`;

const replacement = `    addInvestment,
    addInvestmentContribution,
    updateInvestmentMarketValue,
    updateInvestment,
    deleteInvestment,
    withdrawInvestment,`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
