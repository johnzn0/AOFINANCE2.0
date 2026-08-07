const fs = require('fs');
const file = 'src/types.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `export interface Investment {
  id: string;
  name: string;
  type: string;
  invested: number;
  current: number;
  date: string;
}`;

const replacement = `export type InvestmentHistoryType = 'aporte' | 'resgate' | 'atualizacao';

export interface InvestmentHistory {
  id: string;
  date: string;
  type: InvestmentHistoryType;
  amount: number;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  invested: number;
  current: number;
  date: string;
  history?: InvestmentHistory[];
}`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
