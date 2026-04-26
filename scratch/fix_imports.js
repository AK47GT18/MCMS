const fs = require('fs');
const path = require('path');
const dir = 'components/modules/fd';
fs.readdirSync(dir).filter(f => f.endsWith('.js')).forEach(f => {
    const p = path.join(dir, f);
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/import \{ StatCard \} from '\.\.\/ui\/StatCard\.js';/g, "import { StatCard } from '../../ui/StatCard.js';");
    fs.writeFileSync(p, content);
});
console.log("Fixed imports in fd directory.");
