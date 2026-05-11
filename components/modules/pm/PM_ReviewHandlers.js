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
            window.toast.show('Daily log approved successfully', 'success');
            
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
            window.toast.show('Daily log rejected', 'info');
            
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
            window.toast.show('Requisition approved', 'success');
            
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
            window.toast.show('Requisition rejected', 'info');
            
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
            window.toast.show('Extension approved successfully', 'success');
            
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
            window.toast.show('Extension rejected', 'info');
            
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
    },

    // =========================================
    // BUDGET UPLIFT APPROVE / REJECT
    // =========================================

    async approveBudgetUplift(bcrId) {
        if (!confirm('Are you sure you want to approve this budget uplift? This will permanently increase the project budget.')) return;

        try {
            window.toast.show('Processing budget uplift approval...', 'info');
            await client.post(`/budget-changes/${bcrId}/approve`);
            window.toast.show('Budget uplift approved. Project budget has been increased.', 'success');
            window.drawer?.close();
            this.loadReviewsData();
        } catch (error) {
            console.error('Budget uplift approval failed:', error);
            window.toast.show(error.message || 'Failed to approve budget uplift', 'error');
        }
    },

    openRejectBudgetUpliftDrawer(bcrId, bcrCode, projectName, amount) {
        window.drawer.open('Reject Budget Uplift', `
            <div style="padding: 24px;">
                <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 18px; color: var(--red);"></i>
                        <div>
                            <div style="font-weight: 800; font-size: 14px; color: #991B1B;">Rejecting Budget Uplift</div>
                            <div style="font-size: 12px; color: #B91C1C;">This action cannot be undone. The project will continue with its current budget.</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                        <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #FECACA;">
                            <div style="font-size: 10px; font-weight: 700; color: #991B1B; text-transform: uppercase;">Request</div>
                            <div style="font-weight: 800; color: var(--slate-900);">${bcrCode}</div>
                        </div>
                        <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #FECACA;">
                            <div style="font-size: 10px; font-weight: 700; color: #991B1B; text-transform: uppercase;">Amount</div>
                            <div style="font-weight: 800; color: var(--red);">MWK ${Number(amount).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label" style="font-weight: 700;">Rejection Reason <span style="color: var(--red);">*</span></label>
                    <textarea id="uplift_reject_reason" class="form-input" placeholder="Explain why this uplift is being rejected... (min 10 characters)" 
                        style="width: 100%; height: 100px; resize: none; font-size: 13px;"
                        oninput="
                            const btn = document.getElementById('uplift_reject_btn');
                            const isValid = this.value.trim().length >= 10;
                            btn.disabled = !isValid;
                            btn.style.opacity = isValid ? '1' : '0.5';
                            this.style.borderColor = isValid ? 'var(--emerald)' : 'var(--red)';
                        "></textarea>
                    <div style="font-size: 10px; color: var(--slate-500); margin-top: 4px;">The requester and all stakeholders will be notified of this decision.</div>
                </div>

                <button id="uplift_reject_btn" class="btn btn-primary" disabled style="width: 100%; padding: 14px; font-weight: 800; background: var(--red); border-color: var(--red); opacity: 0.5;" 
                    onclick="window.app.pmModule.submitRejectBudgetUplift(${bcrId})">
                    <i class="fas fa-times-circle" style="margin-right: 8px;"></i> Confirm Rejection
                </button>
            </div>
        `);
    },

    async submitRejectBudgetUplift(bcrId) {
        const reason = document.getElementById('uplift_reject_reason')?.value?.trim();
        if (!reason || reason.length < 10) {
            window.toast.show('Please provide a detailed rejection reason (min 10 characters).', 'warning');
            return;
        }

        try {
            window.toast.show('Processing rejection...', 'info');
            await client.post(`/budget-changes/${bcrId}/reject`, { reason });
            window.toast.show('Budget uplift rejected. Project will work with current allocation.', 'info');
            window.drawer?.close();
            this.loadReviewsData();
        } catch (error) {
            console.error('Budget uplift rejection failed:', error);
            window.toast.show(error.message || 'Failed to reject budget uplift', 'error');
        }
    }
};
