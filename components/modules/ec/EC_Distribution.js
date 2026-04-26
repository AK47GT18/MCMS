import client from '../../../src/api/client.js';
import { StatCard } from '../ui/StatCard.js';

export const EC_Distribution = {
    getDistributionLogView() {

        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Material Daily "Burn" Registry</div>
                    <button class="btn btn-secondary" onclick="window.app.ecModule._loadDistributionLogs()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                ${this.dispatchLogs.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading distribution logs…</div></div>'
                    : `<table>
                        <thead>
                            <tr><th>Log ID</th><th>Sector</th><th>Section</th><th>Material</th><th>Qty</th><th>Type</th><th>By</th><th>Time</th></tr>
                        </thead>
                        <tbody>
                            ${this.dispatchLogs.map(log => `
                                <tr>
                                    <td><span class="project-id">${log.id}</span></td>
                                    <td style="font-weight: 600;">${log.project}</td>
                                    <td style="font-family: 'JetBrains Mono';">${log.section}</td>
                                    <td style="font-weight: 700;">${log.item}</td>
                                    <td style="font-weight: 800;">${log.qty} ${log.unit}</td>
                                    <td><span class="status ${log.type === 'IN' ? 'active' : 'pending'}">${log.type === 'IN' ? 'STOCK IN' : 'CONSUMED'}</span></td>
                                    <td>${log.supervisor}</td>
                                    <td>${log.time}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `;
    },

    async _loadDistributionLogs() {
        if (this.isLoadingLogs) return;
        this.isLoadingLogs = true;
        try {
            // Get inventory logs (distribution records)
            const result = await client.get('/inventory/project/1');
            const items = Array.isArray(result) ? result : (result.data || []);
            
            this.dispatchLogs = [];
            items.forEach(item => {
                if (item.logs) {
                    item.logs.forEach(log => {
                        this.dispatchLogs.push({
                            id: `D-${log.id}`,
                            project: item.sectorName || 'Project Site',
                            section: log.reference || 'N/A',
                            item: item.materialName,
                            qty: Number(log.quantity),
                            unit: item.unit,
                            supervisor: log.user?.name || 'System',
                            time: new Date(log.timestamp).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                            type: log.type
                        });
                    });
                }
            });
            
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load distribution logs:', error);
        } finally {
            this.isLoadingLogs = false;
        }
    },

    toggleResourceType(type, btn) {
        const machineryView = document.getElementById('machinery_view');
        const materialsView = document.getElementById('material_sheet_view');
        if (!machineryView || !materialsView) return;

        if (type === 'machinery') {
            machineryView.style.display = 'block';
            materialsView.style.display = 'none';
        } else {
            machineryView.style.display = 'none';
            materialsView.style.display = 'block';
        }

        document.querySelectorAll('.active-resource').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    updateMaterialSheet(phaseId) {
        const container = document.getElementById('material_sheet_container');
        if (!container) return;

        const materials = this.phaseMaterials[phaseId];
        if (!materials) {
            container.innerHTML = '<div style="grid-column: 1 / -1; padding: 20px; text-align: center;">No materials listed for this phase.</div>';
            return;
        }

        container.innerHTML = materials.map((mat, i) => `
            <div style="background: white; border: 1px solid var(--slate-200); padding: 12px; border-radius: 8px;">
                <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px;">${mat.name}</div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="number" id="qty_${i}" class="form-input" style="flex: 1; padding: 6px;" placeholder="Qty">
                    <span style="font-size: 11px;">${mat.unit}</span>
                </div>
            </div>
        `).join('');
    },

    async openDispatchDrawer() {
        try {
            // Load projects to populate the drawer
            const result = await client.get('/projects');
            const projects = Array.isArray(result) ? result : (result.data || []);
            this.projects = projects;
            
            window.drawer?.open('Logistics Dispatch', window.DrawerTemplates.assignResource(projects));
        } catch (error) {
            console.error('Failed to load projects for dispatch:', error);
            // Fallback with empty projects
            window.drawer?.open('Logistics Dispatch', window.DrawerTemplates.assignResource([]));
        }
    }
};
