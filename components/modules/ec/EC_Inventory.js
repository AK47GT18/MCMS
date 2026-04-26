import client from '../../../src/api/client.js';
import { StatCard } from '../ui/StatCard.js';

export const EC_Inventory = {
    getInventoryView() {

        const entries = Object.entries(this.inventory);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Consumable Resource Silo</div>
                    <button class="btn btn-secondary" onclick="window.app.ecModule._loadInventory()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                ${entries.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading inventory from server…</div></div>'
                    : `<table>
                        <thead>
                            <tr><th>Material</th><th>Current Stock</th><th>Buffer Threshold</th><th>Sector</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            ${entries.map(([name, data]) => `
                                <tr>
                                    <td style="font-weight: 700;">${name}</td>
                                    <td style="font-family: 'JetBrains Mono'; font-weight: 800; font-size: 15px;">${data.qty} ${data.unit}</td>
                                    <td>${data.thresh} ${data.unit}</td>
                                    <td style="font-size: 12px; color: var(--slate-500);">${data.sectorName || '--'}</td>
                                    <td><span class="status ${data.qty <= data.thresh ? 'locked' : 'active'}" style="${data.qty <= data.thresh ? 'background: var(--red-light); color: var(--red);' : ''}">${data.qty <= data.thresh ? 'BUFF ALERT' : 'HEALTHY'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `;
    },

    async _loadInventory() {
        if (this.isLoadingInventory) return;
        this.isLoadingInventory = true;
        try {
            // Get inventory for the first project's first sector, or fetch all
            const result = await client.get('/inventory/project/1');
            const items = Array.isArray(result) ? result : (result.data || []);
            
            // Convert API format to display format
            this.inventory = {};
            items.forEach(item => {
                this.inventory[item.materialName] = {
                    qty: Number(item.quantityOnHand || 0),
                    unit: item.unit,
                    id: item.id,
                    thresh: Number(item.lowThreshold || 0),
                    sectorId: item.sectorId,
                    sectorName: item.sectorName
                };
            });

            // Re-render the relevant container
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load inventory:', error);
        } finally {
            this.isLoadingInventory = false;
        }
    }
};
