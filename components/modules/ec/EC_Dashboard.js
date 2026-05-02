import { StatCard } from '../../ui/StatCard.js';

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

            <!-- Role Gist / Guidance Strip -->
            <div style="background: linear-gradient(135deg, var(--indigo-600), var(--indigo-800)); color: white; padding: 20px; border-radius: 16px; margin: 24px 0; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.2);">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; backdrop-filter: blur(10px);">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div>
                        <div style="font-weight: 800; font-size: 16px; letter-spacing: -0.02em;">Equipment Coordinator Hub</div>
                        <div style="font-size: 13px; opacity: 0.8;">You are responsible for Site fulfillment, Asset readiness, and Inventory integrity.</div>
                    </div>
                </div>
                <button class="btn" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(5px);" onclick="window.app.ecModule.showGistModal()">
                    Learn Module Map
                </button>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
                <div class="data-card" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5);">
                    <div class="data-card-header">
                        <div class="card-title">Live Material "Burn" Status</div>
                        <span class="status active" style="background: var(--emerald-light); color: var(--emerald); border: none;">Real-time</span>
                    </div>
                    <div id="ec-burn-chart" style="padding: 24px;">
                        ${this.isLoadingInventory && inventoryEntries.length === 0
                            ? '<div style="text-align:center; color: var(--slate-400); padding: 40px;"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:8px;"></i><div>Loading inventory…</div></div>'
                            : inventoryEntries.length === 0 
                                ? `
                                <div style="text-align:center; color: var(--slate-400); padding: 40px;">
                                    <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.2;"><i class="fas fa-box-open"></i></div>
                                    <div style="font-weight: 700; color: var(--slate-600);">No Active Material Data</div>
                                    <div style="font-size: 12px; max-width: 200px; margin: 8px auto;">Distribution logs will appear here once materials are dispatched to sites.</div>
                                </div>`
                                : this._renderBurnChart(inventoryEntries)
                        }
                    </div>
                </div>

                <div class="data-card" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5);">
                    <div class="data-card-header">
                        <div class="card-title">Inventory Health</div>
                        ${lowStockCount > 0 ? `
                            <button class="btn btn-red btn-xs" style="padding: 4px 8px; font-size: 10px;" onclick="window.app.ecModule.reorderAllCritical()">
                                <i class="fas fa-shopping-cart"></i> Reorder All
                            </button>
                        ` : ''}
                    </div>
                    <div style="padding: 16px;" id="ec-logistics-status">
                        ${this.isLoadingInventory && inventoryEntries.length === 0
                            ? '<div style="text-align:center; color: var(--slate-400); padding: 20px;"><i class="fas fa-circle-notch fa-spin"></i></div>'
                            : inventoryEntries.length === 0
                                ? `
                                <div style="text-align:center; color: var(--slate-400); padding: 20px;">
                                    <i class="fas fa-warehouse" style="font-size: 32px; opacity: 0.2; margin-bottom: 12px;"></i>
                                    <div style="font-size: 12px; font-weight: 600;">Silo is empty</div>
                                </div>`
                                : inventoryEntries.map(([name, data]) => `
                                    <div style="margin-bottom: 16px; padding: 12px; background: white; border-radius: 12px; border: 1px solid var(--slate-100);">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
                                            <span style="font-weight: 700; color: var(--slate-700);">${name}</span>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <span style="color: ${data.qty <= data.thresh ? 'var(--red)' : 'var(--indigo-600)'}; font-weight: 800;">${data.qty} ${data.unit}</span>
                                                ${data.qty <= data.thresh ? `
                                                    <button class="btn btn-red btn-xs" style="width:20px; height:20px; padding:0; display:flex; align-items:center; justify-content:center;" onclick="window.app.ecModule.reorderMaterial('${name}')" title="Replenish ${name}">
                                                        <i class="fas fa-plus" style="font-size: 8px;"></i>
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </div>
                                        <div style="height: 8px; background: var(--slate-100); border-radius: 4px; overflow: hidden;">
                                            <div style="width: ${Math.min(100, (data.qty / Math.max(data.thresh * 3, 1)) * 100)}%; background: ${data.qty <= data.thresh ? 'linear-gradient(90deg, var(--red), #f87171)' : 'linear-gradient(90deg, var(--indigo-500), var(--indigo-600))'}; height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
                                        </div>
                                    </div>
                                `).join('')
                        }
                    </div>
                </div>

                <div class="data-card" style="grid-column: 1 / -1; margin-top: 0; background: linear-gradient(to bottom, #fff, #f8fafc); border: 1px solid var(--slate-200);">
                    <div class="data-card-header" style="border-bottom: 1px solid var(--slate-100);">
                        <div class="card-title"><i class="fas fa-bolt" style="color: var(--orange); margin-right: 8px;"></i> Intelligence: Asset Conflict Monitor</div>
                        <button class="btn btn-secondary" onclick="window.app.ecModule?._loadConflicts()"><i class="fas fa-sync"></i> Refresh</button>
                    </div>
                    <div style="padding: 24px;">
                        ${this.isLoadingConflicts && this.conflicts.length === 0
                            ? '<div style="padding: 24px; text-align: center; color: var(--slate-400); font-size: 13px;"><i class="fas fa-circle-notch fa-spin"></i><div>Detecting conflicts…</div></div>'
                            : this.conflicts.length === 0
                                ? `
                                <div style="padding: 40px; text-align: center; color: var(--slate-500); background: white; border-radius: 12px; border: 1px dashed var(--slate-200);">
                                    <div style="font-size: 32px; color: var(--emerald); margin-bottom: 16px;"><i class="fas fa-check-double"></i></div>
                                    <div style="font-weight: 800; font-size: 15px; color: var(--slate-800);">Fleet Schedule is Clear</div>
                                    <div style="font-size: 13px; margin-top: 4px;">No concurrent asset requests found for active project timelines.</div>
                                </div>`
                                : `
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
                                    ${this.conflicts.map(c => `
                                        <div style="background: white; border: 1px solid #fde68a; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                                <span style="font-weight: 800; color: #92400e; text-transform: uppercase; font-size: 11px; background: #fef3c7; padding: 4px 10px; border-radius: 20px;">Conflict: ${c.category}</span>
                                                <span style="font-weight: 800; color: var(--red); font-size: 13px;">-${c.shortfall} Units</span>
                                            </div>
                                            <div style="font-size: 13px; color: var(--slate-600); margin-bottom: 16px;">
                                                <strong>Projects Impacted:</strong> ${c.neededBy.map(n => `<span style="color: var(--slate-900); font-weight:600;">${n.projectName}</span>`).join(' & ')}
                                            </div>
                                            <div style="background: var(--slate-50); border-radius: 12px; padding: 12px; border-left: 4px solid var(--indigo-500);">
                                                <div style="font-size: 10px; font-weight: 800; color: var(--indigo-600); margin-bottom: 4px; text-transform: uppercase;">System Resolution Strategy</div>
                                                <div style="font-size: 13px; font-weight: 700; color: var(--slate-800);">
                                                    Prioritize ${c.resolution.priorityProjectName}
                                                </div>
                                                <div style="font-size: 11px; color: var(--slate-500); margin-top: 4px; line-height: 1.4;">${c.resolution.reason}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                `
                        }
                    </div>
                </div>
            </div>
        `;
    },

    _renderBurnChart(entries) {
        if (entries.length === 0) return '';
        const maxQty = Math.max(...entries.map(([, d]) => d.qty), 1);
        const colors = ['var(--indigo-500)', 'var(--orange-500)', 'var(--emerald-500)', 'var(--red-500)', 'var(--purple-500)'];
        
        return `
            <div style="height: 240px; background: white; border-radius: 16px; display: flex; align-items: flex-end; gap: 48px; padding: 32px; border: 1px solid var(--slate-100); box-shadow: inset 0 -4px 10px rgba(0,0,0,0.02);">
                ${entries.map(([name, data], i) => {
                    const pct = Math.max(5, (data.qty / maxQty) * 100);
                    return `
                        <div style="flex: 1; height: ${pct}%; background: ${colors[i % colors.length]}; border-radius: 8px 8px 4px 4px; position: relative; min-height: 12px; transition: height 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                            <div style="position: absolute; bottom: -30px; left: 50%; transform: translateX(-50%); font-size: 11px; font-weight: 600; color: var(--slate-600); white-space: nowrap;">${name.split(' ')[0]}</div>
                            <div style="position: absolute; top: -24px; left: 50%; transform: translateX(-50%); font-weight: 800; font-size: 12px; color: var(--slate-800);">${data.qty}</div>
                            <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(255,255,255,0.2), transparent); border-radius: 8px 8px 0 0;"></div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
};
