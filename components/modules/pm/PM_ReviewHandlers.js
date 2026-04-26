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
            window.toast.show('Log approved and Schedule updated', 'success');
            window.drawer.close();
            this.updateHeaderStats();
            this.render(); 
        } catch (error) {
            console.error('Log approval failed:', error);
            window.toast.show(error.message || 'Failed to approve log', 'error');
        }
    },

    async handleRejectLog(id, reason) {
        try {
            if (!reason) {
                window.toast.show('Reason for rejection is required', 'error');
                return;
            }
            window.toast.show('Processing rejection...', 'info');
            await dailyLogs.update(id, { status: 'rejected', rejectionReason: reason });
            window.toast.show('Log rejected successfully', 'warning');
            window.drawer.close();
            this.render();
        } catch (error) {
            console.error('Log rejection failed:', error);
            window.toast.show(error.message || 'Failed to reject log', 'error');
        }
    },

    async handleApproveRequisition(id) {
        try {
            window.toast.show('Approving requisition...', 'info');
            await requisitions.approve(id);
            window.toast.show(`Requisition ${id} approved`, 'success');
            window.drawer.close();
            this.render();
        } catch (error) {
            console.error('Requisition approval failed:', error);
            window.toast.show(error.message || 'Failed to approve requisition', 'error');
        }
    },

    async handleRejectRequisition(id, reason) {
        try {
            if (!reason) {
                window.toast.show('Please provide a reason for rejection', 'error');
                return;
            }
            window.toast.show('Rejecting requisition...', 'info');
            await requisitions.reject(id, reason);
            window.toast.show(`Requisition ${id} rejected`, 'warning');
            window.drawer.close();
            this.render();
        } catch (error) {
            console.error('Requisition rejection failed:', error);
            window.toast.show(error.message || 'Failed to reject requisition', 'error');
        }
    }
};
