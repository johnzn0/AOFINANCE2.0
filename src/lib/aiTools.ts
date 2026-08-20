import { AppState } from '../types';

export function executeAITool(functionName: string, args: any, state: AppState): any {
  switch (functionName) {
    case 'get_financial_summary': {
      const income = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const balance = income - expense;
      const invested = state.investments.reduce((s, i) => s + i.current, 0);
      return {
        income,
        expense,
        balance,
        invested,
        netWorth: balance + invested,
        goalsCount: state.goals.length,
        transactionsCount: state.transactions.length
      };
    }
    case 'get_transactions': {
      let filtered = [...state.transactions];
      if (args.type) {
        filtered = filtered.filter(t => t.type === args.type);
      }
      if (args.category) {
        filtered = filtered.filter(t => t.category.toLowerCase() === args.category.toLowerCase());
      }
      // Sort by date desc
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const limit = args.limit || 10;
      return {
        totalFound: filtered.length,
        results: filtered.slice(0, limit).map(t => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          category: t.category,
          type: t.type
        }))
      };
    }
    case 'get_goals': {
      return state.goals.map(g => ({
        name: g.name,
        target: g.target,
        saved: g.saved
      }));
    }
    default:
      return { error: `Tool ${functionName} not found or not implemented.` };
  }
}
