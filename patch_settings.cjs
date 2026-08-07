const fs = require('fs');
let code = fs.readFileSync('src/components/views/SettingsView.tsx', 'utf8');

code = code.replace(/passValidation\.length/g, "passValidation.hasMinLength");
code = code.replace(/passValidation\.uppercase/g, "passValidation.hasUppercase");
code = code.replace(/passValidation\.lowercase/g, "passValidation.hasLowercase");
code = code.replace(/passValidation\.number/g, "passValidation.hasNumber");
code = code.replace(/passValidation\.special/g, "passValidation.hasSpecialChar");

fs.writeFileSync('src/components/views/SettingsView.tsx', code);
