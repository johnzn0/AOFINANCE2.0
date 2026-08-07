const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetImport = `import { WithdrawModal } from './components/WithdrawModal';\n`;
code = code.replace(targetImport, '');

const targetModal = `      <WithdrawModal
        investment={selectedInvForWithdraw}
        onClose={() => setWithdrawInvId(null)}
        onConfirm={finance.withdrawInvestment}
      />`;
code = code.replace(targetModal, '');

fs.writeFileSync(file, code);
