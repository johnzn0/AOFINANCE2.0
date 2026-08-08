import { predictCategory } from './categoryClassifier';
import { Transaction } from '../types';

export interface ParsedStatementTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  accountId: string;
  selected: boolean;
  fitid?: string;
  isAutoCategorized?: boolean;
}

// Helper to infer category based on transaction description
export function inferCategory(description: string, type: 'income' | 'expense'): string {
  const desc = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (type === 'income') {
    if (desc.includes('salario') || desc.includes('vencimento') || desc.includes('folha') || desc.includes('provento')) {
      return 'Salário';
    }
    if (desc.includes('rendimento') || desc.includes('dividendo') || desc.includes('juros') || desc.includes('fii')) {
      return 'Investimentos';
    }
    if (desc.includes('pix') || desc.includes('transferencia') || desc.includes('ted') || desc.includes('doc')) {
      return 'Transferência';
    }
    if (desc.includes('reembolso') || desc.includes('estorno') || desc.includes('cashback')) {
      return 'Outras Receitas';
    }
    return 'Outras Receitas';
  } else {
    if (desc.includes('supermercado') || desc.includes('mercado') || desc.includes('carrefour') || desc.includes('pao de acucar') || desc.includes('atacad') || desc.includes('hortifruti')) {
      return 'Alimentação';
    }
    if (desc.includes('uber') || desc.includes('99') || desc.includes('posto') || desc.includes('combustivel') || desc.includes('estacionamento') || desc.includes('pedagio')) {
      return 'Transporte';
    }
    if (desc.includes('restaurante') || desc.includes('ifood') || desc.includes('burger') || desc.includes('mcdonald') || desc.includes('padaria') || desc.includes('cafe')) {
      return 'Alimentação';
    }
    if (desc.includes('farmacia') || desc.includes('drogaria') || desc.includes('hospital') || desc.includes('medico') || desc.includes('consulta') || desc.includes('laboratorio')) {
      return 'Saúde';
    }
    if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('cinema') || desc.includes('steam') || desc.includes('playstation') || desc.includes('amazon prime')) {
      return 'Lazer';
    }
    if (desc.includes('luz') || desc.includes('enel') || desc.includes('cemig') || desc.includes('agua') || desc.includes('sabesp') || desc.includes('internet') || desc.includes('claro') || desc.includes('vivo') || desc.includes('tim')) {
      return 'Moradia';
    }
    if (desc.includes('aluguel') || desc.includes('condominio') || desc.includes('iptu')) {
      return 'Moradia';
    }
    if (desc.includes('fatura') || desc.includes('cartao') || desc.includes('itau') || desc.includes('bradesco') || desc.includes('nubank') || desc.includes('santander')) {
      return 'Cartão de Crédito';
    }
    if (desc.includes('curso') || desc.includes('faculdade') || desc.includes('escola') || desc.includes('udemy') || desc.includes('livro')) {
      return 'Educação';
    }
    return 'Outros Gastos';
  }
}

// Format OFX date string (e.g. 20260801120000[-3:BRT] or 20260801) into YYYY-MM-DD
function parseOFXDate(rawDate: string): string {
  const clean = rawDate.trim().replace(/[^0-9]/g, '');
  if (clean.length >= 8) {
    const year = clean.substring(0, 4);
    const month = clean.substring(4, 6);
    const day = clean.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().slice(0, 10);
}

export function parseOFX(content: string, defaultAccountId = 'main', userTransactions: Transaction[] = []): ParsedStatementTransaction[] {
  const transactions: ParsedStatementTransaction[] = [];

  // Match STMTTRN blocks
  const matches = content.match(/<STMTTRN>[\s\S]*?(?:<\/STMTTRN>|(?=<STMTTRN>)|(?=<\/BANKTRANLIST>)|$)/gi) || [];

  matches.forEach((block, index) => {
    const trnTypeMatch = block.match(/<TRNTYPE>([^<\r\n]+)/i);
    const dtPostedMatch = block.match(/<DTPOSTED>([^<\r\n]+)/i);
    const trnAmtMatch = block.match(/<TRNAMT>([^<\r\n]+)/i);
    const fitidMatch = block.match(/<FITID>([^<\r\n]+)/i);
    const memoMatch = block.match(/<MEMO>([^<\r\n]+)/i);
    const nameMatch = block.match(/<NAME>([^<\r\n]+)/i);

    if (trnAmtMatch && dtPostedMatch) {
      const rawAmt = trnAmtMatch[1].trim().replace(',', '.');
      const numAmt = parseFloat(rawAmt);
      if (isNaN(numAmt)) return;

      const rawType = trnTypeMatch ? trnTypeMatch[1].trim().toUpperCase() : '';
      let type: 'income' | 'expense' = numAmt >= 0 ? 'income' : 'expense';
      if (rawType === 'CREDIT' || rawType === 'DEP') type = 'income';
      if (rawType === 'DEBIT' || rawType === 'PAYMENT') type = 'expense';

      const absAmount = Math.abs(numAmt);
      const date = parseOFXDate(dtPostedMatch[1]);
      const description = (memoMatch ? memoMatch[1].trim() : nameMatch ? nameMatch[1].trim() : 'Lançamento OFX').replace(/&amp;/g, '&');
      const fitid = fitidMatch ? fitidMatch[1].trim() : undefined;
      
      const prediction = predictCategory(description, type, userTransactions);
      const category = prediction.category;

      transactions.push({
        id: `ofx-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
        date,
        description,
        amount: absAmount,
        type,
        category,
        accountId: defaultAccountId,
        selected: true,
        fitid,
        isAutoCategorized: true,
      });
    }
  });

  return transactions;
}

// Parse Brazilian date (DD/MM/YYYY) or YYYY-MM-DD
function parseCSVDate(rawDate: string): string {
  const str = rawDate.trim().split(' ')[0];
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }
  }
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        return `${year}-${month}-${day}`;
      }
    }
  }
  return new Date().toISOString().slice(0, 10);
}

// Parse currency string like "1.234,56", "-150,00", "R$ 50.00"
function parseCSVAmount(rawAmt: string): number {
  let clean = rawAmt.replace('R$', '').replace('$', '').trim();
  if (clean.includes(',') && clean.includes('.')) {
    // e.g. 1.234,56 -> 1234.56
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    // e.g. 1234,56 -> 1234.56
    clean = clean.replace(',', '.');
  }
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

export function parseCSV(content: string, defaultAccountId = 'main', userTransactions: Transaction[] = []): ParsedStatementTransaction[] {
  const transactions: ParsedStatementTransaction[] = [];
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) return transactions;

  // Detect delimiter
  const sample = lines[0];
  const delimiter = sample.includes(';') ? ';' : sample.includes('\t') ? '\t' : ',';

  // Check header row indices
  const headerCols = lines[0].toLowerCase().split(delimiter).map(c => c.trim().replace(/"/g, ''));
  
  let dateIdx = headerCols.findIndex(c => c.includes('data') || c.includes('date'));
  let descIdx = headerCols.findIndex(c => c.includes('desc') || c.includes('historico') || c.includes('memo') || c.includes('title') || c.includes('pago'));
  let amtIdx = headerCols.findIndex(c => c.includes('valor') || c.includes('amount') || c.includes('val'));
  let catIdx = headerCols.findIndex(c => c.includes('categ') || c.includes('cat'));
  let typeIdx = headerCols.findIndex(c => c.includes('tipo') || c.includes('type'));

  const hasHeader = dateIdx !== -1 || amtIdx !== -1;
  const startIndex = hasHeader ? 1 : 0;

  if (!hasHeader) {
    dateIdx = 0;
    descIdx = 1;
    amtIdx = 2;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 2) continue;

    const rawDate = cols[dateIdx >= 0 ? dateIdx : 0] || '';
    const rawDesc = cols[descIdx >= 0 ? descIdx : 1] || 'Lançamento CSV';
    const rawAmtStr = cols[amtIdx >= 0 ? amtIdx : 2] || '0';
    const rawCat = catIdx >= 0 ? cols[catIdx] : undefined;
    const rawType = typeIdx >= 0 ? cols[typeIdx] : undefined;

    const parsedDate = parseCSVDate(rawDate);
    const numAmt = parseCSVAmount(rawAmtStr);
    if (numAmt === 0 && rawDesc === '') continue;

    let type: 'income' | 'expense' = numAmt >= 0 ? 'income' : 'expense';
    if (rawType) {
      const tLower = rawType.toLowerCase();
      if (tLower.includes('receita') || tLower.includes('credit') || tLower.includes('entrada')) type = 'income';
      if (tLower.includes('despesa') || tLower.includes('debit') || tLower.includes('saida')) type = 'expense';
    }

    const absAmount = Math.abs(numAmt);
    const category = rawCat && rawCat.length > 2 ? rawCat : predictCategory(rawDesc, type, userTransactions).category;

    transactions.push({
      id: `csv-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      date: parsedDate,
      description: rawDesc,
      amount: absAmount,
      type,
      category,
      accountId: defaultAccountId,
      selected: true,
      isAutoCategorized: true,
    });
  }

  return transactions;
}
