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
                <button class="btn btn-primary" onclick="window.app.fsModule.openResourceRequestDrawer()"><i class="fas fa-plus"></i> Request</button>
              </div>
              ${!this.assetsLoaded
                ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Syncing site fleet status…</div></div>'
                : (this.siteAssets.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-truck-loading" style="font-size:24px; margin-bottom:12px; display:block;"></i>No equipment assigned to this workstation.</div>'
                    : `<table>
                    <thead><tr><th>Asset</th><th>ID</th><th>Category</th><th>Last Maint.</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${this.siteAssets.map(asset => {
                            const lastMaint = asset.lastMaintenanceAt ? new Date(asset.lastMaintenanceAt) : null;
                            let maintStr = '--';
                            if (lastMaint) {
                                const diffDays = Math.floor((new Date() - lastMaint) / (1000 * 60 * 60 * 24));
                                maintStr = diffDays > 30 ? `<span style="color:var(--red); font-weight:700;">${diffDays} days ago</span>` : `${diffDays} days ago`;
                            }
                            return `
                            <tr>
                                <td style="font-weight: 700;">${asset.name}</td>
                                <td><span class="project-id">${asset.assetCode || asset.id}</span></td>
                                <td>${asset.category || '--'}</td>
                                <td>${maintStr}</td>
                                <td><span class="status ${asset.status === 'checked_out' ? 'active' : 'pending'}">${(asset.status || '').replace(/_/g, ' ')}</span></td>
                                <td>
                                    <div style="display:flex; gap:4px;">
                                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="window.app.fsModule?.handleReportBreakdown('${asset.id}', '${asset.name.replace(/'/g, "\\'")}')"><i class="fas fa-exclamation-triangle" style="color:var(--orange);"></i> Issue</button>
                                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="window.app.fsModule?.handleReturnEquipment('${asset.id}', '${asset.name.replace(/'/g, "\\'")}')"><i class="fas fa-undo"></i> Return</button>
                                    </div>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>`
                )
            }
            </div>
        `;
    }
,

    async _loadSiteAssets() {
        try {
            const result = await assets.getAll({ status: 'checked_out', projectId: this.assignedProject?.id });
            const data = result.data || result;
            this.siteAssets = Array.isArray(data) ? data : (data.items || []);
            this.assetsLoaded = true;
            this._refreshCurrentView();
        } catch (error) {
            this.assetsLoaded = true;
            console.error('[FS] Failed to load site assets:', error);
        }
    }
,

    async handleReportBreakdown(assetId, assetName) {
        const issueType = prompt(`What is the issue with ${assetName}? (e.g., Broken, Stolen, Needs Maintenance)`);
        if (!issueType) return;
        
        if (!confirm(`Are you sure you want to flag ${assetName} as '${issueType}'? This will alert the Equipment Coordinator.`)) {
            return;
        }

        try {
            await window.loader.show('Reporting issue...', async () => {
                await assets.flagIssue(assetId, `Field Supervisor reported: ${issueType}`);
            });
            window.modal.showSuccess('Issue Reported', `${assetName} has been flagged.`);
            await this._loadSiteAssets();
        } catch (error) {
            console.error('[FS] Failed to report issue:', error);
            window.modal.showError('Report Failed', error.message || 'Failed to report issue');
        }
    }
,

    async handleReturnEquipment(assetId, assetName) {
        if (!confirm(`Are you sure you want to return ${assetName} to the base/inventory?`)) {
            return;
        }

        try {
            await window.loader.show('Returning equipment...', async () => {
                await assets.checkIn(assetId, { notes: 'Returned from site by Field Supervisor' });
            });
            window.modal.showSuccess('Equipment Returned', `${assetName} has been sent back.`);
            await this._loadSiteAssets();
        } catch (error) {
            console.error('[FS] Failed to return equipment:', error);
            window.modal.showError('Return Failed', error.message || 'Failed to return equipment');
        }
    }
};
