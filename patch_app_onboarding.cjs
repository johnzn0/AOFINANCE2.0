const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\/\/ Auto-open Setup Onboarding Wizard on first time login[\s\S]*?\}, \[finance\.currentUser\?\.uid, finance\.userProfile\?\.status\]\);/,
  `// Auto-open Setup Onboarding Wizard on first time login
  React.useEffect(() => {
    if (finance.currentUser?.uid && finance.userProfile?.status === 'approved' && finance.isCloudSynced) {
      if (!finance.state.settings.hasCompletedSetup) {
        setIsOnboardingOpen(true);
      }
    }
  }, [finance.currentUser?.uid, finance.userProfile?.status, finance.isCloudSynced, finance.state.settings.hasCompletedSetup]);`
);

fs.writeFileSync('src/App.tsx', code);
