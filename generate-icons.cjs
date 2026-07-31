const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#020617" />
  <circle cx="256" cy="256" r="216" fill="#020617" stroke="#3b82f6" stroke-width="32" />
  <path d="M 160 320 L 220 220 L 280 280 L 350 160" stroke="#3b82f6" stroke-width="36" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 280 160 L 350 160 L 350 230" stroke="#3b82f6" stroke-width="36" fill="none" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;

const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#020617" />
  <circle cx="256" cy="256" r="170" fill="#020617" stroke="#3b82f6" stroke-width="28" />
  <path d="M 180 300 L 225 220 L 275 270 L 340 170" stroke="#3b82f6" stroke-width="28" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 285 170 L 340 170 L 340 225" stroke="#3b82f6" stroke-width="28" fill="none" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;

async function generate() {
  const iconsDir = path.join(__dirname, 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  await sharp(Buffer.from(logoSvg)).resize(64, 64).png().toFile(path.join(__dirname, 'public', 'favicon.png'));
  await sharp(Buffer.from(logoSvg)).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
  await sharp(Buffer.from(logoSvg)).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-maskable-512.png'));
  await sharp(Buffer.from(maskableSvg)).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-maskable-192.png'));
  await sharp(Buffer.from(logoSvg)).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  console.log('Icons generated successfully using path data.');
}

generate().catch(console.error);
