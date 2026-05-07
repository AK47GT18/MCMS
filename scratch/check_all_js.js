import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.mjs')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('./components').concat(walk('./src')).concat(['./main.js']);

async function checkFiles() {
    for (const file of files) {
        try {
            await import('file:///' + path.resolve(file).replace(/\\/g, '/'));
        } catch (e) {
            if (e instanceof SyntaxError) {
                console.error(`SYNTAX ERROR IN: ${file}`);
                console.error(e.message);
                console.error(e.stack);
            }
        }
    }
}

checkFiles();
