const fs = require('fs');
const file = 'src/components/views/InvestmentsView.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetProps = `  onAddInvestment: (inv: Omit<Investment, 'id' | 'date'>) => void;`;
const replacementProps = `  onAddInvestment: (inv: Omit<Investment, 'id' | 'date'>, accountId?: string) => void;`;
code = code.replace(targetProps, replacementProps);

const targetState = `  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');`;
const replacementState = `  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');
  const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');`;
code = code.replace(targetState, replacementState);

const targetSubmit = `    if (editingId) {
      onUpdateInvestment(editingId, {
        name: name.trim(),
        type,
        invested: invVal,
        current: curVal,
      });
      setEditingId(null);
    } else {
      onAddInvestment({
        name: name.trim(),
        type,
        invested: invVal,
        current: curVal,
      });
    }`;

const replacementSubmit = `    if (editingId) {
      onUpdateInvestment(editingId, {
        name: name.trim(),
        type,
        invested: invVal,
        current: curVal,
      });
      setEditingId(null);
    } else {
      onAddInvestment({
        name: name.trim(),
        type,
        invested: invVal,
        current: curVal,
      }, accountId);
    }`;
code = code.replace(targetSubmit, replacementSubmit);

const targetHtml = `          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
              Valor Atual (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
            />
          </div>`;

const replacementHtml = `          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
              Valor Atual (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
            />
          </div>
          {!editingId && (
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                Conta de Origem
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
              >
                {state.accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}`;
code = code.replace(targetHtml, replacementHtml);

const targetFormClass = `        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">`;
const replacementFormClass = `        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">`;
code = code.replace(targetFormClass, replacementFormClass);

const targetColspan = `          <div className="sm:col-span-5 flex justify-end gap-2 pt-2">`;
const replacementColspan = `          <div className="sm:col-span-full flex justify-end gap-2 pt-2">`;
code = code.replace(targetColspan, replacementColspan);

fs.writeFileSync(file, code);
console.log('InvestmentsView JS and HTML patched');
