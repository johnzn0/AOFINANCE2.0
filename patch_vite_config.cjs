const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

const buildConfig = `
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            recharts: ['recharts'],
            vendor: ['react', 'react-dom', 'motion'],
          }
        }
      }
    },
    server: {
`;

code = code.replace(/server: \{/g, buildConfig);
fs.writeFileSync('vite.config.ts', code);
