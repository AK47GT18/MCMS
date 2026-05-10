import fs from 'fs';

const code = fs.readFileSync('components/DrawerTemplates.js', 'utf8');
const lines = code.split('\n');

let currentCode = '';
for (let i = 0; i < lines.length; i++) {
    currentCode += lines[i] + '\n';
    try {
        // We wrap in a block and add a dummy export to simulate module top-level
        new Function('export const dummy = 1;' + currentCode);
    } catch (e) {
        if (e instanceof SyntaxError && !e.message.includes('Unexpected token \'export\'')) {
            console.log('Potential error near line', i + 1);
            console.log(e.message);
            // Print some context
            for (let j = Math.max(0, i - 2); j <= i; j++) {
                console.log(`${j + 1}: ${lines[j]}`);
            }
            // We can't easily find the exact end of a block, but this is a start
        }
    }
}
