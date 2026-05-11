import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';

export const FD_Budget = {
    getBudgetControlView() {
        setTimeout(() => this.loadBudgetChanges(), 0);
        return `
            <div class="data-card">
               <div class="data-card-header">
                  <div class="card-title">PM Budget Uplift Requests</div>
                  <button class="btn btn-action" onclick="window.drawer.open('Initiate Budget Uplift', window.DrawerTemplates.initiateBCR(window.app.fmModule.data.projects))"><i class="fas fa-plus"></i> New Request</button>
               </div>
               <div id="fm-bcr-table">
                   <div style="padding: 24px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin"></i> Loading uplift requests...</div>
               </div>
            </div>
        `;
    },

    async loadBudgetChanges() {
        const container = document.getElementById('fm-bcr-table');
        if (!container) return;

        try {
            const token = localStorage.getItem('mcms_auth_token');
            const response = await fetch('/api/v1/budget-changes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load budget changes');
            const result = await response.json();
            let bcrList = Array.isArray(result.data) ? result.data : (result.items || result || []);

            // Apply project filter if context exists
            if (this.projectFilter) {
                bcrList = bcrList.filter(b => b.projectId == this.projectFilter || b.project?.id == this.projectFilter);
            }

            if (bcrList.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-check-circle" style="font-size: 32px; margin-bottom: 12px; color: var(--emerald);"></i><div style="font-weight: 600;">No uplift requests</div></div>`;
                return;
            }

            container.innerHTML = `
                <table>
                    <thead>
                        <tr><th>Uplift ID</th><th>Project</th><th>Reason</th><th style="text-align:right">Current</th><th style="text-align:right">Requested</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        ${bcrList.map(bcr => {
                            const statusMap = { 'Pending': 'locked', 'Approved': 'active', 'Rejected': 'delayed' };
                            return `
                                <tr>
                                    <td><span class="project-id">BCR-${bcr.id}</span></td>
                                    <td>${bcr.project?.name || 'Project #' + bcr.projectId}</td>
                                    <td>${bcr.reason || 'No reason provided'}</td>
                                    <td style="text-align:right; font-family: 'JetBrains Mono';">${this.formatCurrency(Number(bcr.project?.budgetTotal || 0))}</td>
                                    <td style="text-align:right; font-family: 'JetBrains Mono';">+${this.formatCurrency(Number(bcr.amount || 0))}</td>
                                    <td><span class="status ${statusMap[bcr.status] || 'locked'}">${bcr.status || 'Pending'}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Failed to load budget changes:', error);
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">${error.message}</div>`;
        }
    },

    async handleSubmitUplift() {
        const project = document.getElementById('bcr_project')?.value;
        const amount = document.getElementById('bcr_amount')?.value;
        const reason = document.getElementById('bcr_reason')?.value;

        if (!amount || parseFloat(amount) <= 0) {
            window.toast.show('Please enter a valid amount.', 'warning');
            return;
        }
        if (!reason || reason.trim().length < 10) {
            window.toast.show('Please provide a detailed justification (min 10 chars).', 'warning');
            return;
        }

        try {
            window.toast.show('Submitting uplift request to PM...', 'info');
            
            await client.post('/budget-changes', {
                projectId: parseInt(project),
                amount: parseFloat(amount),
                justification: reason
            });
            
            window.toast.show('Uplift request sent to Project Manager successfully.', 'success');
            window.drawer.close();
            if (this.currentView === 'budget-control') {
                this.loadBudgetChanges();
            }
        } catch (error) {
            console.error('Uplift error:', error);
            window.toast.show('Failed to submit uplift request.', 'error');
        }
    },

    requestPMUplift(projectId) {
        window.toast?.show(`Opening uplift request for ${projectId}...`, 'info');
        window.drawer.open(`Request Budget Uplift: ${projectId}`, window.DrawerTemplates.initiateBCR(this.data.projects, projectId));
    }
};
