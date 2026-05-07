import client from '../../../src/api/client.js';
import contracts from '../../../src/api/contracts.api.js';
import requisitions from '../../../src/api/requisitions.api.js';

export const FD_Ledger = {
    getLedgerView() {
        setTimeout(() => this.loadLedgerData(), 0);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Commitments Ledger</div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-secondary" onclick="window.app.fmModule?.loadLedgerData()"><i class="fas fa-sync"></i> Refresh</button>
                        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export</button>
                    </div>
                </div>
                <div style="padding: 24px; background: white; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-weight: 800; color: var(--slate-800); font-size: 14px; text-transform: uppercase;">Portfolio Budget Exposure</span>
                            <span id="ledger-total-value" style="font-family: 'JetBrains Mono'; font-weight: 800; font-size: 14px; color: var(--slate-900);">Calculating...</span>
                        </div>
                        <div id="ledger-exposure-bar" style="height: 12px; background: var(--slate-100); border-radius: 6px; overflow: hidden; display: flex;">
                            <!-- Segments will be injected here -->
                        </div>
                        <div id="ledger-legend" style="display: flex; gap: 16px; margin-top: 12px; font-size: 11px; font-weight: 600;">
                            <!-- Legend will be injected here -->
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                        <div style="padding: 16px; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 8px;">
                            <div style="font-size: 11px; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">Active Contracts</div>
                            <div id="ledger-active-contracts" style="font-size: 20px; font-weight: 800; color: var(--emerald);">--</div>
                        </div>
                        <div style="padding: 16px; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 8px;">
                            <div style="font-size: 11px; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">Pending Req. Volume</div>
                            <div id="ledger-pending-approvals" style="font-size: 20px; font-weight: 800; color: var(--orange);">--</div>
                        </div>
                        <div style="padding: 16px; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 8px;">
                            <div style="font-size: 11px; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">Approved Uplifts</div>
                            <div id="ledger-approved-uplifts" style="font-size: 20px; font-weight: 800; color: var(--blue);">--</div>
                        </div>
                    </div>
                </div>
                <div id="fm-ledger-table-container">
                    <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 12px;"></i>
                        <div>Aggregating organizational commitments...</div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadLedgerData() {
        const container = document.getElementById('fm-ledger-table-container');
        if (!container) return;

        try {
            const [contractsRes, reqsRes, bcrRes] = await Promise.all([
                contracts.getAll({ limit: 20 }),
                requisitions.getPending().catch(() => ({ data: [] })),
                client.get('/budget-changes').catch(() => ({ data: [] }))
            ]);

            const allContracts = contractsRes.data?.contracts || contractsRes.data || [];
            const allReqs = Array.isArray(reqsRes) ? reqsRes : (reqsRes.data || []);
            const allBcrs = Array.isArray(bcrRes.data) ? bcrRes.data : (bcrRes.data?.items || []);

            // Combine into a ledger format
            const commitments = [
                ...allContracts.map(c => ({
                    id: c.contractCode || `CON-${c.id}`,
                    type: 'Contract',
                    subject: c.title,
                    party: c.vendor?.name || 'Unknown Vendor',
                    value: Number(c.value || 0),
                    status: c.status,
                    date: c.startDate || c.createdAt
                })),
                ...allReqs.map(r => ({
                    id: r.reqCode || `REQ-${r.id}`,
                    type: 'Requisition',
                    subject: `Material Request: ${r.project?.name || 'Project'}`,
                    party: r.submittedBy?.name || 'Equipment Coordinator',
                    value: Number(r.totalAmount || 0),
                    status: r.status || 'Pending',
                    date: r.createdAt
                })),
                ...allBcrs.filter(b => b.status === 'Approved').map(b => ({
                    id: `BCR-${b.id}`,
                    type: 'Budget Uplift',
                    subject: `Project Extension: ${b.project?.name}`,
                    party: 'Project Manager',
                    value: Number(b.amount || 0),
                    status: b.status,
                    date: b.createdAt
                }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            const totalVal = commitments.reduce((sum, c) => sum + c.value, 0);
            
            const contractsTotal = commitments.filter(c => c.type === 'Contract').reduce((sum, c) => sum + c.value, 0);
            const reqsTotal = commitments.filter(c => c.type === 'Requisition').reduce((sum, c) => sum + c.value, 0);
            const bcrsTotal = commitments.filter(c => c.type === 'Budget Uplift').reduce((sum, c) => sum + c.value, 0);

            const pContracts = totalVal > 0 ? (contractsTotal / totalVal) * 100 : 0;
            const pReqs = totalVal > 0 ? (reqsTotal / totalVal) * 100 : 0;
            const pBcrs = totalVal > 0 ? (bcrsTotal / totalVal) * 100 : 0;
            
            // Format currency helper
            const formatCurrency = (val) => Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 });

            // Update summary cards
            document.getElementById('ledger-total-value').textContent = formatCurrency(totalVal) + ' MWK';
            document.getElementById('ledger-active-contracts').textContent = allContracts.filter(c => c.status === 'Active' || c.status === 'active').length;
            document.getElementById('ledger-pending-approvals').textContent = formatCurrency(reqsTotal) + ' MWK';
            document.getElementById('ledger-approved-uplifts').textContent = formatCurrency(bcrsTotal) + ' MWK';

            // Visual Budget Exposure Bar
            const bar = document.getElementById('ledger-exposure-bar');
            if (bar) {
                bar.innerHTML = `
                    <div style="width: ${pContracts}%; background: var(--emerald); height: 100%; transition: width 0.5s;"></div>
                    <div style="width: ${pReqs}%; background: var(--orange); height: 100%; transition: width 0.5s;"></div>
                    <div style="width: ${pBcrs}%; background: var(--blue); height: 100%; transition: width 0.5s;"></div>
                `;
            }

            const legend = document.getElementById('ledger-legend');
            if (legend) {
                legend.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 4px; color: var(--emerald);"><i class="fas fa-circle" style="font-size: 8px;"></i> Executed Contracts (${pContracts.toFixed(1)}%)</div>
                    <div style="display: flex; align-items: center; gap: 4px; color: var(--orange);"><i class="fas fa-circle" style="font-size: 8px;"></i> Pending Requisitions (${pReqs.toFixed(1)}%)</div>
                    <div style="display: flex; align-items: center; gap: 4px; color: var(--blue);"><i class="fas fa-circle" style="font-size: 8px;"></i> Approved Uplifts (${pBcrs.toFixed(1)}%)</div>
                `;
            }

            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Entry ID</th>
                            <th>Category</th>
                            <th>Description / Party</th>
                            <th style="text-align:right">Value (MWK)</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${commitments.map(c => `
                            <tr>
                                <td><span class="project-id">${c.id}</span></td>
                                <td style="font-weight:600;">${c.type}</td>
                                <td>
                                    <div style="font-weight:600; font-size:13px;">${c.subject}</div>
                                    <div style="font-size:11px; color:var(--slate-500);">${c.party}</div>
                                </td>
                                <td style="text-align:right; font-family:'JetBrains Mono'; font-weight:700;">${c.value.toLocaleString()}</td>
                                <td><span class="status ${this._getStatusClass(c.status)}">${c.status || 'Unknown'}</span></td>
                                <td style="font-size:12px; color:var(--slate-500);">${new Date(c.date).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Ledger error:', error);
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">${error.message}</div>`;
        }
    },

    _getStatusClass(status) {
        if (!status) return 'locked';
        const s = status.toLowerCase();
        if (s.includes('active') || s.includes('approved')) return 'active';
        if (s.includes('pending')) return 'locked';
        if (s.includes('expired') || s.includes('rejected')) return 'delayed';
        return 'locked';
    }
};
