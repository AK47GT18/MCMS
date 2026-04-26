const fs = require('fs');

const file = 'c:/Users/USER/Desktop/MCMS/components/modules/ProjectManagerDashboard.js';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const sections = [
    { start: '// --- 1. PORTFOLIO MODULE ---', end: '// --- 2.1 GANTT SCHEDULE (EXECUTION) ---', name: 'PM_Portfolio' },
    { start: '// --- 2.1 GANTT SCHEDULE (EXECUTION) ---', end: '// --- 3. BUDGET & FINANCIAL CONTROL ---', name: 'PM_Gantt' },
    { start: '// --- 3. BUDGET & FINANCIAL CONTROL ---', end: '// --- 4. TEAMS & FIELD OPERATIONS ---', name: 'PM_Budget' },
    { start: '// --- 4. TEAMS & FIELD OPERATIONS ---', end: '// --- 5. CONTRACT REGISTRY ---', name: 'PM_Teams' },
    { start: '// --- 5. CONTRACT REGISTRY ---', end: '// --- 8. ASSET REGISTRY (FLEET) ---', name: 'PM_Contracts' },
    { start: '// --- 8. ASSET REGISTRY (FLEET) ---', end: '// --- 7. REPORTS ---', name: 'PM_Fleet' },
    { start: '// --- 7. REPORTS ---', end: '// --- 10. REVIEWS & APPROVALS ---', name: 'PM_Reports' },
    { start: '// --- 10. REVIEWS & APPROVALS ---', end: '// --- 9. ISSUES CENTER ---', name: 'PM_Reviews' },
    { start: '// --- 9. ISSUES CENTER ---', end: '// --- SYSTEM ALIGNMENT HELPERS ---', name: 'PM_Issues' },
    { start: '// --- SYSTEM ALIGNMENT HELPERS ---', end: '// --- USERS MODULE ---', name: 'PM_SystemHelpers' },
    { start: '// --- USERS MODULE ---', end: '// --- AUDIT MODULE ---', name: 'PM_Users' },
    { start: '// --- AUDIT MODULE ---', end: '// --- USERS MODULE (HANDLERS) ---', name: 'PM_Audit' },
    { start: '// --- USERS MODULE (HANDLERS) ---', end: '// --- PROJECT HANDLERS ---', name: 'PM_UserHandlers' },
    { start: '// --- PROJECT HANDLERS ---', end: '// --- PROJECT EXTENSION ---', name: 'PM_ProjectHandlers' },
    { start: '// --- PROJECT EXTENSION ---', end: '// --- REVIEW & APPROVAL HANDLERS ---', name: 'PM_ProjectExtension' },
    { start: '// --- REVIEW & APPROVAL HANDLERS ---', end: '// --- FEATURE SPECIFIC HANDLERS ---', name: 'PM_ReviewHandlers' },
    { start: '// --- FEATURE SPECIFIC HANDLERS ---', end: '}', name: 'PM_FeatureHandlers', isLast: true } 
];

let imports = [];
let modules = [];

// To ensure we don't mess up the class definition, we will extract methods.
// But doing it via string manipulation is tricky.
// Let's create a new class file and build it piece by piece!

let newClassLines = [];
let insideClass = false;

// We will literally just slice the file.
for (let i = sections.length - 1; i >= 0; i--) {
    const sec = sections[i];
    const startIdx = lines.findIndex(l => l.includes(sec.start));
    let endIdx;
    
    if (sec.isLast) {
        // Find the LAST closing brace of the class. 
        // We can just use lines.length - 2 assuming export class ends there.
        // Let's find the closing brace by walking backwards.
        endIdx = lines.length;
        while (endIdx > 0 && !lines[endIdx - 1].startsWith('}')) {
            endIdx--;
        }
        endIdx--; // Exclude the closing brace itself
    } else {
        endIdx = lines.findIndex(l => l.includes(sec.end));
    }

    if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
        const extractedLines = lines.splice(startIdx, endIdx - startIdx); // REMOVE from lines
        
        let moduleContent = `export const ${sec.name} = {\n` + extractedLines.join('\n') + `\n};\n`;
        // Fix imports inside extracted module if they use client, etc
        moduleContent = `import client from '../../../src/api/client.js';\nimport projects from '../../../src/api/projects.api.js';\nimport users from '../../../src/api/users.api.js';\nimport dailyLogs from '../../../src/api/dailyLogs.api.js';\nimport requisitions from '../../../src/api/requisitions.api.js';\nimport audit from '../../../src/api/audit.api.js';\nimport procurement from '../../../src/api/procurement.api.js';\nimport assets from '../../../src/api/assets.api.js';\nimport issues from '../../../src/api/issues.api.js';\nimport tasksApi from '../../../src/api/tasks.api.js';\nimport contracts from '../../../src/api/contracts.api.js';\n\n` + moduleContent;
        
        fs.writeFileSync(`c:/Users/USER/Desktop/MCMS/components/modules/pm/${sec.name}.js`, moduleContent, 'utf8');
        
        imports.unshift(`import { ${sec.name} } from './pm/${sec.name}.js';`); // unshift to keep order
        modules.unshift(sec.name);
        console.log(`Successfully extracted ${sec.name}`);
    } else {
        console.log(`Could not find markers for ${sec.name}`);
    }
}

// Add the Object.assign
// The 'lines' array now contains the top of the file (imports + constructor + initRealtimeListeners + render) 
// and the closing brace '}' at the end.

// We need to insert the Object.assign after the class definition.
lines.push(`\n// Apply modular mixins to the prototype\nObject.assign(ProjectManagerDashboard.prototype, ${modules.join(', ')});\n`);

// Add imports
const finalFile = imports.join('\n') + '\n' + lines.join('\n');
fs.writeFileSync(file, finalFile, 'utf8');

console.log('Successfully completed modularization script for PM Dashboard.');
