const fs = require('fs');
const file = 'src/components/views/GoalsView.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">`,
  `        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-slate-700 transition">`
);
code = code.replace(
  `        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">`,
  `        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-slate-700 transition">`
);
code = code.replace(
  `        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">`,
  `        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-slate-700 transition">`
);

fs.writeFileSync(file, code);
