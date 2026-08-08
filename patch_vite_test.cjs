const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

const testConfig = `
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      globals: true,
    },
    build: {
`;

code = code.replace(/build: \{/, testConfig);
fs.writeFileSync('vite.config.ts', code);
