const fs = require('fs');
const path = require('path');

const files = [
    'components/modules/EquipmentCoordinatorDashboard.js',
    'components/modules/Shared_Audit.js',
    'components/modules/ec/EC_Dashboard.js',
    'components/modules/ec/EC_ResourceHub.js',
    'components/modules/ec/EC_Inventory.js',
    'components/modules/ec/EC_Distribution.js',
    'components/modules/ec/EC_Registry.js',
    'components/modules/ec/EC_Maintenance.js',
    'components/modules/ec/EC_Handlers.js',
    'components/modules/ec/EC_Records.js'
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Simple check: can we parse it?
        // Note: This won't work for ES modules in Node without extra flags or tools,
        // but it might catch obvious trailing commas in objects or missing braces.
        // Actually, let's just look for common mistakes.
        console.log(`Checking ${file}...`);
        
        // Check for double commas or trailing commas in weird places
        if (content.includes(',,')) console.log(`  [WARNING] Double comma found in ${file}`);
        if (content.includes(',\n\n,')) console.log(`  [WARNING] Spaced double comma found in ${file}`);
        
        // Check for unbalanced braces (very naive)
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        if (openBraces !== closeBraces) console.log(`  [ERROR] Unbalanced braces in ${file}: {${openBraces}, }${closeBraces}`);

    } catch (err) {
        console.log(`  [ERROR] Could not read ${file}: ${err.message}`);
    }
});
