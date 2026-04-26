import client from '../../../src/api/client.js';

export const EC_Distribution = {
    getDistributionLogView() {
        return `
            <div class="data-card" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5);">
                <div class="data-card-header">
                    <div class="card-title">Project Consumption (Burn) Log</div>
                    <button class="btn btn-secondary" onclick="window.app.ecModule._loadDistributionLogs()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                <div style="padding: 0 20px 20px;">
                ${this.dispatchLogs.length === 0
                    ? `
                    <div style="padding: 60px; text-align: center; color: var(--slate-400);">
                        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.1;"><i class="fas fa-route"></i></div>
                        <div style="font-weight: 700; color: var(--slate-600);">No Consumption Logs</div>
                        <p style="font-size: 13px; margin-top: 8px;">History of site dispatches will appear here.</p>
                    </div>`
                    : `<table class="premium-table">
                        <thead>
                            <tr><th>Reference</th><th>Site / Project</th><th>Resource</th><th>Qty Dispatched</th><th>Status</th><th>By</th><th>Time</th></tr>
                        </thead>
                        <tbody>
                            ${this.dispatchLogs.map(log => `
                                <tr class="animate-slide-up">
                                    <td><span class="project-id">${log.id}</span></td>
                                    <td style="font-weight: 600; color: var(--slate-800);">${log.project}</td>
                                    <td style="font-weight: 700;">${log.item}</td>
                                    <td style="font-weight: 800; color: var(--indigo-600);">${log.qty} ${log.unit}</td>
                                    <td>
                                        <span class="status ${log.type === 'IN' ? 'active' : 'pending'}" style="border:none;">
                                            ${log.type === 'IN' ? 'STOCK IN' : 'OUTBOUND'}
                                        </span>
                                    </td>
                                    <td style="font-size: 13px; color: var(--slate-600);">${log.supervisor}</td>
                                    <td style="font-size: 11px; color: var(--slate-400); font-family: 'JetBrains Mono';">${log.time}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
                </div>
            </div>
        `;
    },

    async _loadDistributionLogs() {
        if (this.isLoadingLogs) return;
        this.isLoadingLogs = true;
        try {
            // Aggregate logs from projects 1, 2, 3
            const projectIds = [1, 2, 3];
            const allResults = await Promise.all(projectIds.map(id => client.get(`/inventory/project/${id}`).catch(() => [])));
            
            const logs = [];
            allResults.forEach(result => {
                const items = Array.isArray(result) ? result : (result.data || []);
                items.forEach(item => {
                    if (item.logs) {
                        item.logs.forEach(log => {
                            logs.push({
                                id: `D-${log.id}`,
                                project: item.sectorName || 'Project Site',
                                item: item.materialName,
                                qty: Number(log.quantity),
                                unit: item.unit,
                                supervisor: log.user?.name || 'System',
                                time: new Date(log.timestamp).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                                type: log.type
                            });
                        });
                    }
                });
            });

            // Sort by time descending
            this.dispatchLogs = logs.sort((a, b) => new Date(b.time) - new Date(a.time));
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load distribution logs:', error);
        } finally {
            this.isLoadingLogs = false;
        }
    }
};
