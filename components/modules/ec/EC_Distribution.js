import client from '../../../src/api/client.js';

export const EC_Distribution = {
    dispatchLogs: [],
    isLoadingLogs: false,

    getDistributionLogView() {
        return `
            <div class="data-card" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5);">
                <div class="data-card-header">
                    <div class="card-title">Project Consumption (Burn) Log</div>
                    <button class="btn btn-secondary" onclick="window.app.ecModule._loadDistributionLogs()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                <div style="padding: 0 20px 20px;">
                ${(this.dispatchLogs || []).length === 0
                    ? `
                    <div style="padding: 60px; text-align: center; color: var(--slate-400);">
                        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.1;"><i class="fas fa-route"></i></div>
                        <div style="font-weight: 700; color: var(--slate-600);">No Consumption Logs</div>
                        <p style="font-size: 13px; margin-top: 8px;">History of site dispatches will appear here.</p>
                    </div>`
                    : `<table class="premium-table">
                        <thead>
                            <tr><th>Reference</th><th>Site / Project</th><th>Resource</th><th>Qty</th><th>Status</th><th>By</th><th>Time</th></tr>
                        </thead>
                        <tbody>
                            ${this.dispatchLogs.map(log => `
                                <tr class="animate-slide-up">
                                    <td><span class="project-id">${log.id}</span></td>
                                    <td style="font-weight: 600; color: var(--slate-800);">
                                        <div>${log.projectName || 'General Site'}</div>
                                        <div style="font-size: 10px; color: var(--slate-500);">${log.sectorName}</div>
                                    </td>
                                    <td style="font-weight: 700;">${log.materialName}</td>
                                    <td style="font-weight: 800; color: ${log.type === 'IN' ? 'var(--emerald)' : 'var(--red)'};">
                                        ${log.type === 'IN' ? '+' : '-'}${log.quantity} ${log.unit}
                                    </td>
                                    <td>
                                        <span class="status ${log.type === 'IN' ? 'active' : 'pending'}" style="border:none; font-size: 10px;">
                                            ${log.type === 'IN' ? 'STOCK IN' : 'STOCK OUT'}
                                        </span>
                                    </td>
                                    <td style="font-size: 13px; color: var(--slate-600);">${log.user?.name || 'System'}</td>
                                    <td style="font-size: 11px; color: var(--slate-400); font-family: 'JetBrains Mono';">${new Date(log.timestamp).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
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
            // Fetch global logs from the new endpoint
            const res = await client.get('/inventory/logs');
            const logs = Array.isArray(res) ? res : (res.data || []);
            
            // Map and store logs
            this.dispatchLogs = logs.map(log => ({
                id: `L-${log.id}`,
                projectName: log.projectName,
                sectorName: log.sectorName,
                materialName: log.materialName,
                quantity: log.quantity,
                unit: log.unit,
                type: log.type,
                user: log.user,
                timestamp: log.timestamp
            }));

            // Force UI update if dashboard is visible
            if (window.app?.ecModule?.render) {
                window.app.ecModule.render();
            }
        } catch (error) {
            console.error('[EC] Failed to load distribution logs:', error);
            window.toast?.show('Failed to sync consumption logs', 'error');
        } finally {
            this.isLoadingLogs = false;
        }
    }
};
