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

export const PM_Reviews = {
    getReviewsView() {
        this.currentReviewTab = this.currentReviewTab || 'extensions';
        setTimeout(() => this.loadReviewsData(), 0);
        
        return `
            <div class="view-content" style="padding: 24px;">
                <div class="data-card" style="background: white; border-radius: 12px; border: 1px solid var(--slate-200); overflow: hidden;">
                    <div class="data-card-header" style="padding: 0; background: var(--slate-50); border-bottom: 1px solid var(--slate-200);">
                        <div class="tabs" style="margin-bottom: 0;">
                            <div class="tab ${this.currentReviewTab === 'extensions' ? 'active' : ''}" data-tab="extensions" onclick="window.app.pmModule.switchReviewTab('extensions')">Timeline Extensions</div>
                            <div class="tab ${this.currentReviewTab === 'logs' ? 'active' : ''}" data-tab="logs" onclick="window.app.pmModule.switchReviewTab('logs')">Daily Site Logs</div>
                            <div class="tab ${this.currentReviewTab === 'requisitions' ? 'active' : ''}" data-tab="requisitions" onclick="window.app.pmModule.switchReviewTab('requisitions')">Material Requisitions</div>
                            <div class="tab ${this.currentReviewTab === 'history' ? 'active' : ''}" data-tab="history" onclick="window.app.pmModule.switchReviewTab('history')">Review History</div>
                        </div>
                    </div>
                    
                    <div id="reviews-table-container" style="min-height: 400px;">
                        ${this.renderLoadingState()}
                    </div>
                </div>
            </div>
        `;
    },

    switchReviewTab(tab) {
        this.currentReviewTab = tab;
        if (window.app) window.app.loadPage('reviews');
    },

    async loadReviewsData() {
        const container = document.getElementById('reviews-table-container');
        if (!container) return;

        try {
            const [extRes, logsRes, reqsRes, auditRes] = await Promise.all([
                client.get('/timeline-extensions'), // Show all, not just pending
                client.get('/daily-logs?status=submitted'),
                requisitions.getPending(),
                audit.getAll({ search: 'APPROVE', limit: 20 })
            ]);

            this.pendingExtensions = Array.isArray(extRes) ? extRes : (extRes.data || []);
            this.pendingLogs = Array.isArray(logsRes) ? logsRes : (logsRes.data || []);
            this.pendingRequisitions = Array.isArray(reqsRes) ? reqsRes : (reqsRes.data || []);
            
            // Audit response is paginated: { logs: [], total: 0, ... }
            const auditData = auditRes.data || auditRes;
            this.reviewHistory = Array.isArray(auditData.logs) ? auditData.logs : (Array.isArray(auditData) ? auditData : []);

            this.renderActiveReviewTab();
        } catch (error) {
            console.error('Failed to load review data:', error);
            container.innerHTML = this.renderEmptyState('Failed to load pending reviews. Please try again.');
        }
    },

    renderActiveReviewTab() {
        const container = document.getElementById('reviews-table-container');
        if (!container) return;

        let html = '';
        switch (this.currentReviewTab) {
            case 'extensions':
                html = this.renderExtensionsTable();
                break;
            case 'logs':
                html = this.renderPendingLogsTable();
                break;
            case 'requisitions':
                html = this.renderPendingRequisitionsTable();
                break;
            case 'history':
                html = this.renderReviewHistoryTable();
                break;
        }

        container.innerHTML = html;
    },

    renderExtensionsTable() {
        if (!this.pendingExtensions || this.pendingExtensions.length === 0) {
            return this.renderEmptyState('No timeline extension requests found.');
        }

        const rows = this.pendingExtensions.slice(0, 20).map(item => `
            <tr>
                <td style="font-weight: 700;">${item.project?.code || item.projectCode || 'PRJ-' + item.projectId}</td>
                <td>${this.escapeHTML(item.project?.name || item.projectName || 'Active Project')}</td>
                <td>${new Date(item.currentEndDate).toLocaleDateString()}</td>
                <td style="font-weight: 700; color: var(--orange);">${new Date(item.requestedEndDate).toLocaleDateString()}</td>
                <td><span class="status ${item.status === 'approved' ? 'active' : (item.status === 'rejected' ? 'delayed' : 'locked')}">${item.status.toUpperCase()}</span></td>
                <td>
                    ${item.status === 'pending' ? `
                        <button class="btn btn-primary btn-sm" onclick="window.drawer.open('Review Extension', window.DrawerTemplates.timelineExtensionReview(${JSON.stringify(item).replace(/"/g, '&quot;')}))">Review</button>
                    ` : `
                        <button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Extension Details', window.DrawerTemplates.timelineExtensionReview(${JSON.stringify(item).replace(/"/g, '&quot;')}))">Details</button>
                    `}
                </td>
            </tr>
        `).join('');

        return `
            <table class="data-table">
                <thead>
                    <tr><th>Project Code</th><th>Name</th><th>Current End</th><th>Requested End</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            ${this.pendingExtensions.length > 20 ? `<div style="text-align: center; padding: 12px; font-size: 11px; color: var(--slate-500); border-top: 1px solid var(--slate-200);">Showing 20 of ${this.pendingExtensions.length} recent requests.</div>` : ''}
        `;
    },

    renderPendingLogsTable() {
        if (!this.pendingLogs || this.pendingLogs.length === 0) {
            return this.renderEmptyState('No daily site logs awaiting review.');
        }

        const rows = this.pendingLogs.slice(0, 20).map(item => `
            <tr>
                <td style="font-weight: 700;">${new Date(item.logDate || item.createdAt).toLocaleDateString()}</td>
                <td>${this.escapeHTML(item.project?.name || item.projectName || 'Site Project')}</td>
                <td>${item.submitter?.name || 'FS'}</td>
                <td>${item.workProgress || 0}%</td>
                <td><span class="status pending">SUBMITTED</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.app.pmModule.openDailyLogReviewDrawer('${item.id}', '${item.projectId}')">Review Progress</button>
                </td>
            </tr>
        `).join('');

        return `
            <table class="data-table">
                <thead>
                    <tr><th>Date</th><th>Project</th><th>Supervisor</th><th>Work %</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            ${this.pendingLogs.length > 20 ? `<div style="text-align: center; padding: 12px; font-size: 11px; color: var(--slate-500); border-top: 1px solid var(--slate-200);">Showing 20 of ${this.pendingLogs.length} recent logs.</div>` : ''}
        `;
    },

    renderPendingRequisitionsTable() {
        if (!this.pendingRequisitions || this.pendingRequisitions.length === 0) {
            return this.renderEmptyState('No pending material requisitions.');
        }

        const rows = this.pendingRequisitions.slice(0, 20).map(item => `
            <tr>
                <td style="font-weight: 700;">REQ-${item.id}</td>
                <td>${this.escapeHTML(item.projectName || 'Site Project')}</td>
                <td>${item.submitter?.name || 'Admin'}</td>
                <td>${item.items?.length || 0} items</td>
                <td>MWK ${Number(item.totalEstimatedCost || 0).toLocaleString()}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="window.drawer.open('Requisition Review', window.DrawerTemplates.requisitionReview(${JSON.stringify(item).replace(/"/g, '&quot;')}))">Review</button>
                </td>
            </tr>
        `).join('');

        return `
            <table class="data-table">
                <thead>
                    <tr><th>ID</th><th>Project</th><th>Requester</th><th>Items</th><th>Est. Cost</th><th>Actions</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            ${this.pendingRequisitions.length > 20 ? `<div style="text-align: center; padding: 12px; font-size: 11px; color: var(--slate-500); border-top: 1px solid var(--slate-200);">Showing 20 of ${this.pendingRequisitions.length} recent requisitions.</div>` : ''}
        `;
    },

    renderReviewHistoryTable() {
        const history = Array.isArray(this.reviewHistory) ? this.reviewHistory : [];
        if (history.length === 0) {
            return this.renderEmptyState('No recent approval history found.');
        }

        const rows = history.slice(0, 20).map(item => `
            <tr>
                <td>${new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td>
                    <div style="font-weight: 700; font-size: 13px; color: var(--slate-900);">${item.action.replace(/_/g, ' ')}</div>
                    <div style="font-size: 11px; color: var(--slate-500);">${item.userName || 'System'} (${item.userRole?.replace(/_/g, ' ') || 'User'})</div>
                </td>
                <td>
                    <div style="font-weight: 700; color: var(--slate-700);">${item.targetType || '-'}</div>
                    <div style="font-size: 11px; font-family: 'JetBrains Mono';">${item.targetCode || item.targetId || ''}</div>
                </td>
                <td style="max-width: 300px; white-space: normal; font-size: 12px; color: var(--slate-600);">
                    ${this.escapeHTML(typeof item.details === 'string' ? item.details : (item.details?.pmComment || item.details?.reason || item.details?.pmApprovalNotes || 'Action processed successfully'))}
                </td>
                <td><span class="status active" style="font-size: 10px; padding: 2px 8px;">COMPLETED</span></td>
            </tr>
        `).join('');

        return `
            <table class="data-table">
                <thead>
                    <tr><th>Timestamp</th><th>Action</th><th>Type</th><th>Notes/Comments</th><th>Status</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            ${history.length > 20 ? `<div style="text-align: center; padding: 12px; font-size: 11px; color: var(--slate-500); border-top: 1px solid var(--slate-200);">Showing 20 of ${history.length} recent historical items.</div>` : ''}
        `;
    },

    async switchReviewLog(logId) {
        window.toast.show('Switching date...', 'info');
        try {
            const res = await client.get(`/daily-logs/${logId}`);
            const log = res.data || res;
            
            const historyRes = await client.get(`/daily-logs?projectId=${log.projectId}&limit=10`);
            const history = Array.isArray(historyRes) ? historyRes : (historyRes.data || []);
            history.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

            const drawerContent = document.querySelector('.drawer-content');
            if (drawerContent) {
                drawerContent.innerHTML = window.DrawerTemplates.dailyLogReview(log, history);
            }
        } catch (error) {
            window.toast.show('Failed to switch log view', 'error');
        }
    }
};
