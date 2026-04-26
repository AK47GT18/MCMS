import client from '../../../src/api/client.js';
import tasksApi from '../../../src/api/tasks.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import assets from '../../../src/api/assets.api.js';

export const FS_Equipment = {
    getEquipmentView() {
        setTimeout(() => this._loadSiteAssets(), 0);

        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">On-Site Equipment</div>
                <button class="btn btn-primary" onclick="window.drawer.open('Request Equipment', window.DrawerTemplates.requestResourceFS)"><i class="fas fa-plus"></i> Request</button>
              </div>
              ${!this.assetsLoaded
                ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Syncing site fleet status…</div></div>'
                : (this.siteAssets.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-truck-loading" style="font-size:24px; margin-bottom:12px; display:block;"></i>No equipment assigned to this workstation.</div>'
                    : `<table>
                    <thead><tr><th>Asset</th><th>ID</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${this.siteAssets.map(asset => `
                            <tr>
                                <td style="font-weight: 700;">${asset.name}</td>
                                <td><span class="project-id">${asset.assetCode || asset.id}</span></td>
                                <td>${asset.category || '--'}</td>
                                <td><span class="status ${asset.status === 'checked_out' ? 'active' : 'pending'}">${(asset.status || '').replace(/_/g, ' ')}</span></td>
                                <td><button class="btn btn-secondary" style="padding:4px 8px; font-size:10px;">Log Usage</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`
                )
            }
            </div>
        `;
    },

    async _loadSiteAssets() {
        try {
            const result = await assets.getAll({ status: 'checked_out' });
            const data = result.data || result;
            this.siteAssets = Array.isArray(data) ? data : (data.items || []);
            this.assetsLoaded = true;
            this._refreshCurrentView();
        } catch (error) {
            this.assetsLoaded = true;
            console.error('[FS] Failed to load site assets:', error);
        }
    },

    async handleReportBreakdown(assetId, assetName) {
        if (!confirm(`Are you sure you want to flag ${assetName} as BROKEN DOWN? This will immediately halt operations for this equipment and alert the Equipment Coordinator.`)) {
            return;
        }

        try {
            await window.loader.show('Reporting breakdown to base...', async () => {
                await window.assets.flagIssue(assetId, `Field Supervisor reported breakdown on site.`);
            });
            window.modal.showSuccess('Breakdown Reported', `${assetName} has been flagged for maintenance.`);
            await this._loadSiteAssets();
        } catch (error) {
            console.error('[FS] Failed to report breakdown:', error);
            window.modal.showError('Report Failed', error.message || 'Failed to report breakdown');
        }
    }
};
