const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionModal.tsx', 'utf8');

// I need to add back the missing closing div for "space-y-4" before "{/* Tags (Notion style) */}"
code = code.replace(
  "            {/* Tags (Notion style) */}",
  "            </div>\n            {/* Tags (Notion style) */}"
);

fs.writeFileSync('src/components/TransactionModal.tsx', code);
