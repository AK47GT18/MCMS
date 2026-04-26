import client from '../../src/api/client.js';

export const Shared_Audit = {
    getAuditView() {
        if (!this.auditLogs) this.auditLogs = [];
        if (!this._loadAuditLogs) {
            this._loadAuditLogs = async () => {
                try {
                    const res = await client.get('/audit-logs?limit=100');
                    let logs = [];
                    if (Array.isArray(res)) logs = res;
                    else if (res.data && Array.isArray(res.data)) logs = res.data;
                    else if (res.data?.items && Array.isArray(res.data.items)) logs = res.data.items;
                    else if (res.items && Array.isArray(res.items)) logs = res.items;

                    this.auditLogs = logs;
                    this._refreshCurrentView();
                } catch (err) {
                    console.error('Audit load failed:', err);
                }
            };
            this._loadAuditLogs();
        }

        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Immutable Security Event Log</div>
                    <div style="display: flex; gap: 12px;">
                        <input type="text" id="audit-search" class="form-input" placeholder="Search logs..." style="width: 200px; padding: 6px 12px; font-size: 13px;" oninput="window.app.ecModule?.filterAuditLogs(this.value)">
                        <button class="btn btn-secondary" onclick="window.app.ecModule?._loadAuditLogs()"><i class="fas fa-sync"></i> Refresh</button>
                    </div>
                </div>
                <div style="padding: 0 20px;">
                    <table class="audit-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Actor</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Integrity Hash</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.auditLogs.length === 0 
                                ? '<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--slate-400);">No audit records found</td></tr>'
                                : this.auditLogs.map(log => `
                                    <tr>
                                        <td style="font-family: 'JetBrains Mono'; font-size: 11px;">${new Date(log.createdAt).toLocaleString()}</td>
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--slate-100); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800;">${log.user?.name?.[0] || 'U'}</div>
                                                <span style="font-weight: 600;">${log.user?.name || 'System'}</span>
                                            </div>
                                        </td>
                                        <td><span class="status ${this._getAuditColor(log.action)}">${log.action}</span></td>
                                        <td><span style="font-size: 12px; color: var(--slate-600);">${log.entityType} ${log.entityId ? '#' + log.entityId : ''}</span></td>
                                        <td style="font-family: 'JetBrains Mono'; font-size: 10px; color: var(--slate-400);">${log.id.substring(0, 16)}...</td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    _getAuditColor(action) {
        if (action.includes('CREATE') || action.includes('APPROVE')) return 'active';
        if (action.includes('DELETE') || action.includes('REJECT')) return 'locked';
        if (action.includes('UPDATE')) return 'pending';
        return 'active';
    }
};
