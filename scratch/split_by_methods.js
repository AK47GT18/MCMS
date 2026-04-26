const fs = require('fs');

const file = 'c:/Users/USER/Desktop/MCMS/components/modules/ProjectManagerDashboard.js';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const moduleMap = {
    'PM_Portfolio': ['getPortfolioView', 'loadProjectsFromAPI', 'filterProjectsByStatus', 'renderProjectsTable', 'toggleDropdown', 'openProjectDetailsDrawer', 'getStatsGridHTML'],
    'PM_Gantt': ['getGanttView', 'changeProjectSchedule', 'renderGanttChart', 'openPhaseEditor', 'changeGanttViewMode', 'scrollToToday', 'handleGanttScroll', 'syncGanttScroll'],
    'PM_Budget': ['getBudgetView', 'loadTransactionsFromAPI', 'renderTransactionsTable', 'renderBudgetSummary', 'openAddTransactionDrawer'],
    'PM_Teams': ['getTeamsView', 'renderTeamsList', 'openAssignTeamDrawer'],
    'PM_Contracts': ['getContractsView', 'loadContractsFromAPI', 'renderContractsTable', 'openAddContractDrawer'],
    'PM_Fleet': ['getFleetView', 'loadAssetsFromAPI', 'renderAssetsTable', 'openAddAssetDrawer', 'openAssetDetailsDrawer'],
    'PM_Reports': ['getReportsView', 'loadReports', 'renderReportsTable'],
    'PM_Reviews': ['getReviewsView', 'switchReviewTab', 'loadReviewsData', 'renderActiveReviewTab', 'renderExtensionsTable', 'renderPendingLogsTable', 'renderPendingRequisitionsTable', 'renderReviewHistoryTable', 'openExtensionReviewDrawer', 'openLogReviewDrawer', 'openRequisitionReviewDrawer', 'switchReviewLog'],
    'PM_Issues': ['getIssuesView', 'loadIssuesFromAPI', 'renderIssuesTable', 'renderIssuesSummary', 'openIssueResolutionDrawer'],
    'PM_Users': ['getUsersView', 'loadUsers', 'renderUsersTable', 'openUserDrawer'],
    'PM_Audit': ['getAuditView', 'loadAuditLogs', 'renderAuditTable'],
    'PM_ProjectHandlers': ['openNewProjectDrawer', 'openEditProjectDrawer', 'handleUpdateProject', 'openSuspendProjectDrawer', 'handleSuspendProject', 'handleDeleteProject', 'openExtendProjectDrawer', 'handlePhaseEditorSave', 'handleSubmitExtensionRequest', 'handleExtendProject'],
    'PM_ReviewHandlers': ['handleApproveLog', 'handleRejectLog', 'handleApproveRequisition', 'handleRejectRequisition', 'handleApproveExtension', 'handleRejectExtension'],
    'PM_FeatureHandlers': ['handleIssueSubmit', 'handleAddTask', 'handleResolveIssue', 'initIssueResolutionForm', 'handleAddVehicle', 'handleReviewVehicle', 'handleCompleteMaintenance', 'handleTransactionSubmit', 'handleRequestFunds', 'handleContractUpload', 'handleDailyLogSubmit', 'validateProjectForm', 'updateItemQuantity', 'updateItemCost', 'renderEstimatedReceipt'],
    'PM_UserHandlers': ['handleCreateUser', 'handleUpdateUser', 'lockUser', 'unlockUser', 'deleteUser', 'initCreateUserForm', 'initEditUserForm'],
    'PM_SystemHelpers': ['calculateDashboardStats', 'updateHeaderStats', 'renderEmptyState', 'renderLoadingState']
};

// Also keep track of methods we want to KEEP in the main file
const keepMethods = ['constructor', 'initRealtimeListeners', 'escapeHTML', 'render', 'getHeaderHTML', 'getContextStrip', 'getActionButtons', 'getAnalyticsView'];

let currentMethod = null;
let braceCount = 0;
let methodLines = [];
let methodBlocks = {};
let otherLines = [];
let methodMapLookup = {};

// Create lookup for easy checking
for (const [mod, methods] of Object.entries(moduleMap)) {
    for (const method of methods) {
        methodMapLookup[method] = mod;
    }
}

// Ensure dir exists
if (!fs.existsSync('c:/Users/USER/Desktop/MCMS/components/modules/pm')) {
    fs.mkdirSync('c:/Users/USER/Desktop/MCMS/components/modules/pm');
}

let inClass = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!inClass) {
        if (line.includes('export class ProjectManagerDashboard')) {
            inClass = true;
            otherLines.push(line);
        } else {
            otherLines.push(line);
        }
        continue;
    }
    
    if (inClass && currentMethod === null) {
        // Look for method start: 4 spaces, optional async, name, params
        const match = line.match(/^    (async\s+)?([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/);
        
        if (match) {
            currentMethod = match[2];
            braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            methodLines = [line];
        } else {
            // Might be the end of the class
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
            // End of method
            methodBlocks[currentMethod] = methodLines;
            
            // Should we keep it in main file?
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
    "import projects from '../../../src/api/projects.api.js';",
    "import users from '../../../src/api/users.api.js';",
    "import dailyLogs from '../../../src/api/dailyLogs.api.js';",
    "import requisitions from '../../../src/api/requisitions.api.js';",
    "import audit from '../../../src/api/audit.api.js';",
    "import procurement from '../../../src/api/procurement.api.js';",
    "import assets from '../../../src/api/assets.api.js';",
    "import issues from '../../../src/api/issues.api.js';",
    "import tasks from '../../../src/api/tasks.api.js';",
    "import contracts from '../../../src/api/contracts.api.js';"
];

// Write out the modules
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
        fs.writeFileSync(`c:/Users/USER/Desktop/MCMS/components/modules/pm/${mod}.js`, fileContent, 'utf8');
        importedModules.push(mod);
    }
}

// Modify original file to import and assign
let topImports = [];
for (const mod of importedModules) {
    topImports.push(`import { ${mod} } from './pm/${mod}.js';`);
}

const finalMainFile = topImports.join('\n') + '\n' + otherLines.join('\n').replace(/\}\s*$/, `}\n\n// Apply modular mixins\nObject.assign(ProjectManagerDashboard.prototype, ${importedModules.join(', ')});\n`);

fs.writeFileSync(file, finalMainFile, 'utf8');
console.log(`Successfully split ProjectManagerDashboard into ${importedModules.length} modules!`);
