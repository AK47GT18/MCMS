const fs = require('fs');

// Check DrawerTemplates encoding
const buf = fs.readFileSync('components/DrawerTemplates.js');
console.log('DrawerTemplates.js:');
console.log('  First bytes:', buf[0].toString(16), buf[1].toString(16), buf[2].toString(16));
console.log('  Has BOM:', buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF ? 'UTF-8 BOM' : buf[0] === 0xFF && buf[1] === 0xFE ? 'UTF-16 LE BOM' : 'No BOM');
console.log('  Size:', buf.length);

// Check for null bytes (UTF-16 indicator)
let nullCount = 0;
for (let i = 0; i < Math.min(200, buf.length); i++) {
  if (buf[i] === 0) nullCount++;
}
console.log('  Null bytes in first 200:', nullCount, nullCount > 10 ? '** LIKELY UTF-16! **' : '(OK, UTF-8)');

// Check PM Dashboard
const buf2 = fs.readFileSync('components/modules/ProjectManagerDashboard.js');
console.log('\nProjectManagerDashboard.js:');
console.log('  First bytes:', buf2[0].toString(16), buf2[1].toString(16), buf2[2].toString(16));
console.log('  Has BOM:', buf2[0] === 0xEF && buf2[1] === 0xBB && buf2[2] === 0xBF ? 'UTF-8 BOM' : buf2[0] === 0xFF && buf2[1] === 0xFE ? 'UTF-16 LE BOM' : 'No BOM');
console.log('  Size:', buf2.length);

let nullCount2 = 0;
for (let i = 0; i < Math.min(200, buf2.length); i++) {
  if (buf2[i] === 0) nullCount2++;
}
console.log('  Null bytes in first 200:', nullCount2, nullCount2 > 10 ? '** LIKELY UTF-16! **' : '(OK, UTF-8)');
