import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';

export const FD_Handlers = {
    async handleRequisitionAction(reqId, status) {
        const note = document.getElementById('requisition_note')?.value;
        if (!note || note.trim().length < 5) {
            window.toast.show('Please provide a descriptive note (min 5 chars).', 'warning');
            return;
        }

        try {
            window.toast.show(`Processing resource ${status}...`, 'info');
            
            if (status === 'approved') {
                await client.post(`/requisitions/${reqId}/approve`);
            } else if (status === 'rejected') {
                await client.post(`/requisitions/${reqId}/reject`, { reason: note });
            } else if (status === 'flagged') {
                await client.post(`/requisitions/${reqId}/flag-fraud`);
            }
            
            window.toast.show(`Requisition ${reqId} has been ${status} successfully.`, 'success');
            window.drawer.close();
            this.switchView(this.currentView);
        } catch (error) {
            console.error('Workflow error:', error);
            window.toast.show('Failed to process requisition action.', 'error');
        }
    },

    openRequisitionReview(reqId) {
        const req = this.data.requisitions.find(r => String(r.id) === String(reqId));
        if (req) {
            window.drawer.open('Requisition Review', window.DrawerTemplates.requisitionReview(req));
        } else {
            window.toast.show('Requisition details not found.', 'error');
        }
    }
};
