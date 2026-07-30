const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFinance.ts', 'utf8');

code = code.replace(
  /const handleMessage = async \(event: MessageEvent\) => \{[\s\S]*?\}\s*\}\s*\};\n/,
  `const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_AUTH_SUCCESS' && isMounted) {
        const supabase = getSupabase();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await syncUser(session.user);
          }
        }
      }
    };
`
);

fs.writeFileSync('src/hooks/useFinance.ts', code);
