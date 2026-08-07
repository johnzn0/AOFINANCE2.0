const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFinance.ts', 'utf8');

const targetFunc = "const contributeToGoal = useCallback((goalId: string, amount: number, accountId: string, date?: string) => {";
const startIdx = code.indexOf(targetFunc);
if (startIdx !== -1) {
  const endIdx = code.indexOf("const deleteGoal", startIdx);
  let chunk = code.substring(startIdx, endIdx);
  chunk = chunk.replace("date: todayISO(),", "date: date || todayISO(),");
  code = code.substring(0, startIdx) + chunk + code.substring(endIdx);
  fs.writeFileSync('src/hooks/useFinance.ts', code);
}
