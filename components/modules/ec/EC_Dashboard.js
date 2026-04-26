import client from '../../../src/api/client.js';
import { StatCard } from '../ui/StatCard.js';

export const EC_Dashboard = {
    getDashboardView() {
        const lowStockCount = Object.values(this.inventory).filter(i => i.qty <= i.thresh).length;
        const inventoryEntries = Object.entries(this.inventory);

        return `
            <div class="stats-grid">
                ${StatCard({ title: 'Awaiting Receipt', value: this.pendingReceipts.length.toString(), subtext: 'From FM Procurement', alertColor: 'blue' })}
                ${StatCard({ title: 'Critical Stock', value: lowStockCount.toString().padStart(2,'0'), subtext: 'Materials < Buffers', alertColor: 'red' })}
                ${StatCard({ title: 'Fleet Health', value: this.assetRegistry.length ? (this.assetRegistry.filter(a => a.status === 'available').length / this.assetRegistry.length * 100).toFixed(0) + '%' : '--', subtext: 'Readiness Rate', alertColor: 'emerald' })}
                ${StatCard({ title: 'Daily Burn', value: this.dispatchLogs.length.toString(), subtext: 'Fulfillment today', alertColor: 'orange' })}
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 24px;">
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Live Material "Burn" Status</div>
                        <span class="status active">Real-time</span>
                    </div>
                    <div id="ec-burn-chart" style="padding: 24px;">
                        ${inventoryEntries.length === 0
                            ? '<div style="text-align:center; color: var(--slate-400); padding: 40px;"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:8px;"></i><div>Loading inventory…</div></div>'
                            : this._renderBurnChart(inventoryEntries)
                        }
                    </div>
                </div>

                <div class="data-card" style="margin-top: 24px; grid-column: 1 / -1;">
                    <div class="data-card-header">
                        <div class="card-title"><i class="fas fa-exclamation-triangle" style="color: var(--orange);"></i> Intelligence: Asset Conflict Monitor</div>
                        <button class="btn btn-secondary" onclick="window.app.ecModule?._loadConflicts()"><i class="fas fa-sync"></i> Refresh</button>
                    </div>
                    <div style="padding: 20px;">
                        ${this.conflicts.length === 0
                            ? '<div style="padding: 24px; text-align: center; color: var(--slate-400); font-size: 13px;"><i class="fas fa-check-circle" style="color: var(--emerald); font-size: 20px; margin-bottom: 8px;"></i><div>No asset conflicts detected across active projects.</div></div>'
                            : `
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                                ${this.conflicts.map(c => `
                                    <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                            <span style="font-weight: 800; color: #92400e; text-transform: uppercase; font-size: 11px;">Conflict: ${c.category}</span>
                                            <span class="status locked" style="background: #fef3c7; color: #92400e; font-size: 10px;">${c.shortfall} Unit Shortfall</span>
                                        </div>
                                        <div style="font-size: 12px; color: #b45309; margin-bottom: 12px;">
                                            <strong>Required By:</strong> ${c.neededBy.map(n => n.projectName).join(', ')}
                                        </div>
                                        <div style="background: white; border-radius: 8px; padding: 10px; border: 1px solid #fde68a;">
                                            <div style="font-size: 10px; font-weight: 700; color: var(--slate-500); margin-bottom: 4px;">SYSTEM SUGGESTION</div>
                                            <div style="font-size: 13px; font-weight: 600; color: #92400e;">
                                                Prioritize <span style="text-decoration: underline;">${c.resolution.priorityProjectName}</span>
                                            </div>
                                            <div style="font-size: 11px; color: #b45309; margin-top: 2px;">${c.resolution.reason}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            `
                        }
                    </div>
                </div>

                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Logistics Status</div>
                    </div>
                    <div style="padding: 16px;" id="ec-logistics-status">
                        ${inventoryEntries.length === 0
                            ? '<div style="text-align:center; color: var(--slate-400); padding: 20px;">Loading…</div>'
                            : inventoryEntries.map(([name, data]) => `
                                <div style="margin-bottom: 16px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                                        <span style="font-weight: 600;">${name}</span>
                                        <span style="color: ${data.qty <= data.thresh ? 'var(--red)' : '#64748B'}; font-weight: 700;">${data.qty} ${data.unit}</span>
                                    </div>
                                    <div style="height: 6px; background: var(--slate-100); border-radius: 3px; overflow: hidden;">
                                        <div style="width: ${Math.min(100, (data.qty / Math.max(data.thresh * 3, 1)) * 100)}%; background: ${data.qty <= data.thresh ? 'var(--red)' : 'var(--blue)'}; height: 100%;"></div>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
        `;
    },

    _renderBurnChart(entries) {
        if (entries.length === 0) return '<div style="padding:40px; text-align:center; color: var(--slate-400);">No inventory data</div>';
        const maxQty = Math.max(...entries.map(([, d]) => d.qty), 1);
        const colors = ['var(--blue)', 'var(--orange)', 'var(--emerald)', 'var(--red)', 'var(--purple)'];
        
        return `
            <div style="height: 200px; background: var(--slate-50); border-radius: 12px; display: flex; align-items: flex-end; gap: 40px; padding: 20px; border: 1px solid var(--slate-100);">
                ${entries.map(([name, data], i) => {
                    const pct = Math.max(5, (data.qty / maxQty) * 100);
                    return `
                        <div style="flex: 1; height: ${pct}%; background: ${colors[i % colors.length]}; border-radius: 4px; position: relative; min-height: 10px; transition: height 0.5s ease;">
                            <div style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 10px; color: var(--slate-500); white-space: nowrap;">${name.split(' ')[0]}</div>
                            <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-weight: 700; font-size: 11px;">${data.qty}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
};
