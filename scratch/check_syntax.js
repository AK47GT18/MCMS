
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\USER\\Desktop\\MCMS\\main.js', 'utf8');

function check(charOpen, charClose, name) {
    let open = 0;
    let close = 0;
    for (let i = 0; i < content.length; i++) {
        if (content[i] === charOpen) open++;
        if (content[i] === charClose) close++;
    }
    console.log(`${name}: open=${open}, close=${close}`);
}

check('{', '}', 'Braces');
check('(', ')', 'Parens');
check('[', ']', 'Brackets');
