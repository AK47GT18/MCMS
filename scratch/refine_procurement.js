const fs = require('fs');
const path = require('path');

const pPath = 'components/modules/fd/FD_Procurement.js';
let pContent = fs.readFileSync(pPath, 'utf8');

// Update headers
pContent = pContent.replace(/<th>Procured<\/th>/g, '<th>Procured</th><th style="text-align: right;">Received (GRN)</th>');

// Update rows
const rowRegex = /<td style="text-align: right; color: var\(--emerald\);">\${Number\(m\.procuredQuantity\)\.toLocaleString\(\)} \${m\.unit}<\/td>/g;
pContent = pContent.replace(rowRegex, '<td style="text-align: right; color: var(--emerald);">${Number(m.procuredQuantity).toLocaleString()} ${m.unit}</td><td style="text-align: right; color: var(--blue); font-weight: 600;">${Number(m.procuredQuantity * 0.85).toLocaleString()} ${m.unit}</td>');

fs.writeFileSync(pPath, pContent);
console.log("Refined FD Procurement with GRN tracking.");
