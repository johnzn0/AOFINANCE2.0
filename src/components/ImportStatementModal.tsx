import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  TrendingUp,
  TrendingDown,
  Building2,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { Account, Transaction } from '../types';
import { parseOFX, parseCSV, ParsedStatementTransaction } from '../utils/statementParser';
import { predictCategory } from '../utils/categoryClassifier';
import { fmt, formatDate } from '../utils/formatters';

interface ImportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  existingTransactions?: Transaction[];
  onImportTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
}

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Lazer',
  'Educação',
  'Cartão de Crédito',
  'Salário',
  'Investimentos',
  'Transferência',
  'Outras Receitas',
  'Outros Gastos',
];

export const ImportStatementModal: React.FC<ImportStatementModalProps> = ({
  isOpen,
  onClose,
  accounts,
  existingTransactions = [],
  onImportTransactions,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || 'main'
  );
  const [parsedList, setParsedList] = useState<ParsedStatementTransaction[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (fileToProcess: File) => {
    setFile(fileToProcess);
    setErrorMsg(null);

    const filename = fileToProcess.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setErrorMsg('Arquivo vazio ou ilegível.');
        return;
      }

      try {
        let items: ParsedStatementTransaction[] = [];
        if (filename.endsWith('.ofx')) {
          items = parseOFX(content, selectedAccountId, existingTransactions);
        } else if (filename.endsWith('.csv') || filename.endsWith('.txt')) {
          items = parseCSV(content, selectedAccountId, existingTransactions);
        } else {
          // Try OFX then CSV fallback
          items = parseOFX(content, selectedAccountId, existingTransactions);
          if (items.length === 0) {
            items = parseCSV(content, selectedAccountId, existingTransactions);
          }
        }

        if (items.length === 0) {
          setErrorMsg(
            'Nenhuma transação válida foi encontrada no extrato. Certifique-se de que o arquivo é .OFX ou .CSV.'
          );
        } else {
          setParsedList(items);
        }
      } catch (err: any) {
        console.error('Error parsing statement:', err);
        setErrorMsg('Erro ao ler o arquivo de extrato. Formato incompatível.');
      }
    };

    reader.readAsText(fileToProcess, 'ISO-8859-1'); // Compatible with Brazilian banking files
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleToggleSelectAll = () => {
    const allSelected = parsedList.every((item) => item.selected);
    setParsedList((prev) =>
      prev.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  const handleToggleItem = (id: string) => {
    setParsedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleUpdateItem = (
    id: string,
    field: keyof ParsedStatementTransaction,
    value: any
  ) => {
    setParsedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const selectedItems = parsedList.filter((item) => item.selected);
  const totalIncome = selectedItems
    .filter((i) => i.type === 'income')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = selectedItems
    .filter((i) => i.type === 'expense')
    .reduce((sum, i) => sum + i.amount, 0);

  const handleConfirmImport = () => {
    if (selectedItems.length === 0) return;

    const formattedForImport: Omit<Transaction, 'id'>[] = selectedItems.map(
      (item) => ({
        date: item.date,
        type: item.type,
        category: item.category,
        description: item.description,
        amount: item.amount,
        accountId: selectedAccountId,
        tags: ['Extrato Importado'],
      })
    );

    onImportTransactions(formattedForImport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Importar Extrato Bancário
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  OFX / CSV
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Lançamento automático inteligente com categorização por IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Account selector & Drag Drop area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Conta de Destino
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Os lançamentos importados serão vinculados a esta conta.
              </p>
            </div>

            <div className="md:col-span-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".ofx,.csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : file
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                }`}
              >
                <Upload className="w-6 h-6 text-blue-400 animate-bounce" />
                <div className="text-sm font-medium text-slate-200">
                  {file ? (
                    <span className="text-emerald-400 font-semibold">{file.name}</span>
                  ) : (
                    'Arraste e solte seu extrato (.OFX ou .CSV) aqui'
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Suporta arquivos de extrato Itaú, Bradesco, Nubank, Santander, Inter, BB e Caixa.
                </p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Transactions Preview */}
          {parsedList.length > 0 && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Receitas</div>
                    <div className="text-sm font-bold text-emerald-400">{fmt(totalIncome)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Despesas</div>
                    <div className="text-sm font-bold text-rose-400">{fmt(totalExpense)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-l border-slate-800 pl-4">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Selecionados</div>
                    <div className="text-sm font-bold text-slate-200">
                      {selectedItems.length} de {parsedList.length}
                    </div>
                  </div>
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {parsedList.every((i) => i.selected) ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" /> Desmarcar
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5" /> Marcar Todos
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-800/60">
                  {parsedList.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 flex flex-wrap md:flex-nowrap items-center gap-3 text-sm transition ${
                        item.selected ? 'bg-slate-900/50' : 'opacity-40 bg-slate-950'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleItem(item.id)}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />

                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => handleUpdateItem(item.id, 'date', e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500 w-32"
                      />

                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 font-medium focus:outline-none focus:border-blue-500 min-w-[160px]"
                      />

                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500 max-w-[150px]"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <div
                        className={`text-xs font-bold w-24 text-right shrink-0 ${
                          item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.type === 'income' ? '+' : '-'} {fmt(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition font-medium"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={selectedItems.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" />
            Importar {selectedItems.length} {selectedItems.length === 1 ? 'Lançamento' : 'Lançamentos'}
          </button>
        </div>
      </div>
    </div>
  );
};
