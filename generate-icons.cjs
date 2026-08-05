const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const solidSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#020617" />
  <circle cx="512" cy="512" r="380" fill="#020617" stroke="#2563eb" stroke-width="16" />
  <text x="512" y="650" font-family="sans-serif" font-size="440" font-weight="bold" fill="#60a5fa" text-anchor="middle" letter-spacing="0">AO</text>
</svg>
`;

const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#020617" />
  <circle cx="512" cy="512" r="280" fill="#020617" stroke="#2563eb" stroke-width="14" />
  <text x="512" y="615" font-family="sans-serif" font-size="320" font-weight="bold" fill="#60a5fa" text-anchor="middle" letter-spacing="0">AO</text>
</svg>
`;

const transparentSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <circle cx="512" cy="512" r="480" fill="#020617" stroke="#2563eb" stroke-width="24" />
  <text x="512" y="690" font-family="sans-serif" font-size="560" font-weight="bold" fill="#60a5fa" text-anchor="middle" letter-spacing="0">AO</text>
</svg>
`;

async function generate() {
  const publicDir = path.join(__dirname, 'public');
  const iconsDir = path.join(publicDir, 'icons');
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  const opts = { density: 300 };

  // 1. Regular Icons
  await sharp(Buffer.from(solidSvg), opts).resize(1024, 1024).png({ compressionLevel: 9 }).toFile(path.join(iconsDir, 'logo-1024-v3.png'));
  await sharp(Buffer.from(solidSvg), opts).resize(512, 512).png({ compressionLevel: 9 }).toFile(path.join(iconsDir, 'icon-512-v3.png'));
  await sharp(Buffer.from(solidSvg), opts).resize(192, 192).png({ compressionLevel: 9 }).toFile(path.join(iconsDir, 'icon-192-v3.png'));
  
  // 2. Maskable Icons
  await sharp(Buffer.from(maskableSvg), opts).resize(512, 512).png({ compressionLevel: 9 }).toFile(path.join(iconsDir, 'icon-maskable-512-v3.png'));
  await sharp(Buffer.from(maskableSvg), opts).resize(192, 192).png({ compressionLevel: 9 }).toFile(path.join(iconsDir, 'icon-maskable-192-v3.png'));
  
  // 3. Apple Touch Icon
  await sharp(Buffer.from(solidSvg), opts).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(iconsDir, 'apple-touch-icon-v3.png'));
  
  // 4. Favicons
  await sharp(Buffer.from(transparentSvg), opts).resize(32, 32).png({ compressionLevel: 9 }).toFile(path.join(publicDir, 'favicon-32-v3.png'));
  await sharp(Buffer.from(transparentSvg), opts).resize(16, 16).png({ compressionLevel: 9 }).toFile(path.join(publicDir, 'favicon-16-v3.png'));
  await sharp(Buffer.from(transparentSvg), opts).resize(64, 64).png({ compressionLevel: 9 }).toFile(path.join(publicDir, 'favicon-v3.png'));
  await sharp(Buffer.from(transparentSvg), opts).resize(256, 256).png({ compressionLevel: 9 }).toFile(path.join(publicDir, 'favicon-v3.ico'));

  fs.writeFileSync(path.join(publicDir, 'favicon-v3.svg'), transparentSvg);

  console.log('Icons v3 generated successfully.');
}

generate().catch(console.error);
