import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';
import requisitions from '../../../src/api/requisitions.api.js';

export const FD_Dashboard = {
    getDashboardView() {
        setTimeout(() => this.loadDashboardData(), 0);
        const s = this.data.stats;
        return `
            <div class="stats-grid">
                ${StatCard({ title: 'Available Funds', value: this.formatCurrency(s.available), subtext: 'Total across all projects', alertColor: 'emerald' })}
                ${StatCard({ title: 'Committed', value: this.formatCurrency(s.committed), subtext: 'In active vendor contracts', alertColor: 'blue' })}
                ${StatCard({ title: 'EC Requests', value: s.ecRequests, subtext: 'Awaiting stock procurement', alertColor: 'orange' })}
                ${StatCard({ title: 'PM Uplifts', value: s.pmUplifts, subtext: 'Pending additional funding', alertColor: 'red' })}
                <div class="stat-card" style="border-left: 4px solid var(--orange); background: linear-gradient(to bottom right, #fff, #fff9f5);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="font-size: 11px; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">Est. Monthly Burn</div>
                        <i class="fas fa-fire-flame-curved" style="color: var(--orange); font-size: 14px; opacity: 0.5;"></i>
                    </div>
                    <div style="font-size: 26px; font-weight: 900; color: var(--slate-900); letter-spacing: -0.02em;">${this.formatCurrency(s.committed * 0.12)}</div>
                    <div style="display:flex; align-items:center; gap:6px; margin-top:10px;">
                        <span style="background: var(--red-light); color: var(--red); padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-arrow-trend-up"></i> +8.2%
                        </span>
                        <span style="font-size: 11px; color: var(--slate-500); font-weight: 500;">vs last month</span>
                    </div>
                </div>

                <div class="stat-card" style="border-left: 4px solid var(--emerald); background: linear-gradient(to bottom right, #fff, #f6fdf9);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="font-size: 11px; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">Cash Runway</div>
                        <i class="fas fa-hourglass-half" style="color: var(--emerald); font-size: 14px; opacity: 0.5;"></i>
                    </div>
                    <div style="font-size: 26px; font-weight: 900; color: var(--slate-900); letter-spacing: -0.02em;">${s.committed > 0 ? (s.available / (s.committed * 0.12)).toFixed(1) : '∞'} <span style="font-size: 14px; font-weight: 700; color: var(--slate-400);">Mo</span></div>
                    <div style="display:flex; align-items:center; gap:6px; margin-top:10px;">
                        <span style="background: var(--emerald-light); color: var(--emerald); padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-shield-check"></i> STABLE
                        </span>
                        <span style="font-size: 11px; color: var(--slate-500); font-weight: 500;">Operating liquidity</span>
                    </div>
                </div>
            </div>

            <div id="fm-projects-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 24px; margin-top: 24px;">
                <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400);">
                    <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                    <div>Loading project budgets...</div>
                </div>
            </div>

            <div class="data-card" style="margin-top: 24px;">
                <div class="data-card-header">
                    <div class="card-title">Pending Resource Requisitions (EC Forwarded)</div>
                    <button class="btn btn-secondary" onclick="window.toast?.show('Opening Approvals...', 'info'); (window.fmModule || window.app?.fmModule)?.switchView('approvals')">Process All</button>
                </div>
                <div id="fm-pending-reqs-table">
                    <div style="padding: 24px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin"></i> Loading...</div>
                </div>
            </div>
        `;
    },

    async loadDashboardData() {
        try {
            const [budgetRes, pendingReqs, pendingReps, projectsRes, bcrRes] = await Promise.all([
                client.get('/reports/finance/budget'),
                requisitions.getPending(),
                client.get('/replenishment/pending'),
                client.get('/projects?limit=50'),
                client.get('/budget-changes').catch(() => ({ data: [] }))
            ]);

            const budget = budgetRes.data || {};
            const reqs = Array.isArray(pendingReqs) ? pendingReqs : (pendingReqs.data || []);
            const reps = Array.isArray(pendingReps) ? pendingReps : (pendingReps.data || []);
            
            // Unified list
            const mappedReps = reps.map(r => ({
                ...r,
                isReplenishment: true,
                totalAmount: r.estimatedCost || 0,
                submitter: r.requester,
                items: [{ itemName: r.materialName, quantity: r.quantityNeeded }]
            }));
            const allReqs = [...reqs, ...mappedReps].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            const projectsList = projectsRes.data?.projects || projectsRes.data || [];
            const bcrList = Array.isArray(bcrRes.data) ? bcrRes.data : (bcrRes.data?.items || []);

            this.data.projects = Array.isArray(projectsList) ? projectsList : [];
            this.data.requisitions = allReqs;
            this.data.stats = {
                available: (budget.totalBudget || 0) - (budget.totalSpent || 0),
                committed: budget.totalSpent || 0,
                ecRequests: allReqs.length,
                pmUplifts: bcrList.filter(b => b.status === 'Pending').length
            };

            // Re-render stats
            if (this.currentView === 'dashboard') {
                const container = document.getElementById('finance-module');
                if (container) {
                    const content = document.getElementById('finance-content-area');
                    if (content) content.innerHTML = this.getCurrentViewHTML();
                }
            }

            // Render dynamic project cards
            this._renderProjectCards();
            // Render pending requisitions on dashboard
            this._renderDashboardReqs(allReqs);
        } catch (error) {
            console.error('Failed to load finance stats:', error);
        }
    },

    _renderProjectCards() {
        const grid = document.getElementById('fm-projects-grid');
        if (!grid || this.data.projects.length === 0) {
            if (grid) grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-building" style="font-size: 32px; margin-bottom: 12px;"></i><div style="font-weight: 600;">No projects found</div></div>`;
            return;
        }

        grid.innerHTML = this.data.projects.slice(0, 6).map(project => {
            const budgetTotal = Number(project.budgetTotal) || 0;
            const budgetSpent = Number(project.budgetSpent) || 0;
            const remaining = budgetTotal - budgetSpent;
            const utilPct = budgetTotal > 0 ? Math.round((budgetSpent / budgetTotal) * 100) : 0;
            const isCritical = utilPct >= 85;
            const statusLabel = isCritical ? 'Critical' : project.status === 'active' ? 'On Track' : (project.status || 'Planning');
            const statusClass = isCritical ? 'delayed' : 'active';
            const barColor = isCritical ? 'var(--red)' : 'var(--blue)';

            return `
                <div class="data-card project-card-fd" style="transition: all 0.2s ease; cursor: pointer; position: relative; overflow: hidden;">
                    <div style="padding: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                            <div style="max-width: 70%;">
                                <div style="font-size: 10px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">${project.code}</div>
                                <h3 style="font-size: 18px; font-weight: 800; color: var(--slate-900); margin: 0; line-height: 1.2;">${project.name}</h3>
                                <div style="font-size: 12px; color: var(--slate-500); margin-top: 6px; display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-tag" style="font-size: 10px;"></i>
                                    <span>${project.projectType ? project.projectType.replace(/_/g, ' ') : 'Construction'}</span>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <span class="status ${statusClass}" style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 10px; text-transform: uppercase;">
                                    ${statusLabel}
                                </span>
                                <div style="font-size: 20px; font-weight: 900; color: var(--slate-900); margin-top: 8px; font-family: 'JetBrains Mono', monospace;">${utilPct}%</div>
                            </div>
                        </div>

                        <div style="margin-bottom: 8px;">
                            <div style="height: 8px; background: var(--slate-100); border-radius: 4px; overflow: hidden; display: flex;">
                                <div style="width: ${Math.min(utilPct, 100)}%; background: ${barColor}; height: 100%; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);" title="Spent: ${utilPct}%"></div>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                            <div>
                                <div style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase; margin-bottom: 4px;">Total Spent</div>
                                <div style="font-size: 14px; font-weight: 800; color: var(--slate-800); font-family: 'JetBrains Mono', monospace;">${this.formatCurrency(budgetSpent)}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase; margin-bottom: 4px;">Remaining Funds</div>
                                <div style="font-size: 14px; font-weight: 800; color: ${isCritical ? 'var(--red)' : 'var(--emerald)'}; font-family: 'JetBrains Mono', monospace;">${this.formatCurrency(remaining)} <span style="font-size: 10px; font-weight: 700;">MWK</span></div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: ${barColor}; opacity: 0.3;"></div>
                </div>
            `;
        }).join('');
    },

    _renderDashboardReqs(reqs) {
        const container = document.getElementById('fm-pending-reqs-table');
        if (!container) return;

        const reqsList = Array.isArray(reqs) ? reqs : [];
        if (reqsList.length === 0) {
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--slate-400);"><i class="fas fa-check-circle" style="color: var(--emerald); margin-right: 8px;"></i>No pending requisitions</div>`;
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr><th>ID</th><th>Project</th><th>Material Items</th><th>Requested By</th><th>Amount (MWK)</th><th>Status</th></tr>
                </thead>
                <tbody>
                    ${reqsList.slice(0, 5).map(req => {
                        const items = req.items || [];
                        const desc = items.length ? items.map(i => `${i.itemName} x ${i.quantity}`).join(', ') : 'Resources';
                        return `
                            <tr onclick="window.toast?.show('Opening Review...', 'info'); (window.fmModule || window.app?.fmModule)?.openRequisitionReview('${req.id}', ${req.isReplenishment ? 'true' : 'false'})">
                                <td>
                                    <span class="project-id">${req.reqCode || 'REQ-' + req.id}</span>
                                    ${req.isReplenishment ? '<span class="badge badge-primary" style="font-size: 9px; margin-left: 4px; background: var(--blue-light); color: var(--blue);">Stock</span>' : ''}
                                </td>
                                <td style="font-weight: 600;">${req.project?.name || req.project?.code || 'Project'}</td>
                                <td>${desc}</td>
                                <td>${req.submitter?.name || 'Field'}</td>
                                <td style="font-family: 'JetBrains Mono'; font-weight: 700;">${Number(req.totalAmount || 0).toLocaleString()}</td>
                                <td><span class="status locked" style="background: var(--orange-light); color: var(--orange);">${(req.status || 'PENDING').toUpperCase()}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    handleGenerateReport() {
        const type = document.getElementById('report_type')?.value;
        const project = document.getElementById('report_project')?.value;
        const format = document.querySelector('input[name="report_fmt"]:checked')?.value;

        window.toast.show(`Generating detailed ${type.toUpperCase()} report in ${format.toUpperCase()} format...`, 'info');
        
        setTimeout(() => {
            window.toast.show('Report generation complete. Downloading...', 'success');
            window.drawer.close();
        }, 1500);
    },

    formatCurrency(val) {
        if (val === undefined || val === null || isNaN(val)) return '0';
        if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'B';
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        return Number(val).toLocaleString();
    }
};
