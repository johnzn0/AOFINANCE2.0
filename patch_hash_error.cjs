const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFinance.ts', 'utf8');

code = code.replace(
  /async function checkSession\(\) \{/,
  `async function checkSession() {
      if (window.location.hash.includes('error=')) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const errDesc = params.get('error_description');
        if (errDesc) {
          alert('Erro no login via provedor: ' + decodeURIComponent(errDesc).replace(/\\+/g, ' '));
          window.location.hash = '';
        }
      }`
);

fs.writeFileSync('src/hooks/useFinance.ts', code);
