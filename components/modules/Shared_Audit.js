import client from '../../src/api/client.js';

export const Shared_Audit = {
    getAuditView() {
        if (!this.auditLogs) this.auditLogs = [];
        if (!this._auditFilters) {
            this._auditFilters = {
                search: '',
                category: window.app.currentUser?.role?.includes('Finance') ? 'FINANCIAL' : 'ALL',
                level: 'ALL',
                role: 'ALL'
            };
        }

        if (!this._loadAuditLogs) {
            this._loadAuditLogs = async () => {
                try {
                    const res = await client.get('/audit-logs?limit=200');
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

        const filteredLogs = this.auditLogs.filter(log => {
            const matchesSearch = !this._auditFilters.search || 
                (log.userName || '').toLowerCase().includes(this._auditFilters.search.toLowerCase()) ||
                (log.action || '').toLowerCase().includes(this._auditFilters.search.toLowerCase());
            
            const matchesLevel = this._auditFilters.level === 'ALL' || log.severity === this._auditFilters.level;
            const matchesRole = this._auditFilters.role === 'ALL' || log.userRole === this._auditFilters.role;
            
            let matchesCategory = true;
            if (this._auditFilters.category === 'FINANCIAL') {
                const finActions = ['REQUISITION', 'BUDGET', 'FINANCE', 'TRANSACTION', 'PAYMENT', 'CONTRACT', 'VALUE'];
                matchesCategory = finActions.some(a => (log.action || '').toUpperCase().includes(a));
            } else if (this._auditFilters.category === 'SECURITY') {
                const secActions = ['LOGIN', 'LOGOUT', 'PASSWORD', 'PERMISSION', 'LOCK', 'AUTH'];
                matchesCategory = secActions.some(a => (log.action || '').toUpperCase().includes(a));
            } else if (this._auditFilters.category === 'PROJECT') {
                const projActions = ['TASK', 'PROGRESS', 'SITE', 'DAILY_LOG', 'ISSUE', 'LOGISTICS'];
                matchesCategory = projActions.some(a => (log.action || '').toUpperCase().includes(a));
            }

            return matchesSearch && matchesLevel && matchesRole && matchesCategory;
        });

        const activeModuleStr = window.app.currentUser?.role === 'Project Manager' ? 'pmModule' : 
                               window.app.currentUser?.role === 'Finance Director' ? 'fmModule' : 
                               window.app.currentUser?.role === 'Field Supervisor' ? 'fsModule' : 'ecModule';

        return `
            <div class="data-card" style="border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
                <div class="data-card-header" style="background: white; border-bottom: 1px solid var(--slate-100); padding: 24px;">
                    <div>
                        <div style="font-size: 20px; font-weight: 900; color: var(--slate-900);">Immutable Audit & Security Log</div>
                        <div style="font-size: 13px; color: var(--slate-500); margin-top: 4px;">Cryptographically signed event ledger</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" style="padding: 8px 16px;" onclick="window.app.${activeModuleStr}?._loadAuditLogs()">
                            <i class="fas fa-sync-alt"></i> Sync Ledger
                        </button>
                    </div>
                </div>

                <div style="background: var(--slate-50); padding: 20px; border-bottom: 1px solid var(--slate-100); display: flex; flex-wrap: wrap; gap: 16px;">
                    <div style="flex: 1; min-width: 200px;">
                        <label style="display: block; font-size: 10px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; margin-bottom: 6px;">Search Ledger</label>
                        <div style="position: relative;">
                            <i class="fas fa-search" style="position: absolute; left: 12px; top: 12px; color: var(--slate-300);"></i>
                            <input type="text" class="form-input" placeholder="Search actor or action..." value="${this._auditFilters.search}" 
                                style="width: 100%; padding: 10px 12px 10px 36px; border-radius: 10px;"
                                oninput="window.app.${activeModuleStr}._updateAuditFilter('search', this.value)">
                        </div>
                    </div>

                    <div style="width: 160px;">
                        <label style="display: block; font-size: 10px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; margin-bottom: 6px;">Action Trail</label>
                        <select class="form-input" style="width: 100%; border-radius: 10px; font-weight: 700;" onchange="window.app.${activeModuleStr}._updateAuditFilter('category', this.value)">
                            <option value="ALL" ${this._auditFilters.category === 'ALL' ? 'selected' : ''}>All Actions</option>
                            <option value="FINANCIAL" ${this._auditFilters.category === 'FINANCIAL' ? 'selected' : ''}>💰 Financial Records</option>
                            <option value="PROJECT" ${this._auditFilters.category === 'PROJECT' ? 'selected' : ''}>🏗️ Project Ops</option>
                            <option value="SECURITY" ${this._auditFilters.category === 'SECURITY' ? 'selected' : ''}>🛡️ Security & Auth</option>
                        </select>
                    </div>

                    <div style="width: 140px;">
                        <label style="display: block; font-size: 10px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; margin-bottom: 6px;">Audit Level</label>
                        <select class="form-input" style="width: 100%; border-radius: 10px; font-weight: 700;" onchange="window.app.${activeModuleStr}._updateAuditFilter('level', this.value)">
                            <option value="ALL">All Levels</option>
                            <option value="info" ${this._auditFilters.level === 'info' ? 'selected' : ''}>Info</option>
                            <option value="warning" ${this._auditFilters.level === 'warning' ? 'selected' : ''}>Warning</option>
                            <option value="error" ${this._auditFilters.level === 'error' ? 'selected' : ''}>Critical</option>
                        </select>
                    </div>
                </div>

                <div style="overflow-x: auto;">
                    <table class="audit-table" style="width: 100%; border-collapse: collapse;">
                        <thead style="background: var(--slate-50);">
                            <tr>
                                <th style="padding: 16px 20px; text-align: left; font-size: 11px; color: var(--slate-400); text-transform: uppercase;">Event Details</th>
                                <th style="padding: 16px 20px; text-align: left; font-size: 11px; color: var(--slate-400); text-transform: uppercase;">Actor</th>
                                <th style="padding: 16px 20px; text-align: left; font-size: 11px; color: var(--slate-400); text-transform: uppercase;">Action</th>
                                <th style="padding: 16px 20px; text-align: left; font-size: 11px; color: var(--slate-400); text-transform: uppercase;">Target Entity</th>
                                <th style="padding: 16px 20px; text-align: left; font-size: 11px; color: var(--slate-400); text-transform: uppercase;">Hash</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredLogs.length === 0 
                                ? '<tr><td colspan="5" style="text-align:center; padding: 60px; color: var(--slate-400);"><i class="fas fa-history" style="font-size: 32px; display: block; margin-bottom: 16px; opacity: 0.3;"></i> No matching audit records found</td></tr>'
                                : filteredLogs.map(log => `
                                    <tr style="border-bottom: 1px solid var(--slate-50); transition: background 0.2s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'">
                                        <td style="padding: 16px 20px;">
                                            <div style="font-family: 'JetBrains Mono'; font-size: 11px; color: var(--slate-500);">${new Date(log.timestamp || log.createdAt).toLocaleString()}</div>
                                            <div style="font-size: 11px; color: var(--slate-400); margin-top: 2px;">IP: ${log.ipAddress || 'Internal'}</div>
                                        </td>
                                        <td style="padding: 16px 20px;">
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--slate-100); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; color: var(--slate-600);">${(log.userName || 'S')[0]}</div>
                                                <div>
                                                    <div style="font-weight: 700; color: var(--slate-800); font-size: 13px;">${log.userName || 'System'}</div>
                                                    <div style="font-size: 10px; color: var(--slate-400); text-transform: uppercase;">${log.userRole || 'Automated'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="padding: 16px 20px;">
                                            <span class="status ${this._getAuditColor(log.action, log.severity)}" style="padding: 4px 10px; font-size: 11px; font-weight: 800; border-radius: 6px;">
                                                ${log.action}
                                            </span>
                                        </td>
                                        <td style="padding: 16px 20px;">
                                            <div style="font-weight: 700; color: var(--slate-700); font-size: 13px;">${log.targetType || 'System'}</div>
                                            <div style="font-size: 11px; color: var(--slate-400);">${log.targetCode || (log.targetId ? '#' + log.targetId : 'Global')}</div>
                                        </td>
                                        <td style="padding: 16px 20px;">
                                            <div style="font-family: 'JetBrains Mono'; font-size: 10px; color: var(--slate-400); background: var(--slate-50); padding: 4px 8px; border-radius: 4px; display: inline-block;">
                                                SHA256:${(log.id + '').padStart(8, '0').substring(0, 8)}...
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    _updateAuditFilter(key, value) {
        if (!this._auditFilters) return;
        this._auditFilters[key] = value;
        this._refreshCurrentView();
    },

    _getAuditColor(action, severity) {
        if (severity === 'error' || severity === 'critical') return 'locked';
        if (severity === 'warning') return 'pending';
        
        const act = (action || '').toUpperCase();
        if (act.includes('CREATE') || act.includes('APPROVE') || act.includes('LOGIN')) return 'active';
        if (act.includes('DELETE') || act.includes('REJECT') || act.includes('FAIL')) return 'locked';
        if (act.includes('UPDATE') || act.includes('CHANGE')) return 'pending';
        return 'active';
    }
};
