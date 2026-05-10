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
        let code = fs.readFileSync(f, 'utf8');
        // Simple regex to strip ESM bits for validation
        code = code.replace(/^export\s+/gm, '');
        code = code.replace(/^import\s+.*?;/gm, '');
        code = code.replace(/import\(/g, 'void(');
        
        new Script(`(async () => { ${code} })()`);
        console.log(f, ': Syntax OK');
    } catch (e) {
        console.log(f, ': Syntax Error -', e.message);
        // Find line number
        const stack = e.stack.split('\n');
        console.log(stack[0]);
    }
});
