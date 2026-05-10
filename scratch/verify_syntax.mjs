import fs from 'fs';
import { Script } from 'vm';

const files = [
    'main.js',
    'components/DrawerTemplates.js',
    'components/modules/pm/PM_Issues.js',
    'layouts/AppLayout.js'
];

files.forEach(f => {
    try {
        const code = fs.readFileSync(f, 'utf8');
        // Strip exports/imports to use vm.Script
        const cleaned = code
            .replace(/^export\s+/gm, '')
            .replace(/^import\s+.*?from\s+['"].*?['"];/gm, '')
            .replace(/^import\s+['"].*?['"];/gm, '')
            .replace(/import\(.*?\)/g, 'Promise.resolve({})');
        
        new Script(cleaned);
        console.log(f, ': OK');
    } catch (e) {
        console.log(f, ': Syntax Error');
        console.log(e.message);
        console.log(e.stack.split('\n')[0]);
    }
});
