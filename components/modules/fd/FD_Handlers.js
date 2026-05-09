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
            window.toast.show(error.message || 'Failed to process requisition action.', 'error');
        }
    },

    openRequisitionReview(reqId) {
        const req = this.data.requisitions.find(r => String(r.id) === String(reqId));
        if (req) {
            window.drawer.open(req.isReplenishment ? 'Stock Replenishment Review' : 'Requisition Review', window.DrawerTemplates.requisitionReview(req));
        } else {
            window.toast.show('Request details not found.', 'error');
        }
    },

    async handleBulkApprove() {
        const filtered = this.data.filteredRequisitions || [];
        if (filtered.length === 0) {
            window.toast.show('No requisitions to approve.', 'warning');
            return;
        }

        // Filter out over-budget items (they require manual review)
        const toApprove = filtered.filter(req => {
            const totalAmt = Number(req.totalAmount || 0);
            const projBudget = Number(req.project?.budgetTotal || 0);
            const projSpent = Number(req.project?.budgetSpent || 0);
            const remaining = projBudget - projSpent;
            return totalAmt <= remaining || projBudget === 0;
        });

        if (toApprove.length === 0) {
            window.toast.show('All filtered items are over-budget. Please review individually.', 'warning');
            return;
        }

        window.modal.confirm(
            "Bulk Approval Confirmation",
            `Are you sure you want to bulk approve <strong>${toApprove.length}</strong> requisitions? Items that are significantly over-budget will be skipped for manual review.`,
            async () => {
                window.toast.show(`Bulk approving ${toApprove.length} items...`, 'info');

                try {
                    const promises = toApprove.map(async (req) => {
                        if (req.isReplenishment) {
                            return client.post(`/replenishment/${req.id}/finance-action`, { 
                                action: 'approve', 
                                financeComments: 'Bulk approved by Finance Director',
                                estimatedCost: req.totalAmount 
                            });
                        } else {
                            return client.post(`/requisitions/${req.id}/approve`);
                        }
                    });

                    await Promise.all(promises);
                    
                    window.toast.show(`Successfully approved ${toApprove.length} requisitions.`, 'success');
                    
                    // Log to Audit
                    client.post('/audit-logs', {
                        action: 'BULK_APPROVE_REQUISITIONS',
                        targetType: 'REQUISITION',
                        details: { count: toApprove.length, actor: window.currentUser?.name }
                    }).catch(e => console.warn('Audit failed', e));

                    this.loadPendingRequisitions();
                } catch (error) {
                    console.error('Bulk approval error:', error);
                    window.toast.show('Some items failed to approve. Please refresh.', 'error');
                }
            }
        );
    },

    async handleRentalAction(rentalId, action) {
        const note = document.getElementById('rental_review_note')?.value;
        if (!note || note.trim().length < 5) {
            window.toast.show('Please provide a review note (min 5 chars).', 'warning');
            return;
        }

        try {
            window.toast.show(`Processing rental ${action}...`, 'info');
            
            let res;
            if (action === 'approved') {
                res = await window.vehicleRentalsApi.approve(rentalId, { comments: note });
            } else if (action === 'rejected') {
                res = await window.vehicleRentalsApi.reject(rentalId, { reason: note });
            }

            if (res.error) throw new Error(res.error);

            window.toast.show(`Rental contract ${action} successfully.`, 'success');
            window.drawer.close();
            
            // Refresh view
            if (this.currentView === 'contracts' || this.currentView === 'dashboard') {
                this.loadContractsData?.();
                this._refreshCurrentView();
            }

        } catch (error) {
            console.error('Rental action failed:', error);
            window.toast.show('Action failed: ' + error.message, 'error');
        }
    },

    openRentalReview(rentalId) {
        const rental = this.data.vehicleRentals?.find(r => String(r.id) === String(rentalId));
        if (rental) {
            window.drawer.open('Vehicle Rental Review', window.DrawerTemplates.rentalReview(rental));
        } else {
            window.toast.show('Rental details not found.', 'error');
        }
    }
};
