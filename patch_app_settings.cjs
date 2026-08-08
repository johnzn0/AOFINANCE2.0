const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/onOpenOnboarding=\{.*?\}\n\s*\/>/g, 'onOpenOnboarding={() => setIsOnboardingOpen(true)}\n              /></Suspense>');

fs.writeFileSync('src/App.tsx', code);
