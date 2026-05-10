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

export const PM_ReviewHandlers = {
    async handleApproveLog(id) {
        try {
            window.toast.show('Processing approval...', 'info');
            await dailyLogs.approve(id);
            window.app.showToast('Daily log approved successfully', 'success');
            
            // Re-render drawer with status
            const drawerContent = document.querySelector('.drawer-content');
            if (drawerContent) {
                drawerContent.innerHTML = window.DrawerTemplates.dailyLogReview({ id, status: 'approved', workProgress: 'Processed' });
            }
            
            this.loadReviewsData();
        } catch (error) {
            console.error('Log approval failed:', error);
            window.toast.show(error.message || 'Failed to approve log', 'error');
        }
    },

    async handleRejectLog(id, reason) {
        try {
            if (!reason) {
                window.toast.show('Reason for rejection is required', 'error');
                return;
            }
            window.toast.show('Processing rejection...', 'info');
            await dailyLogs.reject(id, reason);
            window.app.showToast('Daily log rejected', 'info');
            
            // Re-render drawer with status
            const drawerContent = document.querySelector('.drawer-content');
            if (drawerContent) {
                drawerContent.innerHTML = window.DrawerTemplates.dailyLogReview({ id, status: 'rejected', rejectionReason: reason });
            }
            
            this.loadReviewsData();
        } catch (error) {
            console.error('Log rejection failed:', error);
            window.toast.show(error.message || 'Failed to reject log', 'error');
        }
    },

    async handleApproveRequisition(id) {
        try {
            window.toast.show('Approving requisition...', 'info');
            await requisitions.approve(id);
            window.app.showToast('Requisition approved', 'success');
            
            // Re-render drawer with status
            const drawerContent = document.querySelector('.drawer-content');
            if (drawerContent) {
                drawerContent.innerHTML = window.DrawerTemplates.requisitionReview({ id, status: 'approved' });
            }
            
            this.loadReviewsData();
        } catch (error) {
            console.error('Requisition approval failed:', error);
            window.toast.show(error.message || 'Failed to approve requisition', 'error');
        }
    },

    async handleRejectRequisition(id, reason) {
        try {
            if (!reason) {
                window.toast.show('Please provide a reason for rejection', 'error');
                return;
            }
            window.toast.show('Rejecting requisition...', 'info');
            await requisitions.reject(id, reason);
            window.app.showToast('Requisition rejected', 'info');
            
            // Re-render drawer with status
            const drawerContent = document.querySelector('.drawer-content');
            if (drawerContent) {
                drawerContent.innerHTML = window.DrawerTemplates.requisitionReview({ id, status: 'rejected', rejectionReason: reason });
            }
            
            this.loadReviewsData();
        } catch (error) {
            console.error('Requisition rejection failed:', error);
            window.toast.show(error.message || 'Failed to reject requisition', 'error');
        }
    },

    // =========================================
    // TIMELINE EXTENSION APPROVE / REJECT
    // =========================================

    async handleApproveExtension(id, comment) {
        try {
            window.toast.show('Approving extension request...', 'info');
            const timelineApi = (await import('../../../src/api/timelineExtensions.api.js')).default;
            await timelineApi.approve(id, { pmComment: comment || '' });
            window.app.showToast('Extension approved successfully', 'success');
            
            // Re-render drawer with updated status
            const drawerContent = document.querySelector('.drawer-content');
            if (drawerContent) {
                // Find item in local cache or just build a mock for the template
                const item = (this.pendingExtensions || []).find(i => i.id === id) || { id };
                const updatedItem = { ...item, status: 'approved', pmComment: comment || '' };
                drawerContent.innerHTML = window.DrawerTemplates.timelineExtensionReview(updatedItem);
            }
            
            // Refresh underlying data
            this.loadReviewsData();
            if (typeof this.loadProjectsFromAPI === 'function') this.loadProjectsFromAPI();
            if (typeof this.renderGanttChart === 'function') this.renderGanttChart();
        } catch (error) {
            console.error('Extension approval failed:', error);
            window.toast.show(error.message || 'Failed to approve extension', 'error');
        }
    },

    async handleRejectExtension(id, comment) {
        try {
            if (!comment || comment.trim().length < 5) {
                window.toast.show('Please provide a reason for rejection (min 5 characters)', 'error');
                document.getElementById('extension-review-comment')?.focus();
                return;
            }
            window.toast.show('Rejecting extension request...', 'info');
            const timelineApi = (await import('../../../src/api/timelineExtensions.api.js')).default;
            await timelineApi.reject(id, { pmComment: comment.trim() });
            window.app.showToast('Extension rejected', 'info');
            
            // Re-render drawer with updated status
            const drawerContent = document.querySelector('.drawer-content');
            if (drawerContent) {
                const item = (this.pendingExtensions || []).find(i => i.id === id) || { id };
                const updatedItem = { ...item, status: 'rejected', pmComment: comment.trim() };
                drawerContent.innerHTML = window.DrawerTemplates.timelineExtensionReview(updatedItem);
            }
            
            this.loadReviewsData();
        } catch (error) {
            console.error('Extension rejection failed:', error);
            window.toast.show(error.message || 'Failed to reject extension', 'error');
        }
    },

    // =========================================
    // DAILY LOG REVIEW DRAWER
    // =========================================

    async openDailyLogReviewDrawer(logId, projectId) {
        try {
            window.toast.show('Loading log details...', 'info');
            const logRes = await client.get(`/daily-logs/${logId}`);
            const log = logRes.data || logRes;

            // Fetch recent history for sidebar context
            const historyRes = await client.get(`/daily-logs?projectId=${projectId}&limit=10`);
            const history = Array.isArray(historyRes) ? historyRes : (historyRes.data || []);
            history.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

            window.drawer.open('Review Daily Log', window.DrawerTemplates.dailyLogReview(log, history));
        } catch (error) {
            console.error('Failed to open log review:', error);
            window.toast.show('Failed to load log details', 'error');
        }
    }
};
