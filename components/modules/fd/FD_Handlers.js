import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';

export const FD_Handlers = {
    async handleRequisitionAction(reqId, status) {
        const note = document.getElementById('requisition_note')?.value;
        if (!note || note.trim().length < 5) {
            window.toast.show('Please provide a descriptive note (min 5 chars).', 'warning');
            return;
        }

        const req = this.data.requisitions.find(r => String(r.id) === String(reqId));
        const isReplenishment = req?.isReplenishment;

        try {
            window.toast.show(`Processing ${isReplenishment ? 'replenishment' : 'requisition'} ${status}...`, 'info');
            
            if (isReplenishment) {
                // Replenishment Actions
                let action;
                if (status === 'approved') action = 'approve';
                else if (status === 'rejected') action = 'reject';
                else if (status === 'flagged' || status === 'escalated') action = 'escalate';

                await client.post(`/replenishment/${reqId}/finance-action`, { 
                    action, 
                    financeComments: note,
                    estimatedCost: req.totalAmount 
                });
            } else {
                // Standard Requisition Actions
                if (status === 'approved') {
                    await client.post(`/requisitions/${reqId}/approve`);
                } else if (status === 'rejected') {
                    await client.post(`/requisitions/${reqId}/reject`, { reason: note });
                } else if (status === 'flagged') {
                    await client.post(`/requisitions/${reqId}/flag-fraud`);
                }
            }
            
            window.toast.show(`${isReplenishment ? 'Stock replenishment' : 'Requisition'} ${reqId} has been ${status} successfully.`, 'success');
            
            if (status === 'approved') {
                window.toast.show('Opening contract registry for procurement...', 'info');
                // Redirect to New Contract flow
                window.drawer.open('Create Vendor Contract', window.DrawerTemplates.newContract);
                setTimeout(async () => {
                    await this.loadContractProjects?.();
                    this.initContractUpload?.();
                    
                    // Pre-fill data if available
                    const projectSelect = document.getElementById('contract_project');
                    if (projectSelect && req.projectId) {
                        projectSelect.value = req.projectId;
                        await this.onContractProjectSelected?.(req.projectId);
                    }
                    
                    const titleInput = document.getElementById('contract_title');
                    if (titleInput) titleInput.value = `Procurement for ${req.reqCode || 'REQ-' + req.id}`;
                    
                    const valueInput = document.getElementById('contract_value');
                    if (valueInput) valueInput.value = req.totalAmount || 0;
                }, 200);
            } else {
                window.drawer.close();
                this.switchView(this.currentView);
            }
        } catch (error) {
            console.error('Workflow error:', error);
            window.toast.show('Failed to process requisition action.', 'error');
        }
    },

    openRequisitionReview(reqId) {
        const req = this.data.requisitions.find(r => String(r.id) === String(reqId));
        if (req) {
            window.drawer.open(req.isReplenishment ? 'Stock Replenishment Review' : 'Requisition Review', window.DrawerTemplates.requisitionReview(req));
        } else {
            window.toast.show('Request details not found.', 'error');
        }
    }
};
