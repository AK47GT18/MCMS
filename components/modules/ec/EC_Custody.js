import client from '../../../src/api/client.js';

export const EC_Custody = {
    getCustodyView() {
        setTimeout(() => this.loadCustodyData(), 0);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Global Chain of Custody Log</div>
                    <div style="display: flex; gap: 12px;">
                        <input type="text" placeholder="Search Asset or Personnel..." class="form-input" style="width: 250px; font-size: 13px;">
                        <button class="btn btn-secondary" onclick="window.app.ecModule.loadCustodyData()"><i class="fas fa-sync"></i> Refresh</button>
                    </div>
                </div>
                <div id="ec-custody-table-container">
                    <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 12px;"></i>
                        <div>Retrieving movement history...</div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadCustodyData() {
        const container = document.getElementById('ec-custody-table-container');
        if (!container) return;

        try {
            // We fetch the audit logs filtered for Asset movements and issues
            const res = await client.get('/audit-logs?limit=100');
            let allLogs = [];
            if (Array.isArray(res)) allLogs = res;
            else if (res.data && Array.isArray(res.data)) allLogs = res.data;
            else if (res.data?.items && Array.isArray(res.data.items)) allLogs = res.data.items;
            else if (res.items && Array.isArray(res.items)) allLogs = res.items;
            
            // Filter for Asset related actions
            const custodyLogs = allLogs.filter(log => 
                ['Asset', 'FLEET', 'EQUIPMENT'].includes(log.targetType?.toUpperCase()) ||
                ['CHECK_OUT', 'CHECK_IN', 'DISPATCHED', 'RETURNED', 'FLAGGED_DEFECTIVE', 'ISSUE_RESOLVED'].includes(log.action?.toUpperCase())
            );

            if (custodyLogs.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);">No custody movements recorded yet.</div>`;
                return;
            }

            container.innerHTML = `
                <table class="premium-table">
                    <thead>
                        <tr><th>Asset / Resource</th><th>Custodian</th><th>Action</th><th>Location / Ref</th><th>Date & Time</th></tr>
                    </thead>
                    <tbody>
                        ${custodyLogs.map(log => {
                            const isIssue = log.action.includes('FLAGGED') || log.action.includes('DEFECTIVE');
                            const actionColor = isIssue ? 'var(--red)' : log.action.includes('RESOLVED') ? 'var(--emerald)' : 'var(--indigo-600)';
                            
                            return `
                                <tr class="animate-slide-up">
                                    <td>
                                        <div style="font-weight: 700; color: var(--slate-900);">${log.targetName || 'Asset ID: ' + log.targetId}</div>
                                        <div style="font-size: 11px; color: var(--slate-500);">${log.targetType}</div>
                                    </td>
                                    <td>
                                        <div style="font-weight: 600;">${log.user?.name || 'System'}</div>
                                        <div style="font-size: 11px; color: var(--slate-500);">${log.user?.role || 'Service'}</div>
                                    </td>
                                    <td>
                                        <span class="status active" style="background: ${actionColor}15; color: ${actionColor}; border:none; font-size: 10px;">
                                            ${log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <div style="font-size: 13px; color: var(--slate-700);">
                                            ${log.metadata?.destinationProjectId ? 'Project: ' + log.metadata.destinationProjectId : 
                                              log.metadata?.fuelLevel ? 'Fuel: ' + log.metadata.fuelLevel + '%' : 'Yard / Depot'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style="font-size: 12px; font-weight: 600; color: var(--slate-900);">${new Date(log.timestamp).toLocaleDateString()}</div>
                                        <div style="font-size: 11px; color: var(--slate-500);">${new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } catch (err) {
            console.error('[EC] Custody load failed:', err);
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">${err.message}</div>`;
        }
    }
};
