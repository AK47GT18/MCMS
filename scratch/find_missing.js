const fs = require('fs');
const execSync = require('child_process').execSync;

// Get all deleted methods from git
const diff = execSync('git diff HEAD components/modules/ProjectManagerDashboard.js').toString();
const deletedMethodsMatch = diff.match(/^\-\s+(async\s+)?([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/gm);

if (!deletedMethodsMatch) {
    console.log("No deleted methods found in git diff.");
    process.exit(0);
}

const deletedMethods = deletedMethodsMatch.map(m => {
    const match = m.match(/^\-\s+(async\s+)?([a-zA-Z0-9_]+)\s*\(/);
    return match ? match[2] : null;
}).filter(m => m !== null);

// Check if these methods exist in any of the new pm/ modules
const pmDir = 'c:/Users/USER/Desktop/MCMS/components/modules/pm/';
let foundMethods = new Set();

const files = fs.readdirSync(pmDir);
for (const file of files) {
    const content = fs.readFileSync(pmDir + file, 'utf8');
    for (const method of deletedMethods) {
        if (content.includes(`    ${method}(`) || content.includes(`    async ${method}(`)) {
            foundMethods.add(method);
        }
    }
}

const missingMethods = deletedMethods.filter(m => !foundMethods.has(m));
console.log("Missing Methods:", missingMethods);
