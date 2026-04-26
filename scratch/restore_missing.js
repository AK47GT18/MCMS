const fs = require('fs');
const execSync = require('child_process').execSync;

// Get the original file from git
const oldContent = execSync('git show HEAD:components/modules/ProjectManagerDashboard.js').toString();
const oldLines = oldContent.split('\n');

const missingMethods = [
  'updateBudgetSummary',
  'loadSiteActivityFromAPI',
  'loadReportsData',
  'loadInventoryData',
  'openDailyLogReviewDrawer',
  'initializeProjectMap',
  'initializeVerificationMap',
  'openSiteLogVerification',
  'handleWizardNav',
  'switchWizardStep',
  'generateEstimatedReceipt',
  'renderBudgetReceipt',
  'toggleReceiptItem',
  'checkBudgetReconciliation',
  'updateFinalSummary',
  'fetchSupervisors',
  'handleCreateProject',
  'updateMapRadius'
];

// Note: updateCoords and for/switch were captured badly by the regex, but updateCoords is a real method
const allMissing = [...missingMethods, 'updateCoords'];

let extractedBlocks = [];

for (const method of allMissing) {
    let startIdx = -1;
    for (let i = 0; i < oldLines.length; i++) {
        if (oldLines[i].match(new RegExp(`^\\s+(async\\s+)?${method}\\s*\\(`))) {
            startIdx = i;
            break;
        }
    }
    
    if (startIdx !== -1) {
        let braceCount = 0;
        let blockLines = [];
        let inMethod = true;
        
        for (let i = startIdx; i < oldLines.length; i++) {
            const line = oldLines[i];
            blockLines.push(line);
            
            braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            
            if (braceCount === 0 && i > startIdx) {
                extractedBlocks.push(blockLines.join('\n'));
                break;
            }
        }
    } else {
        console.log(`Could not find start for ${method}`);
    }
}

if (extractedBlocks.length > 0) {
    let fileContent = `import client from '../../../src/api/client.js';\nimport projects from '../../../src/api/projects.api.js';\nimport users from '../../../src/api/users.api.js';\n\nexport const PM_MissingHandlers = {\n` + extractedBlocks.join(',\n\n') + `\n};\n`;
    fs.writeFileSync('c:/Users/USER/Desktop/MCMS/components/modules/pm/PM_MissingHandlers.js', fileContent, 'utf8');
    console.log(`Successfully created PM_MissingHandlers.js with ${extractedBlocks.length} methods.`);
    
    // Now add it to ProjectManagerDashboard.js
    const pmFile = 'c:/Users/USER/Desktop/MCMS/components/modules/ProjectManagerDashboard.js';
    let pmContent = fs.readFileSync(pmFile, 'utf8');
    
    if (!pmContent.includes('PM_MissingHandlers')) {
        pmContent = `import { PM_MissingHandlers } from './pm/PM_MissingHandlers.js';\n` + pmContent;
        pmContent = pmContent.replace('Object.assign(ProjectManagerDashboard.prototype, ', 'Object.assign(ProjectManagerDashboard.prototype, PM_MissingHandlers, ');
        fs.writeFileSync(pmFile, pmContent, 'utf8');
        console.log('Successfully injected PM_MissingHandlers into ProjectManagerDashboard.js');
    }
} else {
    console.log("No blocks extracted.");
}
