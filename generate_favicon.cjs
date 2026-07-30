const { convert } = require('convert-svg-to-png');
const fs = require('fs');

async function main() {
  const svg = fs.readFileSync('public/favicon.svg', 'utf8');
  const png = await convert(svg, { width: 192, height: 192 });
  fs.writeFileSync('public/favicon.png', png);
  console.log('Favicon PNG generated.');
}
main();
