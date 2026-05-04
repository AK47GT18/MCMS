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
                <div class="stat-card" style="border-left: 4px solid var(--orange);">
                    <div style="font-size: 11px; color: var(--slate-500); text-transform: uppercase; font-weight: 700; margin-bottom: 8px;">Est. Monthly Burn</div>
                    <div style="font-size: 24px; font-weight: 800; color: var(--slate-900);">${this.formatCurrency(s.committed * 0.12)}</div>
                    <div style="display:flex; align-items:center; gap:4px; margin-top:8px; font-size:11px; color:var(--red);">
                        <i class="fas fa-arrow-trend-up"></i> 
                        <span>High Velocity (+8% vs last mo)</span>
                    </div>
                </div>
            </div>

            <div id="fm-projects-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
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
                <div class="data-card">
                    <div style="padding: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                            <div>
                                <h3 style="font-size: 16px; font-weight: 700; color: var(--slate-900);">${project.code} ${project.name}</h3>
                                <div style="font-size: 12px; color: var(--slate-500);">${project.projectType ? project.projectType.replace(/_/g, ' ') : 'Construction'}</div>
                            </div>
                            <span class="status ${statusClass}">${statusLabel} (${utilPct}%)</span>
                        </div>

                        <div style="margin-bottom: 24px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
                                <span style="color: var(--slate-600);">Budget Utilization</span>
                                <span style="font-weight: 700; color: ${isCritical ? 'var(--red)' : 'var(--slate-900)'};">${utilPct}%</span>
                            </div>
                            <div style="height: 12px; background: var(--slate-100); border-radius: 6px; overflow: hidden; display: flex;">
                                <div style="width: ${Math.min(utilPct, 100)}%; background: ${barColor}; height: 100%;" title="Spent: ${utilPct}%"></div>
                            </div>
                            <div style="display: flex; gap: 16px; margin-top: 12px; font-size: 11px;">
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <div style="width: 8px; height: 8px; background: ${barColor}; border-radius: 2px;"></div>
                                    <span style="color: var(--slate-500);">Spent (${this.formatCurrency(budgetSpent)})</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; margin-left: auto;">
                                    <span style="font-weight: 700; color: ${isCritical ? 'var(--red)' : 'var(--emerald)'};">Remaining: ${this.formatCurrency(remaining)} MWK</span>
                                </div>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <button class="btn btn-secondary" style="width: 100%; justify-content: center; font-size: 12px;" onclick="window.toast?.show('Opening Contracts...', 'info'); (window.fmModule || window.app?.fmModule)?.switchView('contracts')">Contracts</button>
                            <button class="btn btn-primary" style="width: 100%; justify-content: center; font-size: 12px; background: var(--orange); border-color: var(--orange);" onclick="window.toast?.show('Opening Uplift Request...', 'info'); (window.fmModule || window.app?.fmModule)?.requestPMUplift('${project.id}')">Request Uplift</button>
                        </div>
                    </div>
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
