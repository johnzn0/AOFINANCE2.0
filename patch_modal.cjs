const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionModal.tsx', 'utf8');

// Add the state for destination
code = code.replace(
  "const [installments, setInstallments] = useState('2');",
  "const [installments, setInstallments] = useState('2');\n  const [destinationId, setDestinationId] = useState('');"
);

// Add the new props
code = code.replace(
  "interface TransactionModalProps {",
  "interface TransactionModalProps {\n  onContributeToGoal?: (goalId: string, amount: number, accountId: string, date?: string) => void;\n  onContributeToInvestment?: (id: string, amount: number, accountId: string, date: string) => void;"
);
code = code.replace(
  "  onAddTransaction\n}) => {",
  "  onAddTransaction,\n  onContributeToGoal,\n  onContributeToInvestment\n}) => {"
);

// Modify handleSubmit
const handleSubmitReplace = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountStr);
    if (!amt || amt <= 0 || !description.trim()) return;

    if (type === 'investment' && destinationId) {
       // Is it a goal or investment?
       const goal = state.goals.find(g => g.id === destinationId);
       const inv = state.investments.find(i => i.id === destinationId);
       if (goal && onContributeToGoal) {
          onContributeToGoal(goal.id, amt, accountId, date);
          onClose();
          return;
       } else if (inv && onContributeToInvestment) {
          onContributeToInvestment(inv.id, amt, accountId, date);
          onClose();
          return;
       }
    }

    let finalType: TransactionType = 'expense';
    let finalCategory = category;

    if (type === 'income') finalType = 'income';
    if (type === 'expense') finalType = 'expense';
    if (type === 'transfer') {
      finalType = 'expense';
      finalCategory = 'Transferência';
    }
    if (type === 'investment') {
      finalType = 'expense';
      finalCategory = 'Investimentos';
    }

    onAddTransaction(
      {
        date,
        type: finalType,
        category: finalCategory,
        description: description.trim(),
        amount: amt,
        accountId: accountId,
        tags: tags.length > 0 ? tags : undefined,
      },
      isInstallment ? parseInt(installments) : 1
    );
    
    onClose();
  };`;

code = code.replace(/  const handleSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?onClose\(\);\n  \};/, handleSubmitReplace);

const uiReplace = `{/* Accounts */}
              <div className="grid grid-cols-2 gap-4">
                <div className={type === 'transfer' ? 'col-span-1' : 'col-span-2'}>
                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">
                    {type === 'income' ? 'Conta de Destino' : 'Conta de Origem'}
                  </label>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {state.accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                
                {type === 'transfer' && (
                  <div>
                    <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Conta Destino</label>
                    <select
                      value={toAccountId}
                      onChange={e => setToAccountId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {state.accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {type === 'investment' && (state.goals.length > 0 || state.investments.length > 0) && (
                  <div className="col-span-2 mt-2">
                    <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Destino do Investimento/Meta <span className="text-slate-600 font-normal">(Opcional)</span></label>
                    <select
                      value={destinationId}
                      onChange={e => setDestinationId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Nenhum (Apenas registrar despesa)</option>
                      {state.goals.length > 0 && (
                        <optgroup label="Metas e Objetivos">
                          {state.goals.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {state.investments.length > 0 && (
                        <optgroup label="Investimentos">
                          {state.investments.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}
              </div>`;

code = code.replace(/\{\/\* Accounts \*\/\}[\s\S]*?<\/div>\s*<\/div>/, uiReplace);

fs.writeFileSync('src/components/TransactionModal.tsx', code);
