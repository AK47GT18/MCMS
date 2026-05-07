const fs = require('fs');

const code = fs.readFileSync('c:/Users/USER/Desktop/MCMS/components/DrawerTemplates.js', 'utf8');
try {
    // Replace export with something else to make it valid CJS for syntax check
    const checkCode = code.replace(/export const /g, 'const ');
    new Function(checkCode);
    console.log('Success: No syntax errors found.');
} catch (e) {
    console.error('Syntax Error found:');
    console.error(e);
    // Find approximate line number
    if (e.stack) {
        console.error(e.stack);
    }
    process.exit(1);
}
