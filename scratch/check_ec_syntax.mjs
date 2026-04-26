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
    'components/modules/ec/EC_Handlers.js'
];

files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    try {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Simple regex check for common syntax errors or unclosed brackets
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        
        console.log(`File: ${file}`);
        console.log(`  Braces: {:${openBraces}, }:${closeBraces} ${openBraces !== closeBraces ? '!!!' : 'OK'}`);
        console.log(`  Parens: (:${openParens}, ):${closeParens} ${openParens !== closeParens ? '!!!' : 'OK'}`);
        
        if (openBraces !== closeBraces || openParens !== closeParens) {
            console.error(`ERROR: Mismatched delimiters in ${file}`);
        }
    } catch (e) {
        console.error(`Could not read ${file}: ${e.message}`);
    }
});
