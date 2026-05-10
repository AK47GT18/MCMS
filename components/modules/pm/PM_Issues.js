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

export const PM_Issues = {
    getIssuesView() {
        console.log('[DEBUG] Loading Issues View - Version 2.0');
        setTimeout(() => this.loadIssuesFromAPI(), 0);
        return `
            <div class="view-content" style="padding: 24px;">
                <div class="data-card shadow-sm" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--slate-200);">
                    <div style="padding: 20px; border-bottom: 1px solid var(--slate-100); display: flex; justify-content: space-between; align-items: center; background: var(--slate-50);">
                        <div>
                            <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--slate-900);">Project Issues & Governance Alerts</h3>
                            <p style="margin: 4px 0 0; font-size: 12px; color: var(--slate-500);">Track reported safety hazards and accountability flags.</p>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary btn-sm" onclick="window.app.pmModule.loadIssuesFromAPI()"><i class="fas fa-sync"></i> Refresh</button>
                            <button class="btn btn-action btn-sm" onclick="window.app.openIssueDrawer(null, 'Report Issue')"><i class="fas fa-plus"></i> Report Issue</button>
                        </div>
                    </div>
                    
                    <div id="issues-table-container" class="table-responsive">
                        ${this.renderLoadingState()}
                    </div>
                </div>
            </div>
        `;
    },

    async loadIssuesFromAPI(isPolling = false) {
        const container = document.getElementById('issues-table-container');
        if (!container) return;

        try {
            // Force cache bypass for real-time updates
            const response = await issues.getAll({ limit: 20 }, { skipCache: true });
            const data = response.data || response;
            const issuesList = Array.isArray(data) ? data : data.issues || [];

            if (issuesList.length === 0) {
                container.innerHTML = this.renderEmptyState('No active issues or governance alerts.');
            } else {
                this.currentIssues = issuesList; // Cache for lookup
                container.innerHTML = this.renderIssuesTable(issuesList);
            }
        } catch (error) {
            console.error('Failed to load issues:', error);
            if (!isPolling) {
                container.innerHTML = this.renderEmptyState('Failed to load issues registry.');
            }
        }

        // Real-time polling logic
        if (this.currentView === 'issues') {
            if (this._issuesPollingTimer) clearTimeout(this._issuesPollingTimer);
            this._issuesPollingTimer = setTimeout(() => this.loadIssuesFromAPI(true), 15000); // Poll every 15s
        }
    },

    handleRespondToIssue(id) {
        const issue = this.currentIssues?.find(i => i.id === id);
        if (!issue) return;
        window.drawer.open('Issue Details', window.DrawerTemplates.complaintDetails(issue));
        window.app.pmModule.initIssueResolutionForm(issue);
    },

    renderIssuesTable(issuesList) {
        const rows = issuesList.map(item => `
            <tr>
                <td style="font-weight: 700;">ISS-${this.escapeHTML(item.id)}</td>
                <td><span class="badge" style="background: var(--orange-light); color: var(--orange-hover); font-size: 10px; padding: 2px 8px; border-radius: 4px;">${this.escapeHTML(item.category || 'Site')}</span></td>
                <td>
                    <div style="font-weight: 600; font-size: 13px;">${this.escapeHTML(item.reporter?.name || 'Site Manager')}</div>
                    <div style="font-size: 10px; color: var(--slate-500);">${item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Today'}</div>
                </td>
                <td title="${this.escapeHTML(item.description)}" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHTML(item.description)}</td>
                <td style="font-size: 12px; color: var(--slate-600);">${this.escapeHTML(item.projectName || item.project?.name || 'Central')}</td>
                <td><span class="status ${item.priority?.toLowerCase() === 'high' || item.priority?.toLowerCase() === 'critical' ? 'red' : 'active'}" style="font-size: 10px; font-weight: 700;">${this.escapeHTML(item.priority?.toUpperCase() || 'NORMAL')}</span></td>
                <td><span class="status ${item.status === 'open' ? 'pending' : (item.status === 'resolved' || item.status === 'closed') ? 'active' : 'locked'}" style="font-size: 10px; font-weight: 700;">${this.escapeHTML(item.status?.toUpperCase() || 'OPEN')}</span></td>
                <td>
                    ${(item.status !== 'resolved' && item.status !== 'closed') ? 
                        `<button class="btn btn-action btn-sm" style="font-size: 11px; padding: 4px 12px;" onclick="window.app.pmModule.handleRespondToIssue(${item.id})">Respond</button>` :
                        `<button class="btn btn-secondary btn-sm" style="font-size: 11px; padding: 4px 12px;" onclick="window.app.pmModule.handleRespondToIssue(${item.id})"><i class="fas fa-history" style="margin-right:4px;"></i> History</button>`
                    }
                </td>
            </tr>
        `).join('');

        return `
            <table class="data-table">
                <thead style="background: var(--slate-50);">
                    <tr>
                        <th style="width: 80px;">ID</th>
                        <th style="width: 100px;">Type</th>
                        <th style="width: 150px;">Reporter</th>
                        <th>Narrative</th>
                        <th style="width: 150px;">Project</th>
                        <th style="width: 100px;">Priority</th>
                        <th style="width: 100px;">Status</th>
                        <th style="width: 120px; text-align: right; padding-right: 24px;">Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    },

    renderLoadingState() {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400);">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                <div>Loading issues...</div>
            </div>
        `;
    },

    renderEmptyState(message) {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400);">
                <i class="fas fa-clipboard-check" style="font-size: 32px; margin-bottom: 16px; opacity: 0.3;"></i>
                <div>${message}</div>
            </div>
        `;
    },

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};
