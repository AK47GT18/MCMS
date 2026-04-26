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
                            <button class="btn btn-action btn-sm" onclick="window.app.openIssueDrawer(${this.selectedProjectId || 'null'}, 'Log Issue')"><i class="fas fa-plus"></i> Log Issue</button>
                        </div>
                    </div>
                    
                    <div id="issues-table-container" class="table-responsive">
                        ${this.renderLoadingState()}
                    </div>
                </div>
            </div>
        `;
    },

    async loadIssuesFromAPI(isPolling = false) {
        const container = document.getElementById('issues-table-container');
        if (!container) return;

        try {
            // Force cache bypass for real-time updates
            const response = await issues.getAll({ limit: 50 }, { skipCache: true });
            const data = response.data || response;
            const issuesList = Array.isArray(data) ? data : data.issues || [];

            if (issuesList.length === 0) {
                container.innerHTML = this.renderEmptyState('No active issues or governance alerts.');
            } else {
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
    },

    renderIssuesTable(issuesList) {
        const rows = issuesList.map(item => `
            <tr>
                <td style="font-weight: 700;">ISS-${this.escapeHTML(item.id)}</td>
                <td><span class="badge" style="background: var(--orange-light); color: var(--orange-hover); font-size: 10px; padding: 2px 8px; border-radius: 4px;">${this.escapeHTML(item.category || 'Site')}</span></td>
                <td title="${this.escapeHTML(item.description)}" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHTML(item.description)}</td>
                <td>${this.escapeHTML(item.projectName || item.project?.name || 'Central')}</td>
                <td><span class="status ${item.priority === 'high' ? 'red' : 'active'}" style="background: ${item.priority === 'high' ? '#FEE2E2' : '#F0F9FF'}; color: ${item.priority === 'high' ? '#991B1B' : '#075985'};">${this.escapeHTML(item.priority?.toUpperCase() || 'NORMAL')}</span></td>
                <td><span class="status ${item.status === 'open' ? 'pending' : 'active'}">${this.escapeHTML(item.status?.toUpperCase() || 'OPEN')}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Issue Details', window.DrawerTemplates.complaintDetails(${JSON.stringify(item).replace(/"/g, '&quot;')})); window.app.pmModule.initIssueResolutionForm(${JSON.stringify(item).replace(/"/g, '&quot;')})">Respond</button>
                </td>
            </tr>
        `).join('');

        return `
            <table class="data-table">
                <thead>
                    <tr><th>ID</th><th>Type</th><th>Description</th><th>Project</th><th>Priority</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
};
