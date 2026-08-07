const fs = require('fs');
const file = 'src/components/views/TransactionsView.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetImport = `import { fmt, formatDate, todayISO } from '../../utils/formatters';`;
const newImport = `import { fmt, formatDate, todayISO } from '../../utils/formatters';
import { TransactionModal } from '../TransactionModal';`;

code = code.replace(targetImport, newImport);

const targetReturn = `      {/* Transactions List */}`;
const newReturn = `      <TransactionModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        state={state} 
        onAddTransaction={onAddTransaction} 
      />

      {/* Transactions List */}`;

code = code.replace(targetReturn, newReturn);
fs.writeFileSync(file, code);
