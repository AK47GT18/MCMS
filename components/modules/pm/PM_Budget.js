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

export const PM_Budget = {
    getBudgetView() {
        setTimeout(() => this.loadTransactionsFromAPI(), 0);
        return `
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Transaction Ledger</div>
                        <button class="btn btn-action" onclick="window.drawer.open('New Transaction', window.DrawerTemplates.transactionEntry)"><i class="fas fa-plus"></i> New Entry</button>
                    </div>
                    <div id="transactions-table-container">
                        ${this.renderLoadingState()}
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div class="stat-card" style="background:var(--slate-800); color:white; border:none;">
                        <div class="stat-label" style="color:var(--slate-400);">Total Spend (Active)</div>
                        <div class="stat-value" id="budget-total-spend" style="color:white; font-size:28px;">MWK 0.0M</div>
                        <div class="stat-sub" style="color:var(--emerald);">Project Variance Tracking</div>
                    </div>

                    <div class="fraud-alert-card" style="background:#FEF2F2; border:1px solid #FECACA; padding:16px; border-radius:8px;">
                         <div style="display:flex; gap:10px; margin-bottom:8px;">
                            <i class="fas fa-exclamation-triangle" style="color:var(--red);"></i>
                            <div style="font-weight:700; color:var(--red-dark); font-size:13px;">Budget Alert</div>
                         </div>
                         <div id="budget-alerts-container" style="font-size:12px; color:var(--red-dark); line-height:1.4;">
                            Monitoring material utilization across all sectors.
                         </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadTransactionsFromAPI() {
        const container = document.getElementById('transactions-table-container');
        if (!container) return;

        try {
            const response = await procurement.getAll({ limit: 50 });
            const data = response.data || response;
            const transactions = Array.isArray(data) ? data : data.procurements || [];

            if (transactions.length === 0) {
                container.innerHTML = this.renderEmptyState('No transactions found for this period.');
                return;
            }

            container.innerHTML = this.renderTransactionsTable(transactions);
            this.updateBudgetSummary(transactions);
        } catch (error) {
            console.error('Failed to load transactions:', error);
            container.innerHTML = this.renderEmptyState('Failed to load financial records.');
        }
    },

    renderTransactionsTable(transactions) {
        const rows = transactions.map(trx => `
            <tr>
                <td class="project-id">PROC-${this.escapeHTML(trx.id)}</td>
                <td>${this.escapeHTML(trx.category || 'Materials')}</td>
                <td>${this.escapeHTML(trx.contractorName || trx.contractor?.name || 'Various Contractors')}</td>
                <td style="font-family:'JetBrains Mono'">MWK ${(trx.amount || 0).toLocaleString()}</td>
                <td><span class="status ${trx.status === 'approved' ? 'active' : 'pending'}">${this.escapeHTML(trx.status?.toUpperCase() || 'PENDING')}</span></td>
            </tr>
        `).join('');

        return `
            <table>
                <thead>
                    <tr><th>Ref</th><th>Category</th><th>Contractor</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
};
