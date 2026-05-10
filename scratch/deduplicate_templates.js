import fs from 'fs';

const path = 'components/DrawerTemplates.js';
const code = fs.readFileSync(path, 'utf8');
const lines = code.split('\n');

const seenKeys = new Set();
const resultLines = [];

let inTopLevel = false;
let braceDepth = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed.startsWith('export const DrawerTemplates = {')) {
        inTopLevel = true;
        braceDepth = 1;
        resultLines.push(line);
        continue;
    }
    
    if (inTopLevel) {
        // Count braces to stay in top level
        for (const char of trimmed) {
            if (char === '{') braceDepth++;
            if (char === '}') braceDepth--;
        }
        
        if (braceDepth === 1) {
            // Check for key at this depth
            const match = trimmed.match(/^(\w+):/);
            if (match) {
                const key = match[1];
                if (seenKeys.has(key)) {
                    console.log('Skipping duplicate key:', key, 'at line', i + 1);
                    // Skip until next key or end of property
                    let skipDepth = 0;
                    while (i < lines.length) {
                        const skipLine = lines[i];
                        for (const char of skipLine) {
                            if (char === '{') skipDepth++;
                            if (char === '}') skipDepth--;
                        }
                        // If it ends with a comma and we are back at depth 1, it's the end of the property
                        if (skipDepth === 0 && (skipLine.trim().endsWith(',') || skipLine.trim().endsWith('`'))) {
                           break;
                        }
                        i++;
                    }
                    continue;
                }
                seenKeys.add(key);
            }
        }
        
        if (braceDepth === 0) {
            inTopLevel = false;
        }
    }
    
    resultLines.push(line);
}

fs.writeFileSync(path, resultLines.join('\n'));
console.log('Deduplication complete.');
