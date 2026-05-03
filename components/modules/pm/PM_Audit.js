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
        setTimeout(() => this.loadAuditLogs(), 0);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Immutable Audit &amp; Security Log</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <div style="position: relative;">
                            <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--slate-400); font-size: 12px;"></i>
                            <input type="text" id="audit-search" class="form-input" placeholder="Search actor or action..." style="width: 200px; padding: 6px 12px 6px 30px; font-size: 13px;" onkeyup="if(event.key === 'Enter') window.app.pmModule.loadAuditLogs()">
                        </div>
                        <select id="audit-action-filter" class="form-input" style="width: 160px; padding: 4px 8px; font-size: 13px;" onchange="window.app.pmModule.loadAuditLogs()">
                            <option value="all">All Actions</option>
                            <option value="CREATE_PROJECT">Create Project</option>
                            <option value="APPROVE">Approve</option>
                            <option value="REJECT">Reject</option>
                            <option value="LOGIN">Login</option>
                            <option value="CREATE_USER">Create User</option>
                            <option value="UPDATE_PROJECT">Update Project</option>
                            <option value="DELETE">Delete</option>
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

    async loadAuditLogs() {
        const container = document.getElementById('audit-table-container');
        if (!container) return;

        const search = document.getElementById('audit-search')?.value;
        const severity = document.getElementById('audit-severity-filter')?.value;
        const actionFilter = document.getElementById('audit-action-filter')?.value;

        try {
            const params = { limit: 100 };
            if (search) params.search = search;
            if (severity && severity !== 'all') params.severity = severity;
            if (actionFilter && actionFilter !== 'all') params.action = actionFilter;

            const response = await audit.getAll(params);
            const data = response.data || response;
            const logs = Array.isArray(data) ? data : data.logs || [];
            
            if (logs.length === 0) {
                container.innerHTML = this.renderEmptyState('No audit logs found matching your criteria.');
                return;
            }

            container.innerHTML = this.renderAuditTable(logs);
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
                '<i class="fas fa-circle-exclamation" style="color: var(--red);" title="Critical"></i>' :
                '<i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i>';
            const statusClass = log.status === 'success' || !log.status ? 'active' : 'rejected';
            
            return `
                <tr>
                    <td style="text-align: center;">${sevIcon}</td>
                    <td style="font-family: 'JetBrains Mono'; font-size: 12px;">${new Date(log.timestamp).toLocaleString()}</td>
                    <td style="font-weight: 600;">
                        ${log.userName || 'System'}
                        ${log.details?.requestedByName ? `<div style="font-size: 10px; color: var(--orange); font-weight: 700; text-transform: uppercase; margin-top: 2px;">Requested by: ${log.details.requestedByName}</div>` : ''}
                    </td>
                    <td>${log.action}</td>
                    <td>${log.targetType || '-'}${log.targetCode ? ` (${log.targetCode})` : ''}</td>
                    <td style="font-family: 'JetBrains Mono'; font-size: 12px;">${log.ipAddress || 'internal'}</td>
                    <td><span class="status ${statusClass}">${log.status || 'Success'}</span></td>
                </tr>
            `;
        }).join('');

        return `
            <table class="audit-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">Sev.</th>
                        <th>Timestamp</th>
                        <th>User / Actor</th>
                        <th>Event Action</th>
                        <th>Target Resource</th>
                        <th>IP Address</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody style="font-size: 13px;">${rows}</tbody>
            </table>
        `;
    }
};
