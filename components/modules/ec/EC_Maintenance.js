import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';
import schedulerApi from '../../../src/api/scheduler.api.js';

export const EC_Maintenance = {
    getMaintenanceView() {

        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Fleet Health Monitor</div>
                </div>
                ${this.isLoadingAssets && this.assetRegistry.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading fleet data…</div></div>'
                    : this.assetRegistry.length === 0
                        ? '<div style="padding: 40px; text-align: center; color: var(--slate-400); border: 1px dashed var(--slate-200); border-radius: 12px; margin: 20px;"><i class="fas fa-tools" style="font-size:32px; margin-bottom:12px; opacity:0.3;"></i><div>No Service Records Found</div><div style="font-size:12px;">Maintenance history will appear here once assets are added and serviced.</div></div>'
                        : `<table>
                        <thead>
                            <tr><th>Equipment</th><th>Last Service</th><th>Condition</th><th>Criticality</th></tr>
                        </thead>
                        <tbody>
                            ${this.assetRegistry.map(asset => {
                                const lastService = asset.lastMaintenanceAt ? new Date(asset.lastMaintenanceAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : 'Never';
                                const isCritical = asset.condition === 'Poor';
                                return `
                                <tr>
                                    <td style="font-weight: 700;">${asset.name}</td>
                                    <td>${lastService}</td>
                                    <td>${asset.condition || '--'}</td>
                                    <td><span class="status ${isCritical ? 'locked' : 'active'}" style="${isCritical ? 'background:var(--red-light); color:var(--red);' : ''}">${isCritical ? 'CRITICAL' : 'HEALTHY'}</span></td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `;
    }
,

    getOperatorsView() {
        // Load assets with operator info

        const activeAssets = this.assetRegistry.filter(a => a.status === 'checked_out');

        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Field Operations Command</div>
                    <button class="btn btn-secondary" onclick="window.app.ecModule._loadAssets()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                ${activeAssets.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-truck-monster" style="font-size: 32px; margin-bottom: 12px;"></i><div style="font-weight: 600;">No active operators</div><div style="font-size: 13px;">Check out assets to see field operations</div></div>'
                    : `<table>
                        <thead>
                            <tr><th>Operator</th><th>Equipment</th><th>Project</th><th>Status</th><th>Fuel</th></tr>
                        </thead>
                        <tbody>
                            ${activeAssets.map(asset => `
                                <tr>
                                    <td style="font-weight: 700;">${asset.currentProject?.fieldSupervisor?.name || 'Assigned'}</td>
                                    <td>${asset.name}</td>
                                    <td>${asset.currentProject?.name || '--'}</td>
                                    <td><span class="status active">Active Ops</span></td>
                                    <td>${asset.fuelLevel ? asset.fuelLevel + '%' : '--'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `;
    }
,

    getUtilizationView() {
        const total = this.assetRegistry.length || 1;
        const active = this.assetRegistry.filter(a => a.status === 'checked_out').length;
        const pct = Math.round((active / total) * 100);

        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Logistics Efficiency Dashboard</div>
                </div>
                <div style="padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                    <div>
                        <div style="font-size: 14px; font-weight: 700; margin-bottom: 20px;">Fleet Utilization Rate (Live)</div>
                        <div style="height: 24px; background: var(--slate-100); border-radius: 12px; overflow: hidden; margin-bottom: 12px;"><div style="width: ${pct}%; background: var(--emerald); height: 100%; transition: width 0.5s ease;"></div></div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px;"><span>Active: ${pct}%</span><span>Idle: ${100 - pct}%</span></div>
                    </div>
                    <div>
                        <div style="font-size: 14px; font-weight: 700; margin-bottom: 20px;">Inventory Health</div>
                        <div style="font-size: 32px; font-weight: 800; color: var(--slate-800);">${Object.keys(this.inventory).length}</div>
                        <div style="font-size: 12px; color: var(--slate-500);">Tracked materials across all sectors</div>
                    </div>
                </div>
            </div>
        `;
    }
,

    async _loadConflicts() {
        if (this.isLoadingConflicts) return;
        this.isLoadingConflicts = true;
        try {
            const result = await schedulerApi.getConflicts();
            this.conflicts = Array.isArray(result) ? result : (result.data || []);
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load conflicts:', error);
        } finally {
            this.isLoadingConflicts = false;
        }
    }
};
