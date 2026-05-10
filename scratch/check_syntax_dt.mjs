import fs from 'fs';
import { parse } from '@babel/parser';

const code = fs.readFileSync('components/DrawerTemplates.js', 'utf8');

try {
  parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log('Syntax OK');
} catch (e) {
  console.error('Syntax Error at line ' + e.loc.line + ', column ' + e.loc.column);
  console.error(e.message);
  
  const lines = code.split('\n');
  const start = Math.max(0, e.loc.line - 5);
  const end = Math.min(lines.length, e.loc.line + 5);
  
  for (let i = start; i < end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
    if (i + 1 === e.loc.line) {
      console.log(' '.repeat(e.loc.column + 3) + '^');
    }
  }
}
