import { StatCard } from '../ui/StatCard.js';
import { notificationService } from '../../src/services/notifications.service.js';

export class FinanceDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.data = {};
        
        // Register this module globally so Drawer templates can access its methods
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
            case 'approvals': return this.getResourceApprovalsView();
            case 'contracts': return this.getContractsView();
            case 'vendors': return this.getVendorsView();
            case 'bcr': return this.getBudgetControlView();
            case 'audit':
            case 'reports': return this.getRecordsView();
            default: return this.getPlaceholderView(this.currentView);
        }
    }

    getDashboardView() {
        return `
            <div class="stats-grid">
                ${StatCard({ title: 'Available Funds', value: '725.5M', subtext: 'Total across all projects', alertColor: 'emerald' })}
                ${StatCard({ title: 'Committed', value: '1.2B', subtext: 'In active vendor contracts', alertColor: 'blue' })}
                ${StatCard({ title: 'EC Requests', value: '8', subtext: 'Awaiting stock procurement', alertColor: 'orange' })}
                ${StatCard({ title: 'PM Uplifts', value: '2', subtext: 'Pending additional funding', alertColor: 'red' })}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
                <!-- Project 1: CEN-01 -->
                <div class="data-card">
                    <div style="padding: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                            <div>
                                <h3 style="font-size: 16px; font-weight: 700; color: var(--slate-900);">CEN-01 Unilia Library</h3>
                                <div style="font-size: 12px; color: var(--slate-500);">Road Specification Module Active</div>
                            </div>
                            <span class="status active">On Track</span>
                        </div>

                        <div style="margin-bottom: 24px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
                                <span style="color: var(--slate-600);">Budget Utilization</span>
                                <span style="font-weight: 700; color: var(--slate-900);">65%</span>
                            </div>
                            <div style="height: 12px; background: var(--slate-100); border-radius: 6px; overflow: hidden; display: flex;">
                                <div style="width: 45%; background: var(--blue); height: 100%;" title="Actual Spent: 45%"></div>
                                <div style="width: 20%; background: var(--orange); height: 100%; opacity: 0.7;" title="Committed: 20%"></div>
                            </div>
                            <div style="display: flex; gap: 16px; margin-top: 12px; font-size: 11px;">
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <div style="width: 8px; height: 8px; background: var(--blue); border-radius: 2px;"></div>
                                    <span style="color: var(--slate-500);">Spent (450M)</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <div style="width: 8px; height: 8px; background: var(--orange); border-radius: 2px;"></div>
                                    <span style="color: var(--slate-500);">Committed (200M)</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; margin-left: auto;">
                                    <span style="font-weight: 700; color: var(--emerald);">Remaining: 350M MWK</span>
                                </div>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <button class="btn btn-secondary" style="width: 100%; justify-content: center; font-size: 12px;" onclick="window.app.fmModule?.loadContractsView()">Contracts</button>
                            <button class="btn btn-primary" style="width: 100%; justify-content: center; font-size: 12px; background: var(--orange); border-color: var(--orange);" onclick="window.app.fmModule?.requestPMUplift('CEN-01')">Request Uplift</button>
                        </div>
                    </div>
                </div>

                <!-- Project 2: MZ-05 -->
                <div class="data-card">
                    <div style="padding: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                            <div>
                                <h3 style="font-size: 16px; font-weight: 700; color: var(--slate-900);">MZ-05 Mzimba Clinic</h3>
                                <div style="font-size: 12px; color: var(--slate-500);">Non-Road Construction</div>
                            </div>
                            <span class="status delayed">Critical (92%)</span>
                        </div>

                        <div style="margin-bottom: 24px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
                                <span style="color: var(--slate-600);">Budget Utilization</span>
                                <span style="font-weight: 700; color: var(--red);">92%</span>
                            </div>
                            <div style="height: 12px; background: var(--slate-100); border-radius: 6px; overflow: hidden; display: flex;">
                                <div style="width: 85%; background: var(--red); height: 100%;" title="Actual Spent: 85%"></div>
                                <div style="width: 7%; background: var(--orange); height: 100%; opacity: 0.7;" title="Committed: 7%"></div>
                            </div>
                            <div style="display: flex; gap: 16px; margin-top: 12px; font-size: 11px;">
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <div style="width: 8px; height: 8px; background: var(--red); border-radius: 2px;"></div>
                                    <span style="color: var(--slate-500);">Spent (184M)</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <div style="width: 8px; height: 8px; background: var(--orange); border-radius: 2px;"></div>
                                    <span style="color: var(--slate-500);">Committed (14M)</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; margin-left: auto;">
                                    <span style="font-weight: 700; color: var(--red);">Remaining: 16M MWK</span>
                                </div>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <button class="btn btn-secondary" style="width: 100%; justify-content: center; font-size: 12px;">Contracts</button>
                            <button class="btn btn-primary" style="width: 100%; justify-content: center; font-size: 12px; background: var(--orange); border-color: var(--orange);" onclick="window.app.fmModule?.requestPMUplift('MZ-05')">Request Uplift</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="data-card" style="margin-top: 24px;">
                <div class="data-card-header">
                    <div class="card-title">Pending Resource Requisitions (EC Forwarded)</div>
                    <button class="btn btn-secondary" onclick="window.app.fmModule?.switchView('approvals')">Process All</button>
                </div>
                <table>
                   <thead>
                      <tr>
                         <th>ID</th><th>Project</th><th>Material Items</th><th>Requested By</th><th>Amount (MWK)</th><th>Status</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr onclick="window.drawer.open('Requisition Review', window.DrawerTemplates.requisitionReview('REQ-089'))">
                         <td><span class="project-id">REQ-089</span></td>
                         <td style="font-weight: 600;">CEN-01 Unilia</td>
                         <td>Bitumen (G-Grade) x 20 Drums</td>
                         <td>Mkanda (FS) via EC</td>
                         <td style="font-family: 'JetBrains Mono'; font-weight: 700;">8,500,000</td>
                         <td><span class="status locked" style="background: var(--orange-light); color: var(--orange);">EC OUT OF STOCK</span></td>
                      </tr>
                   </tbody>
                </table>
            </div>
        `;
    }

    getResourceApprovalsView() {
        return `
            <div class="data-card">
               <div class="data-card-header">
                  <div class="card-title">Resource Requisition Queue (EC Forwarded)</div>
                  <div style="display:flex; gap:8px;">
                     <button class="btn btn-secondary"><i class="fas fa-filter"></i> Filters</button>
                     <button class="btn btn-primary" onclick="window.toast.show('Processing batch...', 'info')">Bulk Approve</button>
                  </div>
               </div>
               <table>
                  <thead>
                     <tr>
                        <th>Req ID</th><th>Project</th><th>Material Items</th><th>Requested By</th><th style="text-align:right">Value (MWK)</th><th>Budget Check</th><th>Action</th>
                     </tr>
                  </thead>
                  <tbody>
                     <tr onclick="window.drawer.open('Requisition Review', window.DrawerTemplates.requisitionReview('REQ-089'))">
                        <td><span class="project-id">REQ-089</span></td>
                        <td>CEN-01 Unilia</td>
                        <td>Bitumen (G-Grade) x 20 Drums</td>
                        <td>Mkanda (FS) via EC</td>
                        <td style="text-align:right; font-family: 'JetBrains Mono'; font-weight: 700;">8,500,000</td>
                        <td><span class="status active">Healthy (350M Rem)</span></td>
                        <td><button class="btn btn-action" style="padding: 4px 8px; font-size: 11px;">Review & Approve</button></td>
                     </tr>
                     <tr onclick="window.drawer.open('Requisition Review', window.DrawerTemplates.requisitionReview('REQ-104'))">
                        <td><span class="project-id">REQ-104</span></td>
                        <td>MZ-05 Clinic</td>
                        <td>Reinforcement Steel Bars (12mm) x 50 Units</td>
                        <td>Jere (FS) via EC</td>
                        <td style="text-align:right; font-family: 'JetBrains Mono'; font-weight: 700;">18,200,000</td>
                        <td><span class="status delayed" style="background: #FEF2F2; color: var(--red);">Critical (16M Rem)</span></td>
                        <td><button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;">Exceeds Budget</button></td>
                     </tr>
                  </tbody>
               </table>
            </div>
        `;
    }

    getBudgetControlView() {
        return `
            <div class="data-card">
               <div class="data-card-header">
                  <div class="card-title">PM Budget Uplift Requests</div>
                  <button class="btn btn-action" onclick="window.drawer.open('Initiate Budget Uplift', window.DrawerTemplates.initiateBCR)"><i class="fas fa-plus"></i> New Request</button>
               </div>
               <table>
                  <thead>
                     <tr><th>Uplift ID</th><th>Project</th><th>Reason</th><th style="text-align:right">Current</th><th style="text-align:right">Requested</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                     <tr>
                        <td><span class="project-id">BCR-102</span></td>
                        <td>MZ-05 Clinic</td>
                        <td>Material Price Escalation</td>
                        <td style="text-align:right; font-family: 'JetBrains Mono';">200M</td>
                        <td style="text-align:right; font-family: 'JetBrains Mono';">+25M</td>
                        <td><span class="status locked">Awaiting PM Approval</span></td>
                     </tr>
                  </tbody>
               </table>
            </div>
        `;
    }

    getRecordsView() {
        return `
            <div style="display: grid; grid-template-columns: 1fr 300px; gap: 24px;">
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Master Audit Log & System History</div>
                        <button class="btn btn-secondary"><i class="fas fa-filter"></i> Search</button>
                    </div>
                    <table>
                        <thead>
                            <tr><th>Timestamp</th><th>Action</th><th>Module</th><th>User</th><th>Details</th></tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="font-size: 11px; color: var(--slate-500);">Mar 29, 12:15</td>
                                <td><span class="status active">Procurement</span></td>
                                <td>Contracts</td>
                                <td>Stefan Mwale</td>
                                <td>New Contract: Bitumen Supply (REQ-089)</td>
                            </tr>
                            <tr>
                                <td style="font-size: 11px; color: var(--slate-500);">Mar 29, 11:30</td>
                                <td><span class="status pending">Budget</span></td>
                                <td>Uplift</td>
                                <td>Stefan Mwale</td>
                                <td>Requested Uplift for MZ-05 from Project Manager</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Generated Reports</div>
                    </div>
                    <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                        <button class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px;">
                            <i class="fas fa-file-pdf" style="color: var(--red);"></i> Project Profitability Report
                        </button>
                        <button class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px;">
                            <i class="fas fa-file-excel" style="color: var(--emerald);"></i> Material Usage BvA
                        </button>
                        <button class="btn btn-primary" style="margin-top: 12px; justify-content: center;" onclick="window.drawer.open('Report Generator', window.DrawerTemplates.reportGenerator)">
                            Create New Report
                        </button>
                    </div>
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
            'approvals': { title: 'Resource Hub', context: 'Procurement Gatekeeping' },
            'contracts': { title: 'Vendor Contracts', context: 'Milestones & Commitments' },
            'vendors': { title: 'Vendor Registry', context: 'Compliance & Performance' },
            'bcr': { title: 'PM Uplift Requests', context: 'Budget Extensions' },
            'audit': { title: 'Audit Trail', context: 'Immutable Records' },
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
            this.render();
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
        this.render();
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
        const formatValue = (v) => v ? (Number(v) / 1000000).toFixed(1) + 'M' : '-';
        const rows = contracts.map(c => `
            <tr>
                <td><span class="project-id">${c.refCode || 'CON-'+c.id}</span></td>
                <td style="font-weight:600;">${c.title}</td>
                <td>${c.vendorName || '-'}</td>
                <td style="font-family:'JetBrains Mono';">${formatValue(c.value)}</td>
                <td><span class="status active">${c.status || 'Active'}</span></td>
                <td><button class="btn btn-secondary" style="padding:4px 8px;">View</button></td>
            </tr>
        `).join('');

        return `<table><thead><tr><th>Ref</th><th>Title</th><th>Vendor</th><th>Value</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>`;
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
        this.render();
    }
}
