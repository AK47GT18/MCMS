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
                                : inventoryEntries.map(([name, data], i) => {
                                     const pct = Math.min(100, (data.qty / Math.max(data.thresh * 5, 1)) * 100);
                                     const isLow = data.qty <= data.thresh;
                                     const color = this._getMaterialColor(name, i);
                                     return `
                                     <div style="margin-bottom: 24px; padding: 16px; background: white; border-radius: 16px; border: 1px solid var(--slate-100); box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                                         <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: flex-end;">
                                             <div>
                                                 <div style="font-weight: 800; color: var(--slate-900); font-size: 14px;">${name}</div>
                                                 <div style="font-size: 11px; color: var(--slate-400); font-weight: 700; text-transform: uppercase;">Stock Integrity Scan</div>
                                             </div>
                                             <div style="text-align: right;">
                                                 <div style="color: ${isLow ? '#ef4444' : color.main}; font-weight: 900; font-family: 'JetBrains Mono'; font-size: 15px;">${data.qty.toLocaleString()}</div>
                                                 <div style="font-size: 10px; color: var(--slate-400); font-weight: 700; text-transform: uppercase;">${data.unit} Available</div>
                                             </div>
                                         </div>
                                         <div style="height: 10px; background: var(--slate-50); border-radius: 5px; overflow: hidden; border: 1px solid var(--slate-100);">
                                             <div style="width: ${pct}%; background: ${isLow ? 'linear-gradient(90deg, #ef4444, #f87171)' : color.grad}; height: 100%; border-radius: 5px; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 0 10px ${isLow ? 'rgba(239, 68, 68, 0.2)' : color.glow};"></div>
                                         </div>
                                     </div>
                                `;}).join('')
                        }
                    </div>
                </div>

                <div class="data-card" style="grid-column: 1 / -1; background: white; border-radius: 24px; border: 1px solid var(--slate-200); box-shadow: 0 4px 20px rgba(0,0,0,0.02); overflow: hidden;">
                    <div class="data-card-header" style="padding: 32px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200);">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="width: 48px; height: 48px; background: white; border: 1px solid var(--slate-200); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--orange); font-size: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                                <i class="fas fa-microchip"></i>
                            </div>
                            <div>
                                <div class="card-title" style="font-size: 20px; font-weight: 800; color: var(--slate-900); margin: 0;">Intelligence: Asset Conflict Monitor</div>
                                <div style="color: var(--slate-500); font-size: 13px; font-weight: 500;">Predictive analysis of equipment scheduling conflicts</div>
                            </div>
                        </div>
                        <button class="btn" style="background: white; color: var(--slate-700); border: 1px solid var(--slate-200); font-weight: 700; font-size: 13px; padding: 10px 20px; border-radius: 12px;" onclick="window.app.ecModule?._loadConflicts()">
                            <i class="fas fa-sync" style="margin-right: 8px; color: var(--orange);"></i> Refresh Analysis
                        </button>
                    </div>
                    <div style="padding: 32px;">
                        ${this.isLoadingConflicts && this.conflicts.length === 0
                            ? '<div style="padding: 24px; text-align: center; color: var(--slate-400); font-size: 13px;"><i class="fas fa-circle-notch fa-spin"></i><div>Detecting conflicts…</div></div>'
                            : this.conflicts.length === 0
                                ? `
                                <div style="background: var(--slate-50); border: 1px dashed var(--slate-200); border-radius: 20px; padding: 60px 40px; text-align: center; position: relative; overflow: hidden;">
                                    <!-- Subtle Radar Animation -->
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; height: 400px; background: radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
                                    
                                    <div style="position: relative; z-index: 1;">
                                        <div style="position: relative; width: 90px; height: 90px; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center;">
                                            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 1px solid var(--emerald); opacity: 0.2; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                                            <div style="width: 64px; height: 64px; border-radius: 20px; background: white; border: 1px solid var(--emerald); display: flex; align-items: center; justify-content: center; color: var(--emerald); font-size: 28px; box-shadow: 0 8px 25px rgba(16, 185, 129, 0.1);">
                                                <i class="fas fa-shield-alt"></i>
                                            </div>
                                        </div>
                                        
                                        <div style="display: inline-flex; align-items: center; gap: 8px; background: white; padding: 6px 14px; border-radius: 30px; border: 1px solid var(--emerald-light); margin-bottom: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--emerald); animation: pulse 1.5s infinite;"></span>
                                            <span style="font-size: 11px; font-weight: 800; color: var(--emerald); text-transform: uppercase; letter-spacing: 0.5px;">System Scan Complete</span>
                                        </div>

                                        <h3 style="font-size: 24px; font-weight: 900; color: var(--slate-900); margin: 0; letter-spacing: -0.02em;">Fleet Schedule is Clear</h3>
                                        <p style="font-size: 15px; color: var(--slate-500); margin: 12px auto 0; font-weight: 500; max-width: 450px; line-height: 1.6;">Intelligence systems report zero concurrent asset requests or logistical bottlenecks across current project timelines.</p>

                                        <div style="margin-top: 32px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; border-top: 1px solid var(--slate-200); padding-top: 32px;">
                                            <div>
                                                <div style="font-size: 11px; color: var(--slate-400); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Last Analysis</div>
                                                <div style="font-size: 13px; color: var(--slate-700); font-weight: 700;">Real-time (Active)</div>
                                            </div>
                                            <div>
                                                <div style="font-size: 11px; color: var(--slate-400); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Risk Level</div>
                                                <div style="font-size: 13px; color: var(--emerald); font-weight: 800;">Negligible</div>
                                            </div>
                                            <div>
                                                <div style="font-size: 11px; color: var(--slate-400); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Fleet Status</div>
                                                <div style="font-size: 13px; color: var(--slate-700); font-weight: 700;">Optimized</div>
                                            </div>
                                        </div>
                                    </div>
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
        return `
            <div style="height: 300px; position: relative; padding: 20px;">
                <canvas id="ec-burn-chart-canvas"></canvas>
            </div>
        `;
    },

    initCharts() {
        if (this.currentView !== 'dashboard') return;
        
        // Wait for Chart.js if not yet loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not yet loaded, retrying in 100ms...');
            setTimeout(() => this.initCharts(), 100);
            return;
        }

        const entries = Object.entries(this.inventory || {});
        if (entries.length === 0) {
            console.warn('No inventory entries for charts');
            return;
        }

        requestAnimationFrame(() => {
            this._initBurnChart(entries);
            this._initHealthChart(entries);
        });
    },

    _initBurnChart(entries) {
        const ctx = document.getElementById('ec-burn-chart-canvas');
        if (!ctx) {
            console.error('Burn chart canvas not found');
            return;
        }

        if (this.burnChartInstance) this.burnChartInstance.destroy();

        const labels = entries.map(([name]) => name.split(' ')[0]);
        const data = entries.map(([, d]) => d.qty);
        const colors = entries.map(([name], i) => this._getMaterialColor(name, i).main);

        try {
            this.burnChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Material Qty',
                        data: data,
                        backgroundColor: colors,
                        borderRadius: 8,
                        borderSkipped: false,
                        barPercentage: 0.6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 1000 },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1e293b',
                            titleFont: { size: 14, weight: '800' },
                            bodyFont: { size: 13 },
                            padding: 12,
                            cornerRadius: 10,
                            displayColors: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { display: true, color: 'rgba(0,0,0,0.03)', drawBorder: false },
                            ticks: { font: { size: 11, weight: '600' }, color: '#64748b' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11, weight: '700' }, color: '#475569' }
                        }
                    }
                }
            });
        } catch (e) {
            console.error('Failed to init burn chart:', e);
        }
    },

    _initHealthChart(entries) {
        const container = document.getElementById('ec-logistics-status');
        if (!container) {
            console.error('Health chart container not found');
            return;
        }

        container.innerHTML = '<div style="height: 300px; position: relative;"><canvas id="ec-health-chart-canvas"></canvas></div>';
        
        const ctx = document.getElementById('ec-health-chart-canvas');
        if (!ctx) {
            console.error('Health chart canvas not found');
            return;
        }

        if (this.healthChartInstance) this.healthChartInstance.destroy();

        const labels = entries.map(([name]) => name);
        const data = entries.map(([, d]) => d.qty);
        const colors = entries.map(([name], i) => {
            const isLow = this.inventory[name]?.qty <= this.inventory[name]?.thresh;
            return isLow ? '#ef4444' : this._getMaterialColor(name, i).main;
        });

        try {
            this.healthChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 1000 },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1e293b',
                            padding: 12,
                            cornerRadius: 10
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: { display: true, color: 'rgba(0,0,0,0.03)' },
                            ticks: { font: { size: 10, weight: '600' } }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { font: { size: 10, weight: '700' }, color: '#475569' }
                        }
                    }
                }
            });
        } catch (e) {
            console.error('Failed to init health chart:', e);
        }
    },

    _getMaterialColor(name, i) {
        const materialColors = {
            'Bitumen': { main: '#1e293b' },
            'Portland': { main: '#0369a1' },
            'Sand': { main: '#b45309' },
            'Steel': { main: '#475569' }
        };

        const key = Object.keys(materialColors).find(k => name.includes(k));
        if (key) return materialColors[key];

        const fallbacks = [
            { main: '#15803d' },
            { main: '#0e7490' },
            { main: '#4338ca' }
        ];
        return fallbacks[i % fallbacks.length];
    }
};
