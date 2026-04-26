import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';
import assets from '../../../src/api/assets.api.js';

export const EC_Registry = {
    getRegistryView() {

        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Master Asset Registry</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Asset Procurement', window.DrawerTemplates.requestNewAsset)">
                        <i class="fas fa-plus-circle"></i> Request New Asset
                    </button>
                </div>
                ${this.isLoadingAssets && this.assetRegistry.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading asset registry…</div></div>'
                    : this.assetRegistry.length === 0
                        ? `
                        <div style="padding: 60px; text-align: center; color: var(--slate-400);">
                            <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.1;"><i class="fas fa-truck-monster"></i></div>
                            <div style="font-weight: 700; color: var(--slate-600);">No Assets Registered</div>
                            <p style="font-size: 13px; margin-top: 8px;">The master fleet registry is currently empty.</p>
                        </div>`
                        : `<table>
                        <thead>
                            <tr><th>Asset ID</th><th>Name</th><th>Category</th><th>Hours/Km</th><th>Condition</th><th>Status</th><th style="text-align: right;">Action</th></tr>
                        </thead>
                        <tbody>
                            ${this.assetRegistry.map(asset => `
                                <tr>
                                    <td><span class="project-id">${asset.assetCode || 'EQP-' + asset.id}</span></td>
                                    <td style="font-weight: 700;">${asset.name}</td>
                                    <td>${asset.category || '--'}</td>
                                    <td style="font-family: 'JetBrains Mono';">${asset.hoursOrKm ? asset.hoursOrKm.toLocaleString() + ' Hr' : '--'}</td>
                                    <td><span style="color: ${asset.condition === 'Poor' ? 'var(--red)' : 'var(--emerald)'}; font-weight:700;">${asset.condition || '--'}</span></td>
                                    <td><span class="status ${asset.status === 'available' ? 'active' : asset.status === 'checked_out' ? 'pending' : 'locked'}" style="${asset.status === 'maintenance' ? 'background: var(--red-light); color: var(--red);' : ''}">${(asset.status || 'unknown').replace(/_/g, ' ')}</span></td>
                                    <td style="text-align: right;">
                                        <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                                            <button class="btn btn-secondary" style="font-size: 11px; padding: 6px 12px;" onclick="window.app.ecModule.openAssetHistory('${asset.id}')">
                                                <i class="fas fa-history"></i> History
                                            </button>
                                            ${asset.status === 'maintenance' ? 
                                              `<button class="btn btn-primary" style="font-size: 11px; padding: 6px 12px;" onclick="window.app.ecModule.handleResolveIssue('${asset.id}', '${asset.name}')"><i class="fas fa-wrench"></i> Mark Fixed</button>`
                                              : `<span style="font-size: 11px; color: var(--slate-400);">No Service</span>`
                                            }
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `;
    },

    async _loadAssets() {
        if (this.isLoadingAssets) return;
        this.isLoadingAssets = true;
        try {
            const result = await assets.getAll();
            const data = result.data || result;
            this.assetRegistry = Array.isArray(data) ? data : (data.items || []);
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load assets:', error);
        } finally {
            this.isLoadingAssets = false;
        }
    }
};
