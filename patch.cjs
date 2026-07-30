const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
code = code.replace(
  /<div className="w-10 h-10 rounded-full border-2 border-blue-500 bg-slate-950 flex items-center justify-center text-blue-400 font-serif font-bold text-lg shadow-md shadow-blue-500\/10">[\s\S]*?<\/div>/,
  '<div className="w-10 h-10 rounded-full border-2 border-blue-500 bg-slate-950 flex items-center justify-center text-blue-400 font-serif font-bold text-lg shadow-md shadow-blue-500/10 overflow-hidden">\n          <img src="/favicon.png" alt="AO" className="w-full h-full object-cover" />\n        </div>'
);
fs.writeFileSync('src/components/Sidebar.tsx', code);
