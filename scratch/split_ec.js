const fs = require('fs');

const file = 'c:/Users/USER/Desktop/MCMS/components/modules/EquipmentCoordinatorDashboard.js';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const moduleMap = {
    'EC_Dashboard': ['getDashboardView', '_renderBurnChart'],
    'EC_ResourceHub': ['getResourceHubView', 'switchHubTab', '_renderFMReceiptsTable', '_renderRequisitionsTable', '_loadRequisitions', '_loadProcurementReceipts'],
    'EC_Inventory': ['getInventoryView', '_loadInventory'],
    'EC_Distribution': ['getDistributionLogView', '_loadDistributionLogs', 'toggleResourceType', 'updateMaterialSheet', 'openDispatchDrawer'],
    'EC_Registry': ['getRegistryView', '_loadAssets'],
    'EC_Maintenance': ['getMaintenanceView', 'getOperatorsView', 'getUtilizationView', '_loadConflicts'],
    'EC_Handlers': ['handleExecuteDispatch', 'handleProcurementReceipt', 'handleIntake', 'handleAssetUpdate', 'handleResolveIssue', 'handleAssetProcurementRequest', 'syncFMProcurement']
};

const keepMethods = ['constructor', '_setupRealtimeListeners', 'render', 'getTemplate', 'getCurrentViewHTML', 'getHeaderHTML', 'switchView', '_refreshCurrentView'];

let currentMethod = null;
let braceCount = 0;
let methodLines = [];
let methodBlocks = {};
let otherLines = [];

if (!fs.existsSync('c:/Users/USER/Desktop/MCMS/components/modules/ec')) {
    fs.mkdirSync('c:/Users/USER/Desktop/MCMS/components/modules/ec');
}

let inClass = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!inClass) {
        if (line.includes('export class EquipmentCoordinatorDashboard')) {
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
            // Keep the LAST defined version of the method (handles duplicates gracefully)
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
    "import { StatCard } from '../ui/StatCard.js';"
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
        fs.writeFileSync(`c:/Users/USER/Desktop/MCMS/components/modules/ec/${mod}.js`, fileContent, 'utf8');
        importedModules.push(mod);
    }
}

let topImports = [];
for (const mod of importedModules) {
    topImports.push(`import { ${mod} } from './ec/${mod}.js';`);
}

const finalMainFile = topImports.join('\n') + '\n' + otherLines.join('\n').replace(/\}\s*$/, `}\n\n// Apply modular mixins\nObject.assign(EquipmentCoordinatorDashboard.prototype, ${importedModules.join(', ')});\n`);

fs.writeFileSync(file, finalMainFile, 'utf8');
console.log(`Successfully split EquipmentCoordinatorDashboard into ${importedModules.length} modules!`);
