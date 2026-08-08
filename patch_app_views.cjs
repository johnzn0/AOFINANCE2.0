const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<SimulatorView \/>/g, '<Suspense fallback={<FallbackLoader />}><SimulatorView /></Suspense>');
code = code.replace(/<SettingsView/g, '<Suspense fallback={<FallbackLoader />}><SettingsView');
code = code.replace(/onUpdateSettings=\{finance\.updateSettings\}\s*\/>/, 'onUpdateSettings={finance.updateSettings} /></Suspense>');

fs.writeFileSync('src/App.tsx', code);
