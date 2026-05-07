import { StatCard } from '../../ui/StatCard.js';

export const EC_Dashboard = {
    getDashboardView() {
        const lowStockCount = Object.values(this.inventory).filter(i => i.qty <= i.thresh).length;
        const fleetReady = this.assetRegistry.length 
            ? ((this.assetRegistry.filter(a => a.status === 'available' || a.status === 'in_use').length / this.assetRegistry.length) * 100).toFixed(0) 
            : 0;

        return `
            <!-- Top Command Strip -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px;">
                <div style="background: white; padding: 24px; border-radius: 24px; border: 1px solid var(--slate-200); position: relative; overflow: hidden; box-shadow: var(--shadow-sm);">
                    <div style="position: absolute; top: -10px; right: -10px; font-size: 64px; color: var(--slate-50); opacity: 0.5;"><i class="fas fa-truck-ramp-box"></i></div>
                    <div style="font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Awaiting Receipt</div>
                    <div style="font-size: 32px; font-weight: 900; color: var(--slate-900);">${this.pendingReceipts.length}</div>
                    <div style="font-size: 11px; color: var(--blue); font-weight: 700; margin-top: 4px;">Pending Intake</div>
                </div>
                <div style="background: white; padding: 24px; border-radius: 24px; border: 1px solid var(--slate-200); position: relative; overflow: hidden; box-shadow: var(--shadow-sm);">
                    <div style="position: absolute; top: -10px; right: -10px; font-size: 64px; color: var(--red-light); opacity: 0.1;"><i class="fas fa-triangle-exclamation"></i></div>
                    <div style="font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Critical Stock</div>
                    <div style="font-size: 32px; font-weight: 900; color: var(--red);">${lowStockCount.toString().padStart(2, '0')}</div>
                    <div style="font-size: 11px; color: var(--red); font-weight: 700; margin-top: 4px;">Action Required</div>
                </div>
                <div style="background: white; padding: 24px; border-radius: 24px; border: 1px solid var(--slate-200); position: relative; overflow: hidden; box-shadow: var(--shadow-sm);">
                    <div style="position: absolute; top: -10px; right: -10px; font-size: 64px; color: var(--emerald-light); opacity: 0.2;"><i class="fas fa-shield-check"></i></div>
                    <div style="font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Fleet Readiness</div>
                    <div style="font-size: 32px; font-weight: 900; color: var(--emerald);">${fleetReady}%</div>
                    <div style="font-size: 11px; color: var(--slate-500); font-weight: 700; margin-top: 4px;">Asset Reliability</div>
                </div>
                <div style="background: white; padding: 24px; border-radius: 24px; border: 1px solid var(--slate-200); position: relative; overflow: hidden; box-shadow: var(--shadow-sm);">
                    <div style="position: absolute; top: -10px; right: -10px; font-size: 64px; color: var(--orange-light); opacity: 0.2;"><i class="fas fa-fire-flame-curved"></i></div>
                    <div style="font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Daily Burn</div>
                    <div style="font-size: 32px; font-weight: 900; color: var(--orange);">${this.dispatchLogs.length}</div>
                    <div style="font-size: 11px; color: var(--slate-500); font-weight: 700; margin-top: 4px;">Active Dispatches</div>
                </div>
            </div>

            <!-- Consolidated Logistics Intelligence Center -->
            <div style="background: white; color: var(--slate-900); padding: 32px; border-radius: 32px; margin-bottom: 24px; box-shadow: var(--shadow-md); border: 1px solid var(--slate-200); position: relative; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="width: 8px; height: 8px; background: var(--indigo-500); border-radius: 50%; box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);"></span>
                            <div style="font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.1em;">Real-Time Portfolio Intelligence</div>
                        </div>
                        <h2 style="font-size: 28px; font-weight: 900; color: var(--slate-900); margin: 0; letter-spacing: -0.02em;">Logistics Command Dashboard</h2>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn" style="background: var(--slate-50); color: var(--slate-700); border: 1px solid var(--slate-200); font-weight: 800; font-size: 11px; padding: 10px 20px; border-radius: 12px;" onclick="window.app.loadPage('project-logistics')">
                            Site Ledger <i class="fas fa-arrow-right" style="margin-left: 6px; color: var(--indigo-500);"></i>
                        </button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 32px;">
                    <div style="display: flex; flex-direction: column; gap: 24px;">
                        <div style="background: var(--slate-50); border-radius: 24px; padding: 24px; border: 1px solid var(--slate-100);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                                <div style="font-weight: 800; color: var(--slate-700); font-size: 14px;">Supply vs Consumption Trends</div>
                                <div style="display: flex; gap: 16px;">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--indigo-500);"></span>
                                        <span style="font-size: 10px; font-weight: 700; color: var(--slate-500);">Supply</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span style="width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--indigo-300);"></span>
                                        <span style="font-size: 10px; font-weight: 700; color: var(--slate-500);">Burn</span>
                                    </div>
                                </div>
                            </div>
                            <div style="height: 200px; position: relative;">
                                <canvas id="pl-portfolio-chart"></canvas>
                            </div>
                        </div>

                        <!-- Integrated Conflict Status -->
                        ${this.conflicts.length > 0 ? `
                            <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 24px; display: flex; align-items: center; gap: 20px;">
                                <div style="width: 48px; height: 48px; background: #fee2e2; color: #ef4444; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                    <i class="fas fa-triangle-exclamation"></i>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-size: 15px; font-weight: 800; color: #b91c1c;">${this.conflicts.length} Resource Conflicts Flagged</div>
                                    <div style="font-size: 12px; color: #ef4444; font-weight: 600; opacity: 0.8;">Automated resolution logic active. Click to review allocation changes.</div>
                                </div>
                                <button class="btn" style="background: #ef4444; color: white; border: none; font-size: 12px; font-weight: 800; padding: 12px 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">Review Conflicts</button>
                            </div>
                        ` : `
                            <div style="background: #f0fdf4; border: 1px solid #dcfce7; padding: 20px; border-radius: 24px; display: flex; align-items: center; gap: 20px;">
                                <div style="width: 48px; height: 48px; background: #dcfce7; color: #16a34a; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                    <i class="fas fa-shield-check"></i>
                                </div>
                                <div>
                                    <div style="font-size: 15px; font-weight: 800; color: #166534;">All Systems Optimized</div>
                                    <div style="font-size: 12px; color: #16a34a; font-weight: 600; opacity: 0.8;">Predictive analysis reports zero concurrent asset requests or logistical bottlenecks.</div>
                                </div>
                            </div>
                        `}
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <div style="padding: 24px; background: white; border: 1px solid var(--slate-200); border-radius: 24px; flex: 1; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; margin-bottom: 20px; display: flex; justify-content: space-between;">
                                <span>Silo Capacity Overview</span>
                                <span>Global Total</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 20px;">
                                ${Object.entries(this.inventory).slice(0, 4).map(([key, item]) => {
                                    const percent = Math.min(100, (item.qty / (item.thresh * 2)) * 100);
                                    return `
                                        <div>
                                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
                                                <span style="font-weight: 700; color: var(--slate-700);">${item.materialName}</span>
                                                <span style="color: var(--slate-900); font-weight: 800;">${item.qty.toLocaleString()} <span style="font-size: 10px; color: var(--slate-400);">${item.unit}</span></span>
                                            </div>
                                            <div style="height: 8px; background: var(--slate-100); border-radius: 4px; overflow: hidden;">
                                                <div style="width: ${percent}%; height: 100%; background: ${percent < 20 ? '#ef4444' : 'var(--indigo-500)'}; border-radius: 4px;"></div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div style="padding: 20px; background: white; border: 1px solid var(--slate-200); border-radius: 20px; text-align: center; box-shadow: var(--shadow-sm);">
                                <div style="font-size: 10px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; margin-bottom: 6px;">Lead Time</div>
                                <div style="font-size: 18px; font-weight: 900; color: var(--slate-900);">1.2 <span style="font-size: 11px; color: var(--slate-400);">Days</span></div>
                            </div>
                            <div style="padding: 20px; background: white; border: 1px solid var(--slate-200); border-radius: 20px; text-align: center; box-shadow: var(--shadow-sm);">
                                <div style="font-size: 10px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; margin-bottom: 6px;">Accuracy</div>
                                <div style="font-size: 18px; font-weight: 900; color: #16a34a;">98.4%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    initCharts() {
        if (this.currentView !== 'dashboard') return;
        this.initPortfolioCharts?.();
    },

    initPortfolioCharts() {
        requestAnimationFrame(() => {
            const ctx = document.getElementById('pl-portfolio-chart');
            if (!ctx || typeof Chart === 'undefined') return;

            if (this.portfolioChartInstance) this.portfolioChartInstance.destroy();

            this.portfolioChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
                    datasets: [
                        {
                            label: 'Fulfillment',
                            data: [65, 78, 72, 85, 80, 92],
                            borderColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.05)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointRadius: 4,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#6366f1',
                            pointBorderWidth: 2
                        },
                        {
                            label: 'Consumption',
                            data: [45, 52, 60, 58, 65, 70],
                            borderColor: '#94a3b8',
                            backgroundColor: 'transparent',
                            tension: 0.4,
                            borderWidth: 2,
                            borderDash: [5, 5],
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { 
                            display: true,
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.03)', drawBorder: false },
                            ticks: { font: { size: 10 }, color: '#94a3b8' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { 
                                font: { size: 10, weight: '700' }, 
                                color: '#94a3b8' 
                            }
                        }
                    }
                }
            });
        });
    }
};
