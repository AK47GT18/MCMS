const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && !file.startsWith('.')) {
                walk(fullPath);
            }
        } else if (file.endsWith('.js')) {
            try {
                // Use type=module for all checks since this is an ESM project
                execSync(`node --input-type=module --check`, { input: fs.readFileSync(fullPath), stdio: 'pipe' });
            } catch (e) {
                console.log(`[SYNTAX ERROR] ${fullPath}`);
                console.log(e.stderr.toString());
            }
        }
    }
}

walk('.');
