const fs = require('fs');

const file = 'c:/Users/USER/Desktop/MCMS/components/modules/ProjectManagerDashboard.js';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

// Find Portfolio section (approx lines 187 to 463)
const startIdx = lines.findIndex(l => l.includes('// --- 1. PORTFOLIO MODULE ---'));
const endIdx = lines.findIndex(l => l.includes('// --- 2.1 GANTT SCHEDULE (EXECUTION) ---'));

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = '    // --- 1. PORTFOLIO MODULE (Moved to pm/PM_Portfolio.js) ---';
    lines.splice(startIdx, endIdx - startIdx, replacement);
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log('Successfully replaced portfolio section');
} else {
    console.log('Could not find section markers');
}
