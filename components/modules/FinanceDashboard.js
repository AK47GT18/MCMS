import { StatCard } from '../ui/StatCard.js';
// We rely on window.DrawerTemplates being available for large modal content to avoid inline HTML escaping hell

export class FinanceDashboard {
    // ...

    constructor() {
        this.currentView = 'dashboard';
        this.data = {
           // Emulate data state if needed, but we mostly just render static HTML for now
        };
    }

    render() {
        // Return the shell, and then we will update the internal content
        // We use a self-contained render method that returns the full HTML string based on current view
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
            case 'approvals': return this.getApprovalsView();
            case 'bcr': return this.getBudgetControlView();
            case 'audit': return this.getAuditView();
            case 'fraud': return this.getFraudView();
            case 'reports': return this.getReportsView();
            default: return this.getPlaceholderView(this.currentView);
        }
    }

    getDashboardView() {
        return `
            <div class="stats-grid">
                ${StatCard({ title: 'Fraud Alerts', value: '1', subtext: 'Duplicate Payment Detected', alertColor: 'red' })}
                ${StatCard({ title: 'Pending Approvals', value: '5', subtext: 'MWK 45M Total Value', alertColor: 'amber' })}
                ${StatCard({ title: 'Contract Deadlines', value: '3', subtext: 'Expiring within 7 days' })}
                ${StatCard({ title: 'Budget Overruns', value: '2', subtext: 'Projects exceeding 90%' })}
            </div>

            <div class="data-card">
               <div class="data-card-header">
                  <div class="card-title">Priority Action Items</div>
                  <button class="btn btn-secondary" onclick="window.toast.show('Loading full list...', 'info')">View All</button>
               </div>
               <table>
                  <thead>
                     <tr>
                        <th>ID</th><th>Type</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th>
                     </tr>
                  </thead>
                  <tbody>
                     <tr onclick="window.drawer.open('Requisition Review', window.DrawerTemplates.requisitionReview)">
                        <td><span class="project-id">REQ-089</span></td>
                        <td><span class="status pending">Approval</span></td>
                        <td style="font-weight: 600;">Materials - CEN-01</td>
                        <td style="font-family: 'JetBrains Mono';">4,500,000</td>
                        <td style="color: var(--slate-500);">Awaiting You</td>
                        <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">Review</button></td>
                     </tr>
                     <tr style="background: var(--red-light);" onclick="window.drawer.open('Investigation', window.DrawerTemplates.investigation)">
                        <td><span class="project-id" style="background: var(--red-border);">REQ-095</span></td>
                        <td><span class="status rejected">Fraud Flag</span></td>
                        <td style="font-weight: 600; color: var(--red);">Duplicate Payment Check</td>
                        <td style="font-family: 'JetBrains Mono';">850,000</td>
                        <td style="color: var(--red);">Investigation Req.</td>
                        <td><button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;">Investigate</button></td>
                     </tr>
                     <tr>
                        <td><span class="project-id">BCR-102</span></td>
                        <td><span class="status locked">Budget Lock</span></td>
                        <td>Materials Budget Increase</td>
                        <td style="font-family: 'JetBrains Mono';">+20,000,000</td>
                        <td style="color: var(--slate-500);">Pending PM</td>
                        <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">Track</button></td>
                     </tr>
                  </tbody>
               </table>
            </div>
        `;
    }

    getApprovalsView() {
        return `
           <div class="data-card">
              <div class="data-card-header">
                 <div class="card-title">Requisition Queue</div>
                 <button class="btn btn-primary" onclick="window.toast.show('Approved 5 requisitions successfully.', 'success')">Bulk Approve</button>
              </div>
              <table>
                 <thead>
                    <tr><th><input type="checkbox"></th><th>Req ID</th><th>Project</th><th>Vendor</th><th>Description</th><th style="text-align:right">Amount</th><th>Fraud Check</th></tr>
                 </thead>
                 <tbody>
                    <tr onclick="window.drawer.open('Requisition Review', window.DrawerTemplates.requisitionReview)">
                       <td><input type="checkbox"></td>
                       <td><span class="project-id">REQ-089</span></td>
                       <td>CEN-01 Unilia</td>
                       <td>Malawi Cement</td>
                       <td>600 Bags Portland Cement</td>
                       <td style="text-align:right; font-family: 'JetBrains Mono';">4,500,000</td>
                       <td><span style="color: var(--emerald); font-weight: 600;"><i class="fas fa-check-circle"></i> Clean</span></td>
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
                  <div class="card-title">Budget Change Requests (Governance)</div>
                  <button class="btn btn-action" onclick="window.toast.show('New budget change request initiated.', 'info'); window.drawer.open('Initiate Budget Change', 'Loading...')"><i class="fas fa-plus"></i> Initiate Change</button>
               </div>
               <table>
                  <thead>
                     <tr><th>BCR ID</th><th>Project</th><th>Category</th><th style="text-align:right">Current</th><th style="text-align:right">Proposed</th><th style="text-align:right">Variance</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                     <tr>
                        <td><span class="project-id">BCR-102</span></td>
                        <td>CEN-01 Unilia</td>
                        <td>02-MAT Materials</td>
                        <td style="text-align:right; font-family: 'JetBrains Mono';">200M</td>
                        <td style="text-align:right; font-family: 'JetBrains Mono';">220M</td>
                        <td style="text-align:right; color: var(--emerald);">+20M</td>
                        <td><span class="status locked">Locked (PM Pending)</span></td>
                     </tr>
                  </tbody>
               </table>
            </div>
        `;
    }

    getAuditView() {
        return `
            <div class="data-card">
               <div class="data-card-header">
                  <div class="card-title"><i class="fas fa-lock"></i> Immutable System Log</div>
                  <button class="btn btn-secondary" onclick="window.toast.show('Audit report exporting...', 'info')">Export Audit Report</button>
               </div>
               <table>
                  <thead>
                     <tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Target</th><th>IP Address</th></tr>
                  </thead>
                  <tbody>
                     <tr>
                        <td style="color: var(--slate-500);">09:15:23</td>
                        <td style="font-weight: 600;">S. Mwale</td>
                        <td>Finance Dir</td>
                        <td><span class="status active">Approved</span></td>
                        <td>TRX-9901</td>
                        <td style="font-family: 'JetBrains Mono';">105.12.4.22</td>
                     </tr>
                     <tr>
                        <td style="color: var(--slate-500);">09:10:45</td>
                        <td style="font-weight: 600;">A. Kanjira</td>
                        <td>PM</td>
                        <td><span class="status pending">Submitted</span></td>
                        <td>TRX-9901</td>
                        <td style="font-family: 'JetBrains Mono';">105.12.4.55</td>
                     </tr>
                     <tr style="background: var(--slate-50);">
                        <td style="color: var(--slate-500);">08:30:12</td>
                        <td style="color: var(--slate-400);">Unknown</td>
                        <td>-</td>
                        <td><span class="status rejected">Login Fail</span></td>
                        <td>Auth</td>
                        <td style="font-family: 'JetBrains Mono';">192.168.1.5</td>
                     </tr>
                  </tbody>
               </table>
            </div>
        `;
    }

    getFraudView() {
        return `
            <div class="fraud-alert-card">
                <div style="font-size: 24px; color: var(--red);"><i class="fas fa-triangle-exclamation"></i></div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; color: var(--red); font-size: 16px;">Duplicate Payment Detected</div>
                    <div style="color: var(--slate-600); margin-top: 4px;">REQ-095 (MWK 850,000) matches TRX-9885 from 3 days ago. Vendor: Mzuzu Hardware.</div>
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <button class="btn btn-danger" onclick="window.drawer.open('Investigation', window.DrawerTemplates.investigation)">Investigate</button>
                        <button class="btn btn-secondary" onclick="window.toast.show('Marked as false positive. Learning updated.', 'success')">Mark False Positive</button>
                    </div>
                </div>
            </div>
        `;
    }

    getReportsView() {
        return `<div class="data-card"><div class="data-card-header"><div class="card-title">Reports Generator</div></div><div style="padding: 24px;">Report Config Placeholder</div></div>`;
    }

    getPlaceholderView(title) {
         return `<div class="data-card"><div class="data-card-header"><div class="card-title">${title.charAt(0).toUpperCase() + title.slice(1)}</div></div><div style="padding: 24px;">Content for ${title} coming soon.</div></div>`;
    }

    // --- HEADER AND CONTEXT ---

    getHeaderHTML() {
        // Headers per view
        const headers = {
            'dashboard': { title: 'Financial Overview', context: 'FY 2025-26 | Cash Position: Strong' },
            'analytics': { title: 'Analytics', context: 'Burn Rate & Forecasting' },
            'approvals': { title: 'Requisition Queue', context: 'Operational Gatekeeping' },
            'ledger': { title: 'General Ledger', context: 'Master Record' },
            'reconciliation': { title: 'Bank Reconciliation', context: 'Statement Matching' },
            'bcr': { title: 'Budget Control', context: 'Governance & Change Requests' },
            'audit': { title: 'Audit Log', context: 'Immutable System Record' },
            'fraud': { title: 'Fraud Detection', context: 'Active Alerts & Rules' },
            'contracts': { title: 'Contract Management', context: 'Milestones & Deadlines' },
            'vendors': { title: 'Vendor Registry', context: 'Compliance & Performance' },
            'reports': { title: 'Reporting', context: 'Export & Print' }
        };

        const current = headers[this.currentView] || { title: this.currentView, context: '' };

        const budgetFormHTML = `
            <div style="padding: 24px;">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Project Code</label>
                    <select style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 13px;">
                        <option>CEN-01 Unilia Construction</option>
                        <option>NOR-04 Mzuzu Bridge</option>
                    </select>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Budget Category</label>
                    <select style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 13px;">
                        <option>02-MAT Materials</option>
                        <option>03-LAB Labor</option>
                        <option>04-EQU Equipment</option>
                    </select>
                </div>
                 <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Planned Amount (MWK)</label>
                    <input type="number" value="20000000" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 13px;">
                </div>
                 <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">New Amount (MWK)</label>
                    <input type="number" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 13px; border-color: var(--orange);">
                </div>
                <button class="btn btn-action" style="width: 100%; justify-content: center;">Submit Request</button>
            </div>
        `.replace(/\n/g, ''); // Simple minification to pass as string

        return `
             <div class="page-header">
                <div class="page-title-row">
                    <div>
                        <h1 class="page-title">${current.title}</h1>
                        <div class="context-strip">
                            <span class="context-value">${current.context}</span>
                            ${this.currentView === 'dashboard' ? `
                                <div class="context-dot"></div>
                                <span style="color: var(--orange); font-weight: 600;">5 Items Pending</span>
                            ` : ''}
                        </div>
                    </div>
                    ${this.currentView === 'dashboard' || this.currentView === 'bcr' ? `
                        <button class="btn btn-action" onclick="window.drawer.open('Initiate Budget Change', '${budgetFormHTML.replace(/"/g, '&quot;').replace(/'/g, "\\'")}')">
                            <i class="fas fa-plus"></i>
                            <span>New Budget Request</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
}
