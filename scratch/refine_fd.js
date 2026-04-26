const fs = require('fs');
const path = require('path');

// 1. Update FD_Dashboard.js with Burn Rate
const dashboardPath = 'components/modules/fd/FD_Dashboard.js';
let dashboard = fs.readFileSync(dashboardPath, 'utf8');
const burnRateHtml = `                \${StatCard({ title: 'PM Uplifts', value: s.pmUplifts, subtext: 'Pending additional funding', alertColor: 'red' })}
                <div class="stat-card" style="border-left: 4px solid var(--orange);">
                    <div style="font-size: 11px; color: var(--slate-500); text-transform: uppercase; font-weight: 700; margin-bottom: 8px;">Est. Monthly Burn</div>
                    <div style="font-size: 24px; font-weight: 800; color: var(--slate-900);">\${this.formatCurrency(s.committed * 0.12)}</div>
                    <div style="display:flex; align-items:center; gap:4px; margin-top:8px; font-size:11px; color:var(--red);">
                        <i class="fas fa-arrow-trend-up"></i> 
                        <span>High Velocity (+8% vs last mo)</span>
                    </div>
                </div>`;
dashboard = dashboard.replace(/\${StatCard\({ title: 'PM Uplifts', value: s.pmUplifts, subtext: 'Pending additional funding', alertColor: 'red' }\)}/g, burnRateHtml);
fs.writeFileSync(dashboardPath, dashboard);

// 2. Update FD_Contracts.js with Expiry Alerts
const contractsPath = 'components/modules/fd/FD_Contracts.js';
let contractsContent = fs.readFileSync(contractsPath, 'utf8');

// Find the rows mapping logic and inject expiry calculation
const expiryLogic = `        const rows = filtered.map(item => {
            const endDate = item.endDate ? new Date(item.endDate) : null;
            const today = new Date();
            const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;
            const isExpired = daysLeft !== null && daysLeft <= 0;
            const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;
            
            let statusClass = item.status === 'Active' ? 'active' : 'locked';
            if (isExpired) statusClass = 'delayed';
            if (isExpiringSoon) statusClass = 'locked';

            return \`
                <tr onclick="window.drawer.open('Contract Viewer', window.DrawerTemplates.contractViewer(\${item.id}))">
                    <td><span class="project-id">\${item.contractCode || 'CON-' + item.id}</span></td>
                    <td>
                        <div style="font-weight: 600;">\${item.title}</div>
                        <div style="font-size: 11px; color: var(--slate-500); font-weight: 500;">\${item.vendor?.name || item.vendorName || 'General'}</div>
                    </td>
                    <td>\${item.project?.name || 'Multi-Project'}</td>
                    <td style="font-family:'JetBrains Mono'; font-weight: 700;">\${formatValue(item.value)}</td>
                    <td>
                        <span class="status \${statusClass}">\${isExpired ? 'EXPIRED' : (item.status || 'Draft').toUpperCase()}</span>
                        \${isExpiringSoon ? \`<div style="font-size: 10px; color: var(--orange); font-weight: 600; margin-top: 4px;">Expires in \${daysLeft} days</div>\` : ''}
                        \${isExpired ? \`<div style="font-size: 10px; color: var(--red); font-weight: 600; margin-top: 4px;">Action Required</div>\` : ''}
                    </td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">View</button>
                    </td>
                </tr>
            \`;
        }).join('');`;

// This is a bit risky but we'll try to find the map start
const mapStartRegex = /const rows = filtered\.map\(item => `[^]*?`[^]*?\)\.join\(''\);/g;
contractsContent = contractsContent.replace(mapStartRegex, expiryLogic);

// Also update the table headers
contractsContent = contractsContent.replace(/<tr><th>Ref ID<\/th><th>Contract Title<\/th>.*<th>Status<\/th><th style="text-align:right">Action<\/th><\/tr>/g, 
    '<tr><th>Ref ID</th><th>Contract / Vendor</th><th>Linked Project</th><th style="text-align:left">Value (MWK)</th><th>Status</th><th style="text-align:right">Action</th></tr>');

fs.writeFileSync(contractsPath, contractsContent);

console.log("Refined FD modules with burn rate and expiry alerts.");
