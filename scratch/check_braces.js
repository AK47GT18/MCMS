
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\USER\\Desktop\\MCMS\\main.js', 'utf8');

let open = 0;
let close = 0;
let lineNum = 0;
const lines = content.split('\n');

lines.forEach((line, index) => {
    lineNum = index + 1;
    const o = (line.match(/\{/g) || []).length;
    const c = (line.match(/\}/g) || []).length;
    open += o;
    close += c;
    if (close > open) {
        console.log(`Mismatch at line ${lineNum}: open=${open}, close=${close}`);
    }
});

console.log(`Total: open=${open}, close=${close}`);
