const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFinance.ts', 'utf8');

code = code.replace(
  "const contributeToGoal = useCallback((goalId: string, amount: number, accountId: string) => {",
  "const contributeToGoal = useCallback((goalId: string, amount: number, accountId: string, date?: string) => {"
);
code = code.replace(
  "date: todayISO(),",
  "date: date || todayISO(),"
);
fs.writeFileSync('src/hooks/useFinance.ts', code);
