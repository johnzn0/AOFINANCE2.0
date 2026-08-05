const fs = require('fs');
const file = 'src/components/views/GoalsView.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetProps = `  onAddGoal: (
    goal: Omit<Goal, 'id' | 'saved' | 'createdDate'>,
    initialSaved?: number
  ) => void;`;

const replacementProps = `  onAddGoal: (
    goal: Omit<Goal, 'id' | 'saved' | 'createdDate'>,
    initialSaved?: number,
    accountId?: string
  ) => void;`;

code = code.replace(targetProps, replacementProps);
fs.writeFileSync(file, code);
console.log('GoalsView Props patched');
