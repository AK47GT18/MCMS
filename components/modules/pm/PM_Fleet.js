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

export const PM_Fleet = {
    getFleetView() {
        setTimeout(() => this.loadAssetsFromAPI(), 0);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Fleet & Heavy Equipment Registry</div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Vehicle Requests', 'Reviewing pending requests...')"><i class="fas fa-list-check"></i> Requests</button>
                        <button class="btn btn-action btn-sm" onclick="window.drawer.open('Add Equipment', window.DrawerTemplates.addNewVehicle)"><i class="fas fa-plus"></i> Register Asset</button>
                    </div>
                </div>
                <div id="assets-table-container">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    },

    async loadAssetsFromAPI() {
        const container = document.getElementById('assets-table-container');
        if (!container) return;

        try {
            const response = await assets.getAll({ limit: 100 });
            const data = response.data || response;
            const assetList = Array.isArray(data) ? data : data.assets || [];

            if (assetList.length === 0) {
                container.innerHTML = this.renderEmptyState('No heavy equipment or vehicles registered.');
                return;
            }

            container.innerHTML = this.renderAssetsTable(assetList);
        } catch (error) {
            console.error('Failed to load assets:', error);
            container.innerHTML = this.renderEmptyState('Failed to load asset registry.');
        }
    },

    renderAssetsTable(assetList) {
        const rows = assetList.map(asset => `
            <tr>
                <td class="project-id">${this.escapeHTML(asset.plateNumber || 'TOW-' + asset.id)}</td>
                <td style="font-weight:600;">${this.escapeHTML(asset.name)}</td>
                <td><span class="status active" style="background:var(--slate-100); color:var(--slate-600);">${this.escapeHTML((asset.type || 'Plant').replace(/_/g, ' '))}</span></td>
                <td>${this.escapeHTML(asset.location || 'Central Depot')}</td>
                <td><span class="status ${asset.status === 'active' ? 'active' : 'delayed'}">${this.escapeHTML(asset.status?.toUpperCase() || 'ACTIVE')}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Complete Maintenance', window.DrawerTemplates.completeMaintenance('${asset.id}'))">Maint.</button>
                </td>
            </tr>
        `).join('');

        return `
            <table>
                <thead>
                    <tr><th>Asset ID</th><th>Description</th><th>Category</th><th>Current Assignment</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
};
