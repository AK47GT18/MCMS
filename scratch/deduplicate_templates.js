const fs = require('fs');
const code = fs.readFileSync('c:/Users/USER/Desktop/MCMS/components/DrawerTemplates.js', 'utf8');
const lines = code.split('\n');

const keyRanges = [];
let currentKey = null;
let currentStart = -1;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for keys at 2 or 4 spaces indentation
    const match = line.match(/^ {2,4}([a-zA-Z0-9_]+):/);
    if (match) {
        if (currentKey) {
            keyRanges.push({ key: currentKey, start: currentStart, end: i - 1 });
        }
        currentKey = match[1];
        currentStart = i;
    }
}

// Push the last key
if (currentKey) {
    // Find the end of the object literal
    let lastLine = lines.length - 1;
    while (lastLine > currentStart && !lines[lastLine].trim().startsWith('};')) {
        lastLine--;
    }
    keyRanges.push({ key: currentKey, start: currentStart, end: lastLine - 1 });
}

// Keep the last occurrence of each key
const keptKeys = new Map();
keyRanges.forEach((range, idx) => {
    // Exception: escapeHTML is at the beginning and we want to keep it.
    // Actually, keeping the last one is usually safer for my recent changes.
    keptKeys.set(range.key, range);
});

const resultLines = [];
// Add header
for (let i = 0; i < keyRanges[0].start; i++) {
    resultLines.push(lines[i]);
}

// Add kept blocks in order of their keys' LAST appearance
const sortedKept = Array.from(keptKeys.values()).sort((a, b) => a.start - b.start);

sortedKept.forEach((range, idx) => {
    for (let i = range.start; i <= range.end; i++) {
        let line = lines[i];
        // Ensure property has a comma if it's not the last one
        if (i === range.end && !line.trim().endsWith(',') && idx < sortedKept.length - 1) {
            // If it ends with a template backtick, add comma
            if (line.trim().endsWith('`')) {
                line = line.replace(/`$/, '`,');
            } else if (line.trim().endsWith('}')) {
                line = line.replace(/}$/, '},');
            }
        }
        resultLines.push(line);
    }
});

// Add footer
resultLines.push('};');

fs.writeFileSync('c:/Users/USER/Desktop/MCMS/components/DrawerTemplates.js', resultLines.join('\n'));
console.log('Deduplication complete. Kept ' + keptKeys.size + ' keys.');
