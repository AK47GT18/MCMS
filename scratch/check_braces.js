const fs = require('fs');
const code = fs.readFileSync('c:/Users/USER/Desktop/MCMS/components/DrawerTemplates.js', 'utf8');

let stack = [];
let i = 0;

function parseCode(stopChar) {
    while (i < code.length) {
        const char = code[i];
        if (char === stopChar) return;
        
        if (char === '`') {
            i++;
            while (i < code.length) {
                if (code[i] === '`' && code[i-1] !== '\\') break;
                if (code[i] === '$' && code[i+1] === '{') {
                    i += 2;
                    parseCode('}');
                } else {
                    i++;
                }
            }
        } else if (char === '"' || char === "'") {
            const quote = char;
            i++;
            while (i < code.length) {
                if (code[i] === quote && code[i-1] !== '\\') break;
                i++;
            }
        } else if (char === '{') {
            stack.push(i);
            i++;
            parseCode('}');
            if (code[i] === '}') {
                stack.pop();
            }
        }
        i++;
    }
}

parseCode();

if (stack.length > 0) {
    console.log('Unbalanced { at indices: ' + stack.join(', '));
} else {
    console.log('Braces are balanced.');
}
