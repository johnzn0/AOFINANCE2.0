const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  /export interface UserSettings \{([\s\S]*?)\}/,
  (match, p1) => `export interface UserSettings {${p1}  hasCompletedSetup?: boolean;\n}`
);

fs.writeFileSync('src/types.ts', code);
