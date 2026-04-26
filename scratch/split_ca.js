const fs = require('fs');

const file = 'c:/Users/USER/Desktop/MCMS/components/modules/ContractAdminDashboard.js';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const moduleMap = {
    'CA_Dashboard': ['getDashboardView', 'getStatsGridHTML', 'getDataCardHTML'],
    'CA_Documents': ['getDocumentsView', 'loadDocuments'],
    'CA_Milestones': ['getMilestonesView', 'openMilestoneDetails', 'openCertifyDrawer', 'openMilestoneCertificate'],
    'CA_Amendments': ['getAmendmentsView'],
    'CA_Compliance': ['getComplianceView', 'openPolicyDrawer', 'openPolicyDetails'],
    'CA_Reports': ['getReportsView'],
    'CA_Handlers': ['handleUploadDocument', 'handleUploadVersion', 'handleApproveContract', 'openEditContractDrawer', 'handleUpdateContract', 'openEditDocumentDrawer', 'handleUpdateDocumentDetails', 'openUploadDrawer', 'openVersionDrawer', 'openVersionHistoryDrawer']
};

const keepMethods = ['constructor', 'init', 'loadAllData', 'refresh', 'render', 'getTemplateAsync', 'getCurrentViewHTML', 'getHeaderHTML'];

let currentMethod = null;
let braceCount = 0;
let methodLines = [];
let methodBlocks = {};
let otherLines = [];

if (!fs.existsSync('c:/Users/USER/Desktop/MCMS/components/modules/ca')) {
    fs.mkdirSync('c:/Users/USER/Desktop/MCMS/components/modules/ca');
}

let inClass = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!inClass) {
        if (line.includes('export class ContractAdminDashboard')) {
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
    "import contractsApi from '../../../src/api/contracts.api.js';"
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
        fs.writeFileSync(`c:/Users/USER/Desktop/MCMS/components/modules/ca/${mod}.js`, fileContent, 'utf8');
        importedModules.push(mod);
    }
}

let topImports = [];
for (const mod of importedModules) {
    topImports.push(`import { ${mod} } from './ca/${mod}.js';`);
}

const finalMainFile = topImports.join('\n') + '\n' + otherLines.join('\n').replace(/\}\s*$/, `}\n\n// Apply modular mixins\nObject.assign(ContractAdminDashboard.prototype, ${importedModules.join(', ')});\n`);

fs.writeFileSync(file, finalMainFile, 'utf8');
console.log(`Successfully split ContractAdminDashboard into ${importedModules.length} modules!`);
