import client from '../../../src/api/client.js';
import { StatCard } from '../ui/StatCard.js';

export const FD_Handlers = {
    async handleRequisitionAction(reqId, status) {
        const note = document.getElementById('requisition_note')?.value;
        if (!note || note.trim().length < 5) {
            window.toast.show('Please provide a descriptive note (min 5 chars).', 'warning');
            return;
        }

        try {
            window.toast.show(`Processing resource ${status}...`, 'info');
            
            // Trigger simulated email notification
            await notificationService.notifyRequisitionStatus(reqId, status, note);
            
            window.toast.show(`Requisition ${reqId} has been ${status} successfully.`, 'success');
            window.drawer.close();
            this.switchView(this.currentView);
        } catch (error) {
            console.error('Workflow error:', error);
            window.toast.show('Failed to process requisition action.', 'error');
        }
    }
};
