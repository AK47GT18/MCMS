import { StatCard } from '../ui/StatCard.js';
import { notificationService } from '../../src/services/notifications.service.js';
import client from '../../src/api/client.js';
import projects from '../../src/api/projects.api.js';
import requisitions from '../../src/api/requisitions.api.js';
import contracts from '../../src/api/contracts.api.js';


export class FinanceDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.data = {
            stats: { available: 0, committed: 0, ecRequests: 0, pmUplifts: 0 },
            projects: [],

            requisitions: [],
            budgetChanges: []
        };
        
        // Register this module globally
        window.app = window.app || {};
        window.app.fmModule = this;
    }

    render() {
        return this.getTemplate();
    }

    getTemplate() {
        return `
            <div id="finance-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content" id="finance-content-area">
                    ${this.getCurrentViewHTML()}
                </div>
            </div>
        `;
    }

    // --- SUB-VIEWS ---

    getCurrentViewHTML() {
        switch(this.currentView) {
            case 'dashboard': return this.getDashboardView();
            case 'procurement': return this.getProcurementView();
            case 'approvals': return this.getResourceApprovalsView();
            case 'contracts': return this.getContractsView();
            case 'vendors': return this.getVendorsView();
            case 'bcr': return this.getBudgetControlView();
            case 'reports': return this.getRecordsView();
            default: return this.getPlaceholderView(this.currentView);
        }
    }

    getDashboardView() {
        setTimeout(() => this.loadDashboardData(), 0);
        const s = this.data.stats;
        return `
            <div class="stats-grid">
                ${StatCard({ title: 'Available Funds', value: this.formatCurrency(s.available), subtext: 'Total across all projects', alertColor: 'emerald' })}
                ${StatCard({ title: 'Committed', value: this.formatCurrency(s.committed), subtext: 'In active vendor contracts', alertColor: 'blue' })}
                ${StatCard({ title: 'EC Requests', value: s.ecRequests, subtext: 'Awaiting stock procurement', alertColor: 'orange' })}
                ${StatCard({ title: 'PM Uplifts', value: s.pmUplifts, subtext: 'Pending additional funding', alertColor: 'red' })}
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
                    <button class="btn btn-secondary" onclick="window.app.fmModule?.switchView('approvals')">Process All</button>
                </div>
                <div id="fm-pending-reqs-table">
                    <div style="padding: 24px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin"></i> Loading...</div>
                </div>
            </div>
        `;
    }

    getProcurementView() {
        setTimeout(() => this.loadProcurementData(), 0);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Project Procurement Status</div>
                    <div style="display:flex; gap:8px;">
                        <select id="procurement_project_select" class="form-input" style="width: 250px;" onchange="window.app.fmModule.loadProcurementData()">
                            <option value="">Select Project...</option>
                        </select>
                        <button class="btn btn-primary" onclick="window.drawer.open('Create Vendor Contract', window.DrawerTemplates.newContract); setTimeout(() => { window.app.fmModule?.loadContractProjects(); window.app.fmModule?.initContractUpload(); }, 100)"><i class="fas fa-file-contract"></i> Procure Materials</button>
                    </div>
                </div>
                <div id="fm-procurement-content">
                    <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                        <i class="fas fa-box-open" style="font-size: 32px; margin-bottom: 12px;"></i>
                        <div>Select a project to view its material requirements and procurement status.</div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadProcurementData() {
        // Load projects if not loaded
        const select = document.getElementById('procurement_project_select');
        if (select && select.options.length <= 1) {
            try {
                const res = await client.get('/projects?status=active');
                const projects = res.data?.data || res.data || [];
                projects.forEach(p => {
                    select.add(new Option(p.name, p.id));
                });
            } catch (e) { console.error('Failed to load projects', e); }
        }

        const projectId = select?.value;
        const container = document.getElementById('fm-procurement-content');
        if (!projectId || !container) return;

        container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin"></i> Loading procurement status...</div>`;

        try {
            const res = await client.get(`/procurement/project-status/${projectId}`);
            const data = res.data;
            
            if (!data.materials || data.materials.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);">No materials required for this project's current phase.</div>`;
                return;
            }

            const rows = data.materials.map(m => `
                <tr>
                    <td style="font-weight: 600;">${m.materialName}</td>
                    <td style="text-align: right;">${Number(m.requiredQuantity).toLocaleString()} ${m.unit}</td>
                    <td style="text-align: right; color: var(--emerald);">${Number(m.procuredQuantity).toLocaleString()} ${m.unit}</td>
                    <td style="text-align: right; color: ${m.remainingQuantity > 0 ? 'var(--red)' : 'var(--slate-500)'};">${Number(m.remainingQuantity).toLocaleString()} ${m.unit}</td>
                    <td style="width: 200px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="flex:1; height:8px; background:var(--slate-200); border-radius:4px; overflow:hidden;">
                                <div style="height:100%; width:${m.percentComplete}%; background: ${m.percentComplete >= 100 ? 'var(--emerald)' : 'var(--orange)'};"></div>
                            </div>
                            <span style="font-size:11px; font-weight:600; width:40px;">${m.percentComplete}%</span>
                        </div>
                    </td>
                </tr>
            `).join('');

            container.innerHTML = `
                <div style="padding: 16px; background: var(--slate-50); border-bottom: 1px solid var(--border); display: flex; gap: 24px;">
                    <div>
                        <div style="font-size: 11px; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">Active Contracts</div>
                        <div style="font-size: 18px; font-weight: 800;">${data.totalContracts}</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Material</th>
                            <th style="text-align: right;">Required (Budget)</th>
                            <th style="text-align: right;">Procured</th>
                            <th style="text-align: right;">Remaining</th>
                            <th>Fulfillment Progress</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        } catch (error) {
            console.error('Failed to load procurement status:', error);
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">${error.response?.data?.message || error.message}</div>`;
        }
    }

    getResourceApprovalsView() {
        setTimeout(() => this.loadPendingRequisitions(), 0);
        return `
            <div class="data-card">
               <div class="data-card-header">
                  <div class="card-title">Resource Requisition Queue (EC Forwarded)</div>
                  <div style="display:flex; gap:8px;">
                     <button class="btn btn-secondary"><i class="fas fa-filter"></i> Filters</button>
                     <button class="btn btn-primary" onclick="window.toast.show('Processing batch...', 'info')">Bulk Approve</button>
                  </div>
               </div>
               <div id="fm-approvals-table">
                   <div style="padding: 24px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin"></i> Loading requisitions...</div>
               </div>
            </div>
        `;
    }

    getBudgetControlView() {
        setTimeout(() => this.loadBudgetChanges(), 0);
        return `
            <div class="data-card">
               <div class="data-card-header">
                  <div class="card-title">PM Budget Uplift Requests</div>
                  <button class="btn btn-action" onclick="window.drawer.open('Initiate Budget Uplift', window.DrawerTemplates.initiateBCR)"><i class="fas fa-plus"></i> New Request</button>
               </div>
               <div id="fm-bcr-table">
                   <div style="padding: 24px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin"></i> Loading uplift requests...</div>
               </div>
            </div>
        `;
    }

    getRecordsView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Generated Reports</div>
                </div>
                <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                    <a href="/api/v1/reports/finance/budget?format=pdf" target="_blank" class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px; text-decoration: none;">
                        <i class="fas fa-file-pdf" style="color: var(--red);"></i> Budget Overview (PDF)
                    </a>
                    <a href="/api/v1/reports/finance/requisitions?format=pdf" target="_blank" class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px; text-decoration: none;">
                        <i class="fas fa-file-pdf" style="color: var(--red);"></i> Requisition Analysis (PDF)
                    </a>
                    <a href="/api/v1/reports/finance/top-vendors?format=csv" target="_blank" class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px; text-decoration: none;">
                        <i class="fas fa-file-excel" style="color: var(--emerald);"></i> Top Vendors (CSV)
                    </a>
                    <a href="/api/v1/reports/finance/spend-categories?format=pdf" target="_blank" class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px; text-decoration: none;">
                        <i class="fas fa-file-pdf" style="color: var(--red);"></i> Spend Categories (PDF)
                    </a>
                    <button class="btn btn-primary" style="margin-top: 12px; justify-content: center;" onclick="window.drawer.open('Report Generator', window.DrawerTemplates.reportGenerator)">
                        Custom Report
                    </button>
                </div>
            </div>
        `;
    }

    getVendorsView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Vendor Registry</div>
                    <button class="btn btn-primary" onclick="window.toast.show('Onboarding drawer coming soon', 'info')"><i class="fas fa-plus"></i> Add Vendor</button>
                </div>
                <table>
                   <thead>
                      <tr><th>Vendor Name</th><th>Category</th><th>Risk Level</th><th>Active Contracts</th><th>Rating</th></tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td style="font-weight: 600;">Malawi Cement Ltd</td>
                         <td>Basic Materials</td>
                         <td><span class="status active" style="background:#f0fdf4; color:var(--emerald);">Low</span></td>
                         <td style="text-align: center;">4</td>
                         <td style="color: #FBBF24;"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i></td>
                      </tr>
                      <tr>
                         <td style="font-weight: 600;">Steel Masters MW</td>
                         <td>Structural</td>
                         <td><span class="status active" style="background:#f0fdf4; color:var(--emerald);">Low</span></td>
                         <td style="text-align: center;">2</td>
                         <td style="color: #FBBF24;"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="far fa-star"></i></td>
                      </tr>
                   </tbody>
                </table>
            </div>
        `;
    }

    getContractsView() {
        // Trigger async load
        setTimeout(() => this.loadContractsFromAPI(), 0);
        
        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Vendor Contracts</div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-secondary"><i class="fas fa-filter"></i> Filters</button>
                    <button class="btn btn-primary" style="background: var(--orange); border-color: var(--orange);" onclick="window.drawer.open('Create Vendor Contract', window.DrawerTemplates.newContract); setTimeout(() => { window.app.fmModule?.loadContractProjects(); window.app.fmModule?.initContractUpload(); }, 100)"><i class="fas fa-plus"></i> New Contract</button>
                </div>
              </div>
              <div id="contracts-table-container">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400);">
                    <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                    <div>Loading contracts...</div>
                </div>
              </div>
            </div>
        `;
    }

    getPlaceholderView(title) {
        return `<div class="data-card"><div class="data-card-header"><div class="card-title">${title.charAt(0).toUpperCase() + title.slice(1)}</div></div><div style="padding: 24px;">Content for ${title} coming soon.</div></div>`;
    }

    getHeaderHTML() {
        const headers = {
            'dashboard': { title: 'Budget Dashboard', context: 'Strategic Health & Overruns' },
            'procurement': { title: 'Procurement Dashboard', context: 'Material Pipeline Tracking' },
            'approvals': { title: 'Resource Hub', context: 'Procurement Gatekeeping' },
            'contracts': { title: 'Vendor Contracts', context: 'Milestones & Commitments' },
            'vendors': { title: 'Vendor Registry', context: 'Compliance & Performance' },
            'bcr': { title: 'PM Uplift Requests', context: 'Budget Extensions' },

            'reports': { title: 'Records Center', context: 'Reporting & Compliance' }
        };

        const current = headers[this.currentView] || { title: this.currentView, context: '' };

        return `
             <div class="page-header">
                <div class="page-title-row">
                    <div>
                        <h1 class="page-title">${current.title}</h1>
                        <div class="context-strip">
                            <span class="context-value">${current.context}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- WORKFLOW HANDLERS ---

    async handleRequisitionAction(reqId, status) {
        const note = document.getElementById('requisition_note')?.value;
        if (!note || note.trim().length < 5) {
            window.toast.show('Please provide a descriptive note (min 5 chars).', 'warning');
            return;
        }

        try {
            window.toast.show(`Processing resource ${status}...`, 'info');
            
            // Trigger simulated email notification
            await notificationService.notifyRequisitionStatus(reqId, status, note);
            
            window.toast.show(`Requisition ${reqId} has been ${status} successfully.`, 'success');
            window.drawer.close();
            this.switchView(this.currentView);
        } catch (error) {
            console.error('Workflow error:', error);
            window.toast.show('Failed to process requisition action.', 'error');
        }
    }

    async handleSubmitUplift() {
        const project = document.getElementById('bcr_project')?.value;
        const amount = document.getElementById('bcr_amount')?.value;
        const reason = document.getElementById('bcr_reason')?.value;

        if (!amount || parseFloat(amount) <= 0) {
            window.toast.show('Please enter a valid amount.', 'warning');
            return;
        }
        if (!reason || reason.trim().length < 10) {
            window.toast.show('Please provide a detailed justification (min 10 chars).', 'warning');
            return;
        }

        try {
            window.toast.show('Submitting uplift request to PM...', 'info');
            
            // Trigger simulated email notification to PM
            const projectCode = project === '1' ? 'CEN-01' : 'MZ-05';
            await notificationService.notifyProjectManagerUplift(projectCode, parseFloat(amount), reason);
            
            window.toast.show('Uplift request sent to Project Manager successfully.', 'success');
            window.drawer.close();
        } catch (error) {
            console.error('Uplift error:', error);
            window.toast.show('Failed to submit uplift request.', 'error');
        }
    }

    // =============================================
    // DATA LOADERS (API-BACKED)
    // =============================================

    async loadDashboardData() {
        try {
            const [budgetRes, pendingReqs, projectsRes, bcrRes] = await Promise.all([
                client.get('/reports/finance/budget'),
                requisitions.getPending(),
                client.get('/projects?limit=50'),
                client.get('/budget-changes').catch(() => ({ data: [] }))
            ]);

            const budget = budgetRes.data || {};
            const reqs = pendingReqs.data || pendingReqs;
            const projectsList = projectsRes.data?.projects || projectsRes.data || [];
            const bcrList = Array.isArray(bcrRes.data) ? bcrRes.data : (bcrRes.data?.items || []);

            this.data.projects = Array.isArray(projectsList) ? projectsList : [];
            this.data.stats = {
                available: (budget.totalBudget || 0) - (budget.totalSpent || 0),
                committed: budget.totalSpent || 0,
                ecRequests: Array.isArray(reqs) ? reqs.length : 0,
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
            this._renderDashboardReqs(reqs);
        } catch (error) {
            console.error('Failed to load finance stats:', error);
        }
    }

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
                            <button class="btn btn-secondary" style="width: 100%; justify-content: center; font-size: 12px;" onclick="window.app.fmModule?.loadContractsView()">Contracts</button>
                            <button class="btn btn-primary" style="width: 100%; justify-content: center; font-size: 12px; background: var(--orange); border-color: var(--orange);" onclick="window.app.fmModule?.requestPMUplift('${project.code}')">Request Uplift</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

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
                            <tr onclick="window.drawer.open('Requisition Review', window.DrawerTemplates.requisitionReview('${req.reqCode || 'REQ-' + req.id}'))">
                                <td><span class="project-id">${req.reqCode || 'REQ-' + req.id}</span></td>
                                <td style="font-weight: 600;">${req.project?.name || req.project?.code || 'Project'}</td>
                                <td>${desc}</td>
                                <td>${req.submittedBy?.name || 'Field'} via EC</td>
                                <td style="font-family: 'JetBrains Mono'; font-weight: 700;">${Number(req.totalAmount || 0).toLocaleString()}</td>
                                <td><span class="status locked" style="background: var(--orange-light); color: var(--orange);">${(req.status || 'PENDING').toUpperCase()}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    async loadPendingRequisitions() {
        const container = document.getElementById('fm-approvals-table');
        if (!container) return;

        try {
            const result = await requisitions.getPending();
            const reqs = Array.isArray(result) ? result : (result.data || []);

            if (reqs.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-check-circle" style="font-size: 32px; margin-bottom: 12px; color: var(--emerald);"></i><div style="font-weight: 600;">No pending requisitions</div></div>`;
                return;
            }

            container.innerHTML = `
                <table>
                    <thead>
                        <tr><th>Req ID</th><th>Project</th><th>Material Items</th><th>Requested By</th><th style="text-align:right">Value (MWK)</th><th>Budget Check</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${reqs.map(req => {
                            const items = req.items || [];
                            const desc = items.length ? items.map(i => `${i.itemName} x ${i.quantity}`).join(', ') : 'Resources';
                            const totalAmt = Number(req.totalAmount || 0);
                            const projBudget = Number(req.project?.budgetTotal || 0);
                            const projSpent = Number(req.project?.budgetSpent || 0);
                            const remaining = projBudget - projSpent;
                            const isOverBudget = totalAmt > remaining && remaining > 0;
                            const isCritical = remaining < totalAmt * 0.5;

                            return `
                                <tr onclick="window.drawer.open('Requisition Review', window.DrawerTemplates.requisitionReview('${req.reqCode || 'REQ-' + req.id}'))">
                                    <td><span class="project-id">${req.reqCode || 'REQ-' + req.id}</span></td>
                                    <td>${req.project?.name || req.project?.code || 'Project'}</td>
                                    <td>${desc}</td>
                                    <td>${req.submittedBy?.name || 'Field'} via EC</td>
                                    <td style="text-align:right; font-family: 'JetBrains Mono'; font-weight: 700;">${totalAmt.toLocaleString()}</td>
                                    <td><span class="status ${isCritical ? 'delayed' : 'active'}" style="background: ${isCritical ? '#FEF2F2' : '#F0FDF4'}; color: ${isCritical ? 'var(--red)' : 'var(--emerald)'};">${isCritical ? 'Critical' : 'Healthy'} (${this.formatCurrency(remaining)} Rem)</span></td>
                                    <td>${isOverBudget
                                        ? `<button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;">Exceeds Budget</button>`
                                        : `<button class="btn btn-action" style="padding: 4px 8px; font-size: 11px;">Review & Approve</button>`
                                    }</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Failed to load requisitions:', error);
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">${error.message}</div>`;
        }
    }

    async loadBudgetChanges() {
        const container = document.getElementById('fm-bcr-table');
        if (!container) return;

        try {
            const token = localStorage.getItem('mcms_auth_token');
            const response = await fetch('/api/v1/budget-changes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load budget changes');
            const result = await response.json();
            const bcrList = Array.isArray(result.data) ? result.data : (result.items || result || []);

            if (bcrList.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-check-circle" style="font-size: 32px; margin-bottom: 12px; color: var(--emerald);"></i><div style="font-weight: 600;">No uplift requests</div></div>`;
                return;
            }

            container.innerHTML = `
                <table>
                    <thead>
                        <tr><th>Uplift ID</th><th>Project</th><th>Reason</th><th style="text-align:right">Current</th><th style="text-align:right">Requested</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        ${bcrList.map(bcr => {
                            const statusMap = { 'Pending': 'locked', 'Approved': 'active', 'Rejected': 'delayed' };
                            return `
                                <tr>
                                    <td><span class="project-id">BCR-${bcr.id}</span></td>
                                    <td>${bcr.project?.name || 'Project #' + bcr.projectId}</td>
                                    <td>${bcr.reason || 'No reason provided'}</td>
                                    <td style="text-align:right; font-family: 'JetBrains Mono';">${this.formatCurrency(Number(bcr.project?.budgetTotal || 0))}</td>
                                    <td style="text-align:right; font-family: 'JetBrains Mono';">+${this.formatCurrency(Number(bcr.amount || 0))}</td>
                                    <td><span class="status ${statusMap[bcr.status] || 'locked'}">${bcr.status || 'Pending'}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Failed to load budget changes:', error);
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">${error.message}</div>`;
        }
    }



    formatCurrency(val) {
        if (val === undefined || val === null || isNaN(val)) return '0';
        if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'B';
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        return Number(val).toLocaleString();
    }

    handleGenerateReport() {
        const type = document.getElementById('report_type')?.value;
        const project = document.getElementById('report_project')?.value;
        const format = document.querySelector('input[name="report_fmt"]:checked')?.value;

        window.toast.show(`Generating detailed ${type.toUpperCase()} report in ${format.toUpperCase()} format...`, 'info');
        
        setTimeout(() => {
            window.toast.show('Report generation complete. Downloading...', 'success');
            window.drawer.close();
        }, 1500);
    }

    switchView(view) {
        this.currentView = view;
        // Use the global app page loader for proper DOM re-injection
        if (window.app && typeof window.app.loadPage === 'function') {
            window.app.loadPage(view);
        } else {
            // Fallback: re-render into content area
            const content = document.getElementById('finance-content-area');
            if (content) content.innerHTML = this.getCurrentViewHTML();
        }
    }

    // --- CONTRACT HANDLERS ---

    async loadContractsFromAPI() {
        const container = document.getElementById('contracts-table-container');
        if (!container) return;

        try {
            const token = localStorage.getItem('mcms_auth_token');
            const response = await fetch('/api/v1/contracts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load contracts');
            const result = await response.json();
            const contracts = result.data || result.items || result || [];

            if (contracts.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-file-contract" style="font-size: 32px; margin-bottom: 12px;"></i><div>No contracts found.</div></div>`;
                return;
            }
            container.innerHTML = this.renderContractsTable(contracts);
        } catch (error) {
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">${error.message}</div>`;
        }
    }

    renderContractsTable(contracts) {
        // Store contracts for later lookup
        this._contractsMap = contracts;

        const formatValue = (v) => v ? (Number(v) / 1000000).toFixed(1) + 'M' : '-';
        const rows = contracts.map(c => `
            <tr>
                <td><span class="project-id">${c.refCode || 'CON-'+c.id}</span></td>
                <td style="font-weight:600;">${c.title}</td>
                <td>${c.vendorName || '-'}</td>
                <td style="font-family:'JetBrains Mono';">${formatValue(c.value)}</td>
                <td><span class="status active">${c.status || 'Active'}</span></td>
                <td><button class="btn btn-secondary" style="padding:4px 8px;" onclick="window.app.fmModule?.viewContract(${c.id})">View</button></td>
            </tr>
        `).join('');

        return `<table><thead><tr><th>Ref</th><th>Title</th><th>Vendor</th><th>Value</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    viewContract(id) {
        const contract = this._contractsMap?.find(c => c.id === id);
        if (contract) {
            window.drawer.open('Contract Details', window.DrawerTemplates.contractView(contract));
        } else {
            window.toast.show('Contract data not found locally.', 'error');
        }
    }

    async loadContractProjects() {
        const select = document.getElementById('contract_project');
        if (!select) return;
        try {
            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch('/api/v1/projects?status=active', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            const projects = result.data || result.items || [];
            select.innerHTML = '<option value="">Select a project...</option>' + projects.map(p => `<option value="${p.id}">${p.code} – ${p.name}</option>`).join('');
        } catch (err) { console.error(err); }
    }

    initContractUpload() {
        const dropZone = document.getElementById('contract-drop-zone');
        const fileInput = document.getElementById('contract_document');
        const status = document.getElementById('contract-file-status');
        if (!dropZone || !fileInput) return;
        dropZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            if (e.target.files[0]) {
                status.innerHTML = `<span style="color: var(--emerald); font-size: 12px;"><i class="fas fa-check-circle"></i> ${e.target.files[0].name}</span>`;
                dropZone.style.borderColor = 'var(--emerald)';
            }
        };
    }

    async onContractProjectSelected(projectId) {
        const list = document.getElementById('contract-materials-list');
        const section = document.getElementById('contract-materials-section');
        if (!list || !projectId) return;
        section.style.display = 'block';
        list.innerHTML = 'Loading materials...';
        try {
            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch(`/api/v1/projects/${projectId}/materials`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            const materials = result.data?.materials || result.materials || [];
            if (materials.length === 0) { list.innerHTML = 'No specifications found.'; return; }
            list.innerHTML = materials.map((m, i) => `
                <label style="display:flex; gap:10px; padding:10px; border-bottom:1px solid var(--slate-100); cursor:pointer;">
                    <input type="checkbox" name="contract_material" value="${i}" data-name="${m.name}" data-qty="${m.quantity}" data-unit="${m.unit}" data-cost="${m.totalCostHigh}">
                    <div style="font-size:12px;"><strong>${m.name}</strong><br><span style="color:var(--slate-500);">${m.quantity} ${m.unit}</span></div>
                </label>
            `).join('');
        } catch (err) { list.innerHTML = 'Error loading materials.'; }
    }

    async submitContract() {
        const data = {
            projectId: document.getElementById('contract_project')?.value,
            vendorName: document.getElementById('contract_vendor')?.value,
            title: document.getElementById('contract_title')?.value,
            value: parseFloat(document.getElementById('contract_value')?.value),
            startDate: document.getElementById('contract_start')?.value,
            endDate: document.getElementById('contract_end')?.value
        };
        const checkboxes = document.querySelectorAll('input[name="contract_material"]:checked');
        const materials = Array.from(checkboxes).map(cb => ({ name: cb.dataset.name, quantity: cb.dataset.qty, unit: cb.dataset.unit }));

        if (!data.projectId || !data.vendorName || !data.title || materials.length === 0) {
            window.toast.show('Please fill required fields and select materials', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch('/api/v1/contracts', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, materialsList: JSON.stringify(materials), refCode: 'CON-' + Date.now().toString(36).toUpperCase() })
            });
            if (!res.ok) throw new Error('System error creating contract');
            window.toast.show('Contract established successfully', 'success');
            window.drawer.close();
            if (this.currentView === 'contracts') this.loadContractsFromAPI();
        } catch (err) { window.toast.show(err.message, 'error'); }
    }

    requestPMUplift(projectId) {
        window.drawer.open(`Request Budget Uplift: ${projectId}`, window.DrawerTemplates.initiateBCR);
    }

    loadContractsView() {
        this.currentView = 'contracts';
        this.switchView('contracts');
    }
}
