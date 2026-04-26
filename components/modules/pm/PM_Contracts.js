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

export const PM_Contracts = {
    getContractsView() {
        setTimeout(() => this.loadContractsFromAPI(), 0);
        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Contract Registry & Legal Repository</div>
                <button class="btn btn-primary" onclick="window.drawer.open('New Contract', window.DrawerTemplates.newContract)"><i class="fas fa-upload"></i> Upload</button>
              </div>
              <div id="contracts-table-container">
                ${this.renderLoadingState()}
              </div>
            </div>
        `;
    },

    async loadContractsFromAPI() {
        const container = document.getElementById('contracts-table-container');
        if (!container) return;

        try {
            const response = await contracts.getAll({ limit: 50 });
            const data = response.data || response;
            const contractsList = Array.isArray(data) ? data : data.contracts || [];

            if (contractsList.length === 0) {
                container.innerHTML = this.renderEmptyState('No contracts found in the repository.');
                return;
            }

            container.innerHTML = this.renderContractsTable(contractsList);
        } catch (error) {
            console.error('Failed to load contracts:', error);
            container.innerHTML = this.renderEmptyState('Failed to load contract registry.');
        }
    },

    renderContractsTable(contractsList) {
        const rows = contractsList.map(item => `
            <tr>
                <td><span class="project-id">${this.escapeHTML(item.code || 'CNT-' + item.id)}</span></td>
                <td style="font-weight:600;">${this.escapeHTML(item.title)}</td>
                <td><span class="status active" style="background:var(--slate-100); color:var(--slate-600);">${this.escapeHTML((item.type || 'Service').replace(/_/g, ' '))}</span></td>
                <td>v${this.escapeHTML(item.version || '1.0')}</td>
                <td>${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Contract Viewer', window.DrawerTemplates.contractViewer(${JSON.stringify(item).replace(/"/g, '&quot;')}))"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `).join('');

        return `
            <table>
                <thead>
                    <tr><th>Contract ID</th><th>Title</th><th>Type</th><th>Version</th><th>Expiry Date</th><th>Action</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
};
