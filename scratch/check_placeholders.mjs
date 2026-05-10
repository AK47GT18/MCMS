import fs from 'fs';

const code = fs.readFileSync('components/DrawerTemplates.js', 'utf8');
const regex = /\${(.*?)}/gs;
let match;

console.log('Checking template placeholders...');
while ((match = regex.exec(code)) !== null) {
    const content = match[1];
    try {
        // Wrap in a function to check if it's a valid JS expression
        new Function('return (' + content + ')');
    } catch (e) {
        // Some might be valid but complex, but "Invalid or unexpected token" usually means bad syntax
        if (e instanceof SyntaxError) {
            console.log('Syntax Error in placeholder:', content);
            console.log(e.message);
            console.log('Location:', match.index);
        }
    }
}
console.log('Done.');
