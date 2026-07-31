const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#020617" />
  <circle cx="256" cy="256" r="216" fill="#020617" stroke="#3b82f6" stroke-width="24" />
  <text x="256" y="322" font-family="Georgia, 'Times New Roman', serif" font-size="210" font-weight="bold" fill="#3b82f6" text-anchor="middle" letter-spacing="2">AO</text>
</svg>
`;

const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#020617" />
  <circle cx="256" cy="256" r="170" fill="#020617" stroke="#3b82f6" stroke-width="20" />
  <text x="256" y="308" font-family="Georgia, 'Times New Roman', serif" font-size="165" font-weight="bold" fill="#3b82f6" text-anchor="middle" letter-spacing="2">AO</text>
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

  console.log('Icons generated successfully.');
}

generate().catch(console.error);
