const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /finance\.updateSettings\(\{[\s\S]*?categories: data\.categories\.length \? data\.categories : finance\.state\.settings\.categories,[\s\S]*?\}\);/,
  `finance.updateSettings({
      profileName: data.name,
      categories: data.categories.length ? data.categories : finance.state.settings.categories,
      hasCompletedSetup: true,
    });`
);

code = code.replace(
  /if \(finance\.currentUser\?\.uid\) \{\s*localStorage\.setItem\(`aofinance_onboarded_\$\{finance\.currentUser\.uid\}`\, 'true'\);\s*\}/,
  ``
);

fs.writeFileSync('src/App.tsx', code);
