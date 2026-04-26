import fs from 'fs';
import path from 'path';

const files = [
    'components/modules/EquipmentCoordinatorDashboard.js',
    'components/modules/ec/EC_Dashboard.js',
    'components/modules/ec/EC_Inventory.js',
    'components/modules/ec/EC_Registry.js',
    'components/modules/ec/EC_Distribution.js',
    'components/modules/ec/EC_Maintenance.js',
    'components/modules/ec/EC_Custody.js',
    'components/modules/ec/EC_Records.js',
    'components/modules/ec/EC_Audit.js',
    'components/modules/ec/EC_Handlers.js',
    'components/modules/ec/EC_ResourceHub.js',
    'components/modules/ec/EC_Guidance.js'
];

files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for odd number of backticks (common in template literals)
        const backticks = (content.match(/`/g) || []).length;
        if (backticks % 2 !== 0) {
            console.error(`ERROR: Odd number of backticks (${backticks}) in ${file}`);
        }

        // Check for odd number of single/double quotes
        // This is tricky due to escapes and usage in strings, but can help find obvious issues
        const singleQuotes = (content.match(/'/g) || []).length;
        if (singleQuotes % 2 !== 0) {
            console.warn(`WARNING: Odd number of single quotes (${singleQuotes}) in ${file}`);
        }
        
        const doubleQuotes = (content.match(/"/g) || []).length;
        if (doubleQuotes % 2 !== 0) {
            console.warn(`WARNING: Odd number of double quotes (${doubleQuotes}) in ${file}`);
        }

    } catch (e) {
        console.error(`Could not read ${file}: ${e.message}`);
    }
});
