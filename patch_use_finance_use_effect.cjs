const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFinance.ts', 'utf8');

const regex = /useEffect\(\(\) => \{\n\s*let isMounted = true;\n\s*const checkSession = async \(\) => \{[\s\S]*?window\.removeEventListener\('message', handleMessage\);\n\s*\};\n\s*\}, \[\]\);/g;

code = code.replace(regex, `useEffect(() => {
    let isMounted = true;
    
    const syncUser = async (user: any) => {
      if (!isMounted || !user) return;
      try {
        const prof = await getCurrentUserProfile();
        if (prof) {
          setUserProfile({
            uid: prof.uid,
            email: prof.email,
            displayName: prof.displayName,
            role: prof.role,
            status: prof.status,
            plan: prof.plan,
            createdAt: user.created_at || new Date().toISOString(),
            photoURL: user.user_metadata?.avatar_url,
          } as any);
          setCurrentUser({
            uid: prof.uid,
            email: prof.email,
            displayName: prof.displayName,
          });
        }
      } catch (e) {
        console.error('Failed to sync user', e);
      }
    };

    const checkSession = async () => {
      // If running inside a popup opened by Google OAuth:
      if (window.opener && window.opener !== window && (window.location.hash.includes('access_token') || window.location.search.includes('code'))) {
        const supabase = getSupabase();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            try {
              window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
            } catch (e) {}
            window.close();
            return;
          }
        }
      }

      try {
        const profile = await getCurrentUserProfile();
        if (profile && isMounted) {
          setUserProfile({ ...profile, createdAt: new Date().toISOString() } as any);
          setCurrentUser({
            uid: profile.uid,
            email: profile.email,
            displayName: profile.displayName,
          });
          setIsAuthLoading(false);
          return;
        }
      } catch (err) {
        // No valid local token
      }

      const supabase = getSupabase();
      if (supabase) {
        const { data: subData } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;
          if (session?.user) {
            await syncUser(session.user);
            // If this is a popup, notify parent and close
            if (window.opener && window.opener !== window) {
              try {
                window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
              } catch (e) {}
              window.close();
              return;
            }
          }
          setIsAuthLoading(false);
        });

        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await syncUser(session.user);
          setIsAuthLoading(false);
          return;
        }
      }

      setIsAuthLoading(false);
    }

    const handleMessage = async (event: MessageEvent) => {
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

    window.addEventListener('message', handleMessage);
    checkSession();

    return () => {
      isMounted = false;
      window.removeEventListener('message', handleMessage);
    };
  }, []);`);

fs.writeFileSync('src/hooks/useFinance.ts', code);
