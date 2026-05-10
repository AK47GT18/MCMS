const fs = require('fs');
let c = fs.readFileSync('components/modules/ec/EC_Handlers.js', 'utf8');
c = c.replace(
    /await client\.post\('\/inventory\/dispatch', \{[\s\S]*?\}\);/,
    `// Perform Requisition -> Approve -> Dispatch Pipeline
            const reqRes = await client.post('/requisitions', {
                projectId: parseInt(projectId),
                sectorId: parseInt(sectorId),
                items: [{
                    itemName: materialName,
                    quantity: amount,
                    unit: material.unit || 'Units'
                }],
                notes: \`Direct EC Dispatch - Reason: \${justification}\`,
                priority: 'high'
            });
            const reqId = reqRes.data ? reqRes.data.id : reqRes.id;
            
            // Auto-Approve it
            await client.post(\`/requisitions/\${reqId}/approve\`, { reason: 'Direct Dispatch auto-approval' });
            
            // Dispatch it to put it in transit
            await client.post('/dispatch', {
                requisitionId: reqId,
                estimatedArrival: date,
                partial: false,
                dispatchedItems: [\`\${amount} x \${materialName}\`],
                userPhone: transporterPhone,
                transporterName: transporter
            });`
);
fs.writeFileSync('components/modules/ec/EC_Handlers.js', c);
console.log("Replaced successfully!");
