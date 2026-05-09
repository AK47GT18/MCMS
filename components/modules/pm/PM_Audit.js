import client from '../../../src/api/client.js';
import projects from '../../../src/api/projects.api.js';
import users from '../../../src/api/users.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import requisitions from '../../../src/api/requisitions.api.js';
import audit from '../../../src/api/audit.api.js';
import procurement from '../../../src/api/procurement.api.js';
import assets from '../../../src/api/assets.api.js';
import issues from '../../../src/api/issues.api.js';
import tasks from '../../../src/api/tasks.api.js';
import contracts from '../../../src/api/contracts.api.js';

export const PM_Audit = {
    getAuditView() {
        setTimeout(() => {
            this.loadAuditLogs();
            this.loadAuditActions();
        }, 0);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Immutable Audit &amp; Security Log</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <div style="position: relative;">
                            <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--slate-400); font-size: 12px;"></i>
                            <input type="text" id="audit-search" class="form-input" placeholder="Search actor or action..." style="width: 200px; padding: 6px 12px 6px 30px; font-size: 13px;" oninput="clearTimeout(window._auditSearchTimer); window._auditSearchTimer = setTimeout(() => window.app.pmModule.loadAuditLogs(), 500)">
                        </div>
                        <select id="audit-action-filter" class="form-input" style="width: 160px; padding: 4px 8px; font-size: 13px;" onchange="window.app.pmModule.loadAuditLogs()">
                            <option value="all">All Actions</option>
                        </select>
                        <select id="audit-severity-filter" class="form-input" style="width: 120px; padding: 4px 8px; font-size: 13px;" onchange="window.app.pmModule.loadAuditLogs()">
                            <option value="all">All Levels</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error / Critical</option>
                        </select>
                        <button class="btn btn-secondary" onclick="window.app.pmModule.loadAuditLogs()" data-tooltip="Refresh"><i class="fas fa-sync"></i></button>
                    </div>
                </div>
                <div id="audit-table-container">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    },

    async loadAuditActions() {
        try {
            const actions = await audit.getActions();
            const select = document.getElementById('audit-action-filter');
            if (!select) return;
            
            const actionsList = Array.isArray(actions) ? actions : (actions.data || []);
            const current = select.value;
            select.innerHTML = '<option value="all">All Actions</option>' + 
                actionsList.map(a => `<option value="${a}" ${current === a ? 'selected' : ''}>${a.replace(/_/g, ' ')}</option>`).join('');
        } catch (error) {
            console.error('Failed to load audit actions:', error);
        }
    },

    async loadAuditLogs(page = 1) {
        const container = document.getElementById('audit-table-container');
        if (!container) return;

        this._currentAuditPage = page;
        const search = document.getElementById('audit-search')?.value;
        const severity = document.getElementById('audit-severity-filter')?.value;
        const actionFilter = document.getElementById('audit-action-filter')?.value;

        try {
            const params = { limit: 15, page: page };
            if (search) params.search = search;
            if (severity && severity !== 'all') params.severity = severity;
            if (actionFilter && actionFilter !== 'all') params.action = actionFilter;

            const response = await audit.getAll(params);
            const data = response.data || response;
            const logs = Array.isArray(data) ? data : data.logs || [];
            const total = data.total || logs.length;
            const totalPages = Math.ceil(total / 15);
            
            if (logs.length === 0) {
                container.innerHTML = this.renderEmptyState('No audit logs found matching your criteria.');
                return;
            }

            container.innerHTML = `
                ${this.renderAuditTable(logs)}
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--slate-50); border-top: 1px solid var(--slate-200);">
                    <div style="font-size: 12px; color: var(--slate-500);">
                        Showing ${(page - 1) * 15 + 1} - ${Math.min(page * 15, total)} of ${total} entries
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm" ${page === 1 ? 'disabled' : ''} onclick="window.app.pmModule.loadAuditLogs(${page - 1})">
                            <i class="fas fa-chevron-left"></i> Previous
                        </button>
                        <div style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--slate-700);">
                            Page ${page} of ${totalPages || 1}
                        </div>
                        <button class="btn btn-secondary btn-sm" ${page >= totalPages ? 'disabled' : ''} onclick="window.app.pmModule.loadAuditLogs(${page + 1})">
                            Next <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            container.innerHTML = `
                <div style="padding: 24px; text-align: center; color: var(--red);">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <div>Failed to load logs: ${error.message}</div>
                    <button class="btn btn-secondary" style="margin-top: 16px;" onclick="window.app.pmModule.loadAuditLogs()">Retry</button>
                </div>
            `;
        }
    },

    renderAuditTable(logs) {
        const rows = logs.map(log => {
            const severity = log.severity || 'info';
            const sevIcon = severity === 'critical' || severity === 'error' ? 
                '<i class="fas fa-circle-exclamation" style="color: var(--red); font-size: 12px;" title="Critical"></i>' :
                '<i class="fas fa-circle" style="color: var(--slate-300); font-size: 12px;" title="Routine"></i>';
            const statusClass = log.status === 'success' || !log.status ? 'active' : 'rejected';
            
            return `
                <tr style="font-size: 12.5px; transition: background 0.2s;">
                    <td style="text-align: center; padding: 10px 8px;">${sevIcon}</td>
                    <td style="font-family: 'JetBrains Mono'; color: var(--slate-600); padding: 10px 8px; white-space: nowrap;">${new Date(log.timestamp).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                    <td style="font-weight: 600; padding: 10px 8px; color: var(--slate-900);">${log.userName || 'System'}</td>
                    <td style="padding: 10px 8px; font-weight: 700; color: var(--slate-700);">${log.action}</td>
                    <td style="padding: 10px 8px; color: var(--slate-500); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${log.targetType || '-'}${log.targetCode ? ` (${log.targetCode})` : ''}</td>
                    <td style="font-family: 'JetBrains Mono'; color: var(--slate-400); padding: 10px 8px;">${log.ipAddress || 'int'}</td>
                    <td style="padding: 10px 8px;"><span class="status ${statusClass}" style="font-size: 10px; padding: 2px 8px;">${log.status || 'Success'}</span></td>
                    <td style="text-align: right; padding: 10px 12px; white-space: nowrap;">
                        <button class="btn btn-secondary btn-sm" style="font-size: 11px; height: 28px; gap: 6px;" onclick='window.drawer.open("Audit Detail", window.DrawerTemplates.auditDetails(${JSON.stringify(log).replace(/'/g, "&#39;").replace(/"/g, "&quot;")}))'>
                            <i class="fas fa-eye" style="font-size: 11px;"></i> Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="table-responsive" style="overflow-x: auto; background: white; border-radius: 0 0 12px 12px;">
                <table class="audit-table" style="width: 100%; border-collapse: collapse; min-width: 900px;">
                    <thead>
                        <tr style="background: var(--slate-50); border-bottom: 1px solid var(--slate-200);">
                            <th style="width: 40px; padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Sev</th>
                            <th style="padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); text-align: left; font-weight: 700;">Timestamp</th>
                            <th style="padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); text-align: left; font-weight: 700;">Actor</th>
                            <th style="padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); text-align: left; font-weight: 700;">Action</th>
                            <th style="padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); text-align: left; font-weight: 700;">Resource</th>
                            <th style="padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); text-align: left; font-weight: 700;">IP</th>
                            <th style="padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); text-align: left; font-weight: 700;">Status</th>
                            <th style="padding: 12px 12px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); text-align: right; font-weight: 700;">Detail</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }
};
