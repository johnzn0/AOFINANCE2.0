const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="216" fill="#020617" stroke="#3b82f6" stroke-width="32" />
  <path d="M 160 320 L 220 220 L 280 280 L 350 160" stroke="#3b82f6" stroke-width="36" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 280 160 L 350 160 L 350 230" stroke="#3b82f6" stroke-width="36" fill="none" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;

async function generate() {
  await sharp(Buffer.from(logoSvg)).resize(32, 32).png().toFile(path.join(__dirname, 'public', 'favicon.ico'));
  console.log('favicon.ico generated.');
}
generate().catch(console.error);
