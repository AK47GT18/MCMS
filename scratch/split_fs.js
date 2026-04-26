const fs = require('fs');

const file = 'c:/Users/USER/Desktop/MCMS/components/modules/FieldSupervisorDashboard.js';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const moduleMap = {
    'FS_Dashboard': ['getDashboardView', '_loadDashboardStats', '_loadAssignedProject'],
    'FS_Logistics': ['getLogisticsView', '_loadSiteInventory', 'toggleRequestType', 'handleSubmitRequisition', 'handleConfirmIntake', 'handleExecuteBurn'],
    'FS_Equipment': ['getEquipmentView', '_loadSiteAssets', 'handleReportBreakdown'],
    'FS_Tasks': ['getTasksView', '_loadTasks', 'getGanttView', 'renderGanttChart', 'changeGanttViewMode', 'scrollToToday', 'handleDailyLogSubmit']
};

const keepMethods = ['constructor', '_setupRealtimeListeners', '_refreshCurrentView', 'render', 'getHeaderHTML', 'switchView'];

let currentMethod = null;
let braceCount = 0;
let methodLines = [];
let methodBlocks = {};
let otherLines = [];

if (!fs.existsSync('c:/Users/USER/Desktop/MCMS/components/modules/fs')) {
    fs.mkdirSync('c:/Users/USER/Desktop/MCMS/components/modules/fs');
}

let inClass = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!inClass) {
        if (line.includes('export class FieldSupervisorDashboard')) {
            inClass = true;
            otherLines.push(line);
        } else {
            otherLines.push(line);
        }
        continue;
    }
    
    if (inClass && currentMethod === null) {
        const match = line.match(/^    (async\s+)?([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/);
        
        if (match) {
            currentMethod = match[2];
            braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            methodLines = [line];
        } else {
            if (line === '}') {
                inClass = false;
                otherLines.push(line);
            } else {
                otherLines.push(line);
            }
        }
    } else if (currentMethod !== null) {
        methodLines.push(line);
        braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        
        if (braceCount === 0) {
            methodBlocks[currentMethod] = methodLines;
            
            if (keepMethods.includes(currentMethod)) {
                otherLines.push(...methodLines);
            }
            
            currentMethod = null;
            methodLines = [];
        }
    }
}

let imports = [
    "import client from '../../../src/api/client.js';",
    "import tasksApi from '../../../src/api/tasks.api.js';",
    "import dailyLogs from '../../../src/api/dailyLogs.api.js';",
    "import assets from '../../../src/api/assets.api.js';"
];

let importedModules = [];
for (const [mod, methods] of Object.entries(moduleMap)) {
    let modContent = [];
    for (const method of methods) {
        if (methodBlocks[method]) {
            modContent.push(methodBlocks[method].join('\n'));
        } else {
            console.warn(`WARNING: Method ${method} not found for module ${mod}`);
        }
    }
    
    if (modContent.length > 0) {
        const fileContent = imports.join('\n') + `\n\nexport const ${mod} = {\n` + modContent.join(',\n\n') + `\n};\n`;
        fs.writeFileSync(`c:/Users/USER/Desktop/MCMS/components/modules/fs/${mod}.js`, fileContent, 'utf8');
        importedModules.push(mod);
    }
}

let topImports = [];
for (const mod of importedModules) {
    topImports.push(`import { ${mod} } from './fs/${mod}.js';`);
}

const finalMainFile = topImports.join('\n') + '\n' + otherLines.join('\n').replace(/\}\s*$/, `}\n\n// Apply modular mixins\nObject.assign(FieldSupervisorDashboard.prototype, ${importedModules.join(', ')});\n`);

fs.writeFileSync(file, finalMainFile, 'utf8');
console.log(`Successfully split FieldSupervisorDashboard into ${importedModules.length} modules!`);
