const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFinance.ts', 'utf8');

code = code.replace(
  /loadStateFromSupabase\(\)\s*\.then\(\(cloudState\) => \{\s*if \(cloudState\) \{[\s\S]*?setIsCloudSynced\(true\);\s*\}\s*\}\)/,
  `loadStateFromSupabase()
      .then((cloudState) => {
        if (cloudState) {
          setState({
            ...initialData,
            ...cloudState,
            settings: {
              ...initialData.settings,
              ...(cloudState.settings || {}),
            },
          });
        }
        setIsCloudSynced(true);
      })`
);

fs.writeFileSync('src/hooks/useFinance.ts', code);
