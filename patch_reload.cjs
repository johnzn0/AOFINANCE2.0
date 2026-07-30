const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFinance.ts', 'utf8');

code = code.replace(
  /const handleMessage = async \(event: MessageEvent\) => \{[\s\S]*?\}\s*\}\s*\};\n/,
  `const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_AUTH_SUCCESS' && isMounted) {
         window.location.reload();
      }
    };
`
);

fs.writeFileSync('src/hooks/useFinance.ts', code);
