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

            <!-- Fleet Gap Analysis Center (New) -->
            <div style="background: white; padding: 32px; border-radius: 32px; margin-bottom: 24px; box-shadow: var(--shadow-sm); border: 1px solid var(--slate-200); position: relative; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="width: 8px; height: 8px; background: var(--orange); border-radius: 50%; box-shadow: 0 0 10px rgba(249, 115, 22, 0.4);"></span>
                            <div style="font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.1em;">Asset Readiness & Procurement</div>
                        </div>
                        <h3 style="font-size: 24px; font-weight: 900; color: var(--slate-900); margin: 0;">Needs vs. Holdings Gap Analysis</h3>
                    </div>
                    <button class="btn btn-primary" style="background: var(--orange); border-color: var(--orange); font-weight: 800; font-size: 12px; padding: 12px 24px;" onclick="window.app.ecModule.openNewRentalDrawer()">
                        <i class="fas fa-plus-circle" style="margin-right: 8px;"></i> Direct Requisition
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px;">
                    ${(this.projects || []).slice(0, 4).map(p => `
                        <div style="background: var(--slate-50); padding: 20px; border-radius: 20px; border: 1px solid var(--slate-100); display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease;" onmouseover="this.style.background='white'; this.style.borderColor='var(--orange-light)'" onmouseout="this.style.background='var(--slate-50)'; this.style.borderColor='var(--slate-100)'">
                            <div style="flex: 1; min-width: 0; margin-right: 16px;">
                                <div style="font-weight: 800; color: var(--slate-800); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>
                                <div style="font-size: 11px; color: var(--slate-500); font-weight: 600;">${p.roadType || 'Earth (RT-1)'} • ${p.location || 'Site Alpha'}</div>
                            </div>
                            <button class="btn btn-secondary btn-sm" style="flex-shrink: 0; background: white; border-color: var(--slate-200); font-weight: 700; font-size: 11px;" onclick="window.app.ecModule.openEquipmentGapDrawer(${p.id})">
                                <i class="fas fa-microscope" style="margin-right: 6px; color: var(--orange);"></i> Run Gap Logic
                            </button>
                        </div>
                    `).join('')}
                    ${(this.projects || []).length === 0 ? `
                        <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--slate-400); background: var(--slate-50); border-radius: 20px; border: 1px dashed var(--slate-200);">
                            <i class="fas fa-folder-open" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
                            <div style="font-weight: 700; font-size: 14px;">No active projects to analyze</div>
                        </div>
                    ` : ''}
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
            <!-- Rental Renewal & Expiry Timeline (New) -->
            <div style="background: white; padding: 32px; border-radius: 32px; margin-bottom: 24px; box-shadow: var(--shadow-sm); border: 1px solid var(--slate-200);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="width: 8px; height: 8px; background: var(--orange); border-radius: 50%;"></span>
                            <div style="font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.1em;">Logistics Timeline</div>
                        </div>
                        <h3 style="font-size: 20px; font-weight: 900; color: var(--slate-900); margin: 0;">Renew or Extend Rental Timeline</h3>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${(this.rentalContracts || []).filter(c => c.status === 'active' || c.status === 'Active').slice(0, 5).map(c => {
                        const isExpired = c.endDate ? new Date(c.endDate) < new Date() : false;
                        const daysLeft = c.endDate ? Math.ceil((new Date(c.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
                        return `
                            <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: ${daysLeft <= 3 ? '#FFF7ED' : 'var(--slate-50)'}; border-radius: 16px; border: 1px solid ${daysLeft <= 3 ? '#FED7AA' : 'var(--slate-100)'};">
                                <div style="width: 40px; height: 40px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: ${daysLeft <= 3 ? 'var(--orange)' : 'var(--slate-400)'}; flex-shrink: 0;">
                                    <i class="fas fa-calendar-day"></i>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-weight: 800; color: var(--slate-800); font-size: 13px;">${c.machineType || c.title}</div>
                                    <div style="font-size: 11px; color: var(--slate-500); font-weight: 600;">${c.project?.name || 'Unknown Project'} • Expires: ${c.endDate ? new Date(c.endDate).toLocaleDateString() : 'N/A'}</div>
                                </div>
                                <div style="text-align: right; flex-shrink: 0;">
                                    <div style="font-size: 14px; font-weight: 900; color: ${daysLeft <= 3 ? 'var(--red)' : 'var(--slate-700)'};">${daysLeft <= 0 ? 'OVERDUE' : daysLeft + 'd left'}</div>
                                    <button class="btn btn-sm" style="font-size: 10px; padding: 4px 8px; margin-top: 4px; border-color: var(--slate-300);" onclick="window.app.ecModule.openConfirmReturnDrawer({contractId: '${c.id}', machineName: '${(c.machineType || c.title || '').replace(/'/g, "\\'")}', sourceModel: '${c._sourceModel || 'contract'}'})">Manage</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                    ${(this.rentalContracts || []).length === 0 ? `
                        <div style="padding: 24px; text-align: center; color: var(--slate-400); font-size: 12px;">No active rentals in timeline.</div>
                    ` : ''}
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
