import client from '../../../src/api/client.js';

export const EC_Inventory = {
    getInventoryView() {
        const inventoryEntries = Object.entries(this.inventory || {});

        return `
            <div class="data-card" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5);">
                <div class="data-card-header">
                    <div class="card-title">Consolidated Material Inventory</div>
                    <button class="btn btn-secondary" onclick="window.app.ecModule._loadInventory()">
                        <i class="fas fa-sync"></i> Refresh Stock
                    </button>
                </div>
                <div style="padding: 0 20px 20px;">
                    ${this.isLoadingInventory && inventoryEntries.length === 0
                        ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading inventory…</div></div>'
                        : inventoryEntries.length === 0
                            ? `
                            <div style="padding: 60px; text-align: center; color: var(--slate-400);">
                                <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.1;"><i class="fas fa-warehouse"></i></div>
                                <div style="font-weight: 700; color: var(--slate-600);">No Inventory Found</div>
                                <p style="font-size: 13px; margin-top: 8px;">Consolidated stock levels will appear here.</p>
                            </div>`
                            : `<table class="premium-table">
                                <thead>
                                    <tr>
                                        <th>Material Name</th>
                                        <th>Global Quantity</th>
                                        <th>Status</th>
                                        <th style="text-align: right;">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${inventoryEntries.map(([name, data]) => {
                                        const isLow = data.qty <= data.thresh;
                                        return `
                                        <tr class="animate-slide-up">
                                            <td>
                                                <div style="font-weight: 700; color: var(--slate-800);">${name}</div>
                                                <div style="font-size: 11px; color: var(--slate-500);">${data.category || 'Construction Materials'}</div>
                                            </td>
                                            <td>
                                                <div style="display: flex; align-items: baseline; gap: 4px;">
                                                    <span style="font-family: 'JetBrains Mono'; font-weight: 800; font-size: 15px; color: var(--indigo-600);">${data.qty.toLocaleString()}</span>
                                                    <span style="font-size: 11px; color: var(--slate-500);">${data.unit}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span class="status ${isLow ? 'locked' : 'active'}" style="border:none;">
                                                    ${isLow ? 'CRITICAL' : 'STABLE'}
                                                </span>
                                            </td>
                                            <td style="text-align: right;">
                                                <button class="btn btn-secondary" style="font-size: 11px; padding: 6px 12px;" onclick="window.app.ecModule.openInventoryDetails('${name}')">
                                                    <i class="fas fa-eye"></i> View Allocations
                                                </button>
                                            </td>
                                        </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>`
                    }
                </div>
            </div>

            <div style="margin-top: 24px; padding: 20px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; display: flex; align-items: center; gap: 16px;">
                <div style="width: 48px; height: 48px; background: var(--blue); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div style="font-size: 13px; color: #1e40af; line-height: 1.5;">
                    <strong>Allocation Logic:</strong> Use the <strong>View Allocations</strong> button to see exactly which project owns each specific unit of stock. Cross-project material usage is restricted.
                </div>
            </div>
        `;
    },

    async _loadInventory() {
        if (this.isLoadingInventory) return;
        this.isLoadingInventory = true;
        this._refreshCurrentView();

        try {
            // 1. Load active projects
            const projectsRes = await client.get('/projects');
            const projects = projectsRes.data?.items || projectsRes.data || projectsRes || [];
            this.activeProjects = Array.isArray(projects) ? projects : [];

            // 2. Load inventory for each project
            const inventoryByProject = {};
            const globalInventory = {};

            await Promise.all(this.activeProjects.map(async (project) => {
                try {
                    const invRes = await client.get(`/inventory/project/${project.id}`);
                    const items = invRes.data?.items || invRes.data || invRes || [];
                    
                    if (Array.isArray(items)) {
                        inventoryByProject[project.id] = items;
                        
                        items.forEach(item => {
                            if (!globalInventory[item.materialName]) {
                                globalInventory[item.materialName] = {
                                    qty: 0,
                                    unit: item.unit,
                                    thresh: 100, // Default threshold
                                    category: item.category
                                };
                            }
                            globalInventory[item.materialName].qty += Number(item.quantityOnHand);
                        });
                    }
                } catch (err) {
                    console.error(`[EC] Failed to load inventory for project ${project.id}:`, err);
                }
            }));

            this.inventory = globalInventory;
            this.inventoryByProject = inventoryByProject;
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Inventory sync failed:', error);
        } finally {
            this.isLoadingInventory = false;
            this._refreshCurrentView();
        }
    }
};
