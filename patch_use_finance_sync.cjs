const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFinance.ts', 'utf8');

code = code.replace(
  /const syncUser = async \(user: any\) => \{[\s\S]*?\} catch \(e\) \{[\s\S]*?console\.error\('Failed to sync user', e\);\n\s*\}\n\s*\};/,
  `const syncUser = async (user: any) => {
  if (!isMounted || !user) return;
  try {
    const prof = await getCurrentUserProfile();
    if (prof) {
      setUserProfile({
        uid: prof.uid || user.id,
        email: prof.email || user.email || '',
        displayName: prof.displayName || prof.display_name || user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : ''),
        role: prof.role || 'user',
        status: prof.status || 'pending',
        plan: prof.plan || 'free',
        createdAt: prof.createdAt || prof.created_at || user.created_at,
        photoURL: prof.photoURL || prof.photo_url || user.user_metadata?.avatar_url,
      } as any);
      setCurrentUser({
        uid: prof.uid || user.id,
        email: prof.email || user.email || '',
        displayName: prof.displayName || prof.display_name || user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : ''),
      });
    }
  } catch (e) {
    console.error('Failed to sync user', e);
  }
};`
);

fs.writeFileSync('src/hooks/useFinance.ts', code);
