const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/userProfile=\{finance\.userProfile\}\n\s*\/>\n\s*\);\n\s*\}/g, 'userProfile={finance.userProfile}\n      /></Suspense>\n    );\n  }');

code = code.replace(/<ResetPasswordView \/>/g, '<ResetPasswordView />'); // Actually ResetPasswordView in the if(urlResetToken) looks like:
// <ResetPasswordView token={urlResetToken} onGoToLogin={handleClearResetToken} />
code = code.replace(/<ResetPasswordView\s*token=\{urlResetToken\}\s*onGoToLogin=\{handleClearResetToken\}\s*\/>/, '<Suspense fallback={<FallbackLoader />}><ResetPasswordView token={urlResetToken} onGoToLogin={handleClearResetToken} /></Suspense>');

fs.writeFileSync('src/App.tsx', code);
