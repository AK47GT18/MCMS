import client from '../../../src/api/client.js';

export const EC_ProjectLogistics = {
    getProjectLogisticsView() {
        setTimeout(() => this.loadProjectLogistics(), 0);
        return `
            <div class="data-card" style="background: white; border: 1px solid var(--slate-200); border-radius: 24px; overflow: hidden; box-shadow: var(--shadow-sm);">
                <div class="data-card-header" style="padding: 24px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200);">
                    <div>
                        <div class="card-title" style="font-size: 18px; font-weight: 800; color: var(--slate-900);">Project Logistics Ledger</div>
                        <div style="font-size: 12px; color: var(--slate-500); font-weight: 500;">Real-time site fulfillment and consumption tracking</div>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-secondary" style="background: white; border-color: var(--slate-200); font-weight: 700;" onclick="window.app.ecModule?.loadProjectLogistics()">
                            <i class="fas fa-sync" style="color: var(--orange);"></i> Refresh Ledger
                        </button>
                    </div>
                </div>

                <div id="pl-ledger-container">
                    <div style="padding: 60px; text-align: center; color: var(--slate-400);">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 32px; margin-bottom: 16px;"></i>
                        <div style="font-weight: 600;">Aggregating portfolio logistics data...</div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadProjectLogistics() {
        const container = document.getElementById('pl-ledger-container');
        if (!container) return;

        try {
            // Load all necessary data
            const [projectsRes, requisitionsRes] = await Promise.all([
                client.get('/projects'),
                client.get('/requisitions')
            ]);

            const projects = Array.isArray(projectsRes) ? projectsRes : (projectsRes.data || []);
            const allReqs = Array.isArray(requisitionsRes) ? requisitionsRes : (requisitionsRes.data || []);

            // Process stats
            const totalSites = projects.length;
            const pendingReqs = allReqs.filter(r => r.status === 'Pending' || r.status === 'pending');
            const delayedReqs = pendingReqs.filter(r => {
                const created = new Date(r.createdAt);
                const diff = (new Date() - created) / (1000 * 60 * 60 * 24);
                return diff > 3; // Consider delayed if pending for > 3 days
            });

            // No charts in ledger view per user request
            container.innerHTML = `
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background: var(--slate-50); border-bottom: 1px solid var(--slate-200);">
                        <tr>
                            <th style="padding: 16px 24px; font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.05em;">Project / Site Location</th>
                            <th style="padding: 16px 24px; font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.05em;">Fulfillment (Holdings)</th>
                            <th style="padding: 16px 24px; font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.05em;">Demand (Requests)</th>
                            <th style="padding: 16px 24px; font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Logistics Health</th>
                            <th style="padding: 16px 24px; font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Operations</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${projects.map(p => {
                            const pReqs = allReqs.filter(r => r.projectId == p.id);
                            const pPending = pReqs.filter(r => r.status === 'Pending' || r.status === 'pending');
                            const siteInv = this.inventoryByProject?.[p.id] || [];
                            
                            // Refined Health Logic
                            let healthStatus = 'STABLE';
                            let healthClass = 'active';
                            
                            if (siteInv.length === 0 && pPending.length === 0) {
                                healthStatus = 'STANDBY';
                                healthClass = 'blue';
                            } else if (pPending.length > 3) {
                                healthStatus = 'DELAYED';
                                healthClass = 'delayed';
                            } else if (siteInv.length < 3 && pPending.length === 0) {
                                healthStatus = 'AT RISK';
                                healthClass = 'warning';
                            }

                            return `
                                <tr style="border-bottom: 1px solid var(--slate-100); background: white; transition: all 0.2s;">
                                    <td style="padding: 24px;">
                                        <div style="font-weight: 800; color: var(--slate-900); font-size: 15px; letter-spacing: -0.01em;">${p.name}</div>
                                        <div style="font-size: 11px; color: var(--slate-400); font-weight: 700; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
                                            <i class="fas fa-map-marker-alt" style="color: var(--slate-300);"></i> ${p.location || 'Active Site'}
                                        </div>
                                    </td>
                                    <td style="padding: 24px;">
                                        <div style="display: flex; flex-direction: column; gap: 6px;">
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${siteInv.length > 0 ? 'var(--emerald)' : 'var(--slate-300)'};"></div>
                                                <span style="font-size: 13px; font-weight: 700; color: var(--slate-700);">${siteInv.length} Items Allocated</span>
                                            </div>
                                            <div style="font-size: 10px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; margin-left: 16px;">
                                                Site Inventory Integrity
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 24px;">
                                        <div style="display: flex; flex-direction: column; gap: 4px;">
                                            <div style="font-weight: 800; color: ${pPending.length > 0 ? 'var(--orange)' : 'var(--slate-400)'}; font-size: 14px;">
                                                ${pPending.length} <span style="font-size: 11px; font-weight: 600;">PENDING</span>
                                            </div>
                                            <div style="font-size: 11px; color: var(--slate-500); font-weight: 500;">Total requests: ${pReqs.length}</div>
                                        </div>
                                    </td>
                                    <td style="padding: 24px; text-align: center;">
                                        <div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; background: var(--slate-50); border: 1px solid var(--slate-200);">
                                            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${healthClass === 'active' ? 'var(--emerald)' : healthClass === 'blue' ? 'var(--indigo-500)' : healthClass === 'warning' ? 'var(--orange)' : 'var(--red)'};"></span>
                                            <span style="font-weight: 800; font-size: 10px; color: var(--slate-600); text-transform: uppercase; letter-spacing: 0.02em;">${healthStatus}</span>
                                        </div>
                                    </td>
                                    <td style="padding: 24px; text-align: right;">
                                        <button class="btn btn-secondary btn-sm" style="border-radius: 10px; padding: 8px 16px; border-color: var(--slate-200); font-weight: 700; background: white;" onclick="window.app.ecModule.openProjectIntelligence(${p.id})">
                                            <i class="fas fa-chart-line" style="margin-right: 8px; color: var(--indigo-500);"></i> Audit
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                ${projects.length === 0 ? `
                    <div style="padding: 48px; text-align: center; color: var(--slate-400);">
                        <i class="fas fa-folder-open" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
                        <div>No projects found in the logistics portfolio.</div>
                    </div>
                ` : ''}
            `;
        } catch (error) {
            console.error('[EC] Ledger load failed:', error);
            container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--red);">Error loading logistics data: ${error.message}</div>`;
        }
    }
};
