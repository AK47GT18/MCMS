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
            case 'analytics': return this.getAnalyticsView();
            case 'transaction': return this.getTransactionEntryView();
            case 'approvals': return this.getApprovalsView();
            case 'bcr': return this.getBudgetControlView();
            case 'audit': return this.getAuditView();
            case 'fraud': return this.getFraudView();
            case 'reconciliation': return this.getReconciliationView();
            case 'ledger': return this.getLedgerView();
            case 'contracts': return this.getContractsView();
            case 'vendors': return this.getVendorsView();
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
                  <button class="btn btn-action" onclick="window.drawer.open('Initiate Budget Change', window.DrawerTemplates.initiateBCR)"><i class="fas fa-plus"></i> Initiate Change</button>
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

    // --- DETAILED ANALYTICS MODULE ---

    getAnalyticsView() {
        return `
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
                <!-- Chart 1: Monthly Burn Rate -->
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Monthly Cash Burn Rate (MWK)</div>
                        <div style="display:flex; gap:10px;">
                            <div style="display:flex; align-items:center; gap:5px; font-size:11px; color:var(--slate-500);">
                                <div style="width:8px; height:8px; background:var(--blue); border-radius:2px;"></div> Actual
                            </div>
                            <div style="display:flex; align-items:center; gap:5px; font-size:11px; color:var(--slate-500);">
                                <div style="width:8px; height:8px; background:var(--slate-300); border-radius:2px;"></div> Projected
                            </div>
                        </div>
                    </div>
                    <div style="padding:24px;">
                        <div class="chart-container">
                            <div class="bar-group">
                                <div class="bar" style="height: 45%; background: var(--blue);"></div>
                                <div class="bar-label">Oct</div>
                            </div>
                             <div class="bar-group">
                                <div class="bar" style="height: 52%; background: var(--blue);"></div>
                                <div class="bar-label">Nov</div>
                            </div>
                             <div class="bar-group">
                                <div class="bar" style="height: 65%; background: var(--blue);"></div>
                                <div class="bar-label">Dec</div>
                            </div>
                             <div class="bar-group">
                                <div class="bar" style="height: 58%; background: var(--slate-300);"></div>
                                <div class="bar-label">Jan</div>
                            </div>
                             <div class="bar-group">
                                <div class="bar" style="height: 55%; background: var(--slate-300);"></div>
                                <div class="bar-label">Feb</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chart 2: OpEx Breakdown -->
                <div class="data-card">
                     <div class="data-card-header">
                        <div class="card-title">Operational OpEx</div>
                    </div>
                    <div style="padding:24px; display:flex; flex-direction:column; align-items:center;">
                        <div class="donut-chart" style="background: conic-gradient(var(--emerald) 0% 60%, var(--orange) 60% 85%, var(--red) 85% 100%);">
                            <div class="donut-hole">
                                <div style="font-weight:700; font-size:24px;">60%</div>
                                <div style="font-size:11px; color:var(--slate-500);">Direct Costs</div>
                            </div>
                        </div>
                        <div style="margin-top:24px; width:100%;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
                                <span style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:var(--emerald); border-radius:2px;"></div> Project Costs</span>
                                <strong>60%</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
                                <span style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:var(--orange); border-radius:2px;"></div> Overheads</span>
                                <strong>25%</strong>
                            </div>
                             <div style="display:flex; justify-content:space-between; font-size:12px;">
                                <span style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:var(--red); border-radius:2px;"></div> Debt Service</span>
                                <strong>15%</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Row 2: Cash Flow Table -->
             <div class="data-card" style="margin-top:24px;">
                <div class="data-card-header">
                    <div class="card-title">Cash Flow Forecast (Q1 2025)</div>
                     <button class="btn btn-secondary"><i class="fas fa-download"></i> Export CSV</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th style="text-align:right">Inflow (MWK)</th>
                            <th style="text-align:right">Outflow (MWK)</th>
                            <th style="text-align:right">Net Flow</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>January</td>
                            <td style="text-align:right; font-family:'JetBrains Mono'">150,000,000</td>
                            <td style="text-align:right; font-family:'JetBrains Mono'">120,000,000</td>
                            <td style="text-align:right; font-weight:700; color:var(--emerald);">+30,000,000</td>
                            <td><span class="status active">Positive</span></td>
                        </tr>
                        <tr>
                            <td>February</td>
                            <td style="text-align:right; font-family:'JetBrains Mono'">80,000,000</td>
                            <td style="text-align:right; font-family:'JetBrains Mono'">95,000,000</td>
                            <td style="text-align:right; font-weight:700; color:var(--red);">-15,000,000</td>
                            <td><span class="status delayed">Deficit</span></td>
                        </tr>
                    </tbody>
                </table>
             </div>
        `;
    }

    getTransactionEntryView() {
        return `<div class="data-card"><div class="data-card-header"><div class="card-title">Transaction Entry</div></div><div style="padding: 24px;">Content for transaction entry coming soon.</div></div>`;
    }
    
    getReconciliationView() {
         return `
            <div style="display:grid; grid-template-columns: 3fr 1fr; gap:24px;">
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Bank Reconciliation: National Bank Ops (8892)</div>
                        <button class="btn btn-primary">Import Statement</button>
                    </div>
                    
                    <div style="padding: 20px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; justify-content: space-between;">
                        <div style="text-align: center;">
                            <div style="font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Bank Statement Bal.</div>
                            <div style="font-size: 18px; font-weight: 700; color: var(--slate-800); font-family: 'JetBrains Mono';">MWK 145,200,000</div>
                        </div>
                        <div style="display: flex; align-items: center; color: var(--slate-400); font-size: 20px;"><i class="fas fa-minus"></i></div>
                        <div style="text-align: center;">
                            <div style="font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Unreconciled</div>
                            <div style="font-size: 18px; font-weight: 700; color: var(--red); font-family: 'JetBrains Mono';">MWK 2,500,000</div>
                        </div>
                        <div style="display: flex; align-items: center; color: var(--slate-400); font-size: 20px;"><i class="fas fa-equals"></i></div>
                        <div style="text-align: center;">
                            <div style="font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">System Book Bal.</div>
                            <div style="font-size: 18px; font-weight: 700; color: var(--emerald); font-family: 'JetBrains Mono';">MWK 142,700,000</div>
                        </div>
                    </div>

                    <div style="padding: 16px;">
                        <div style="font-size: 13px; font-weight: 700; margin-bottom: 12px;">Unmatched Transactions</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Ref</th>
                                    <th style="text-align: right;">Amount</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Oct 25</td>
                                    <td>Direct Deposit - Client Pymt</td>
                                    <td>DEP-992</td>
                                    <td style="text-align: right; font-family: 'JetBrains Mono';">+5,000,000</td>
                                    <td><button class="btn btn-secondary" style="padding: 2px 8px; font-size: 11px;" onclick="window.drawer.open('Match Transaction', window.DrawerTemplates.matchTransaction)">Match</button></td>
                                </tr>
                                <tr>
                                    <td>Oct 24</td>
                                    <td>Bank Service Charge</td>
                                    <td>SVC-001</td>
                                    <td style="text-align: right; font-family: 'JetBrains Mono';">-150,000</td>
                                    <td><button class="btn btn-secondary" style="padding: 2px 8px; font-size: 11px;" onclick="window.drawer.open('Create Journal Entry', window.DrawerTemplates.createJournalEntry)">Create Entry</button></td>
                                </tr>
                                 <tr>
                                    <td>Oct 22</td>
                                    <td>Cheque #4059 Clearance</td>
                                    <td>CHQ-4059</td>
                                    <td style="text-align: right; font-family: 'JetBrains Mono';">-2,350,000</td>
                                    <td><button class="btn btn-secondary" style="padding: 2px 8px; font-size: 11px;" onclick="window.drawer.open('Match Transaction', window.DrawerTemplates.matchTransaction)">Match</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Guidance / Notes Panel -->
                <div class="data-card" style="padding: 20px; height: fit-content;">
                    <div style="font-weight: 700; margin-bottom: 12px; color: var(--slate-700);">Reconciliation Stats</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
                        <span style="color: var(--slate-500);">Last Reconciled</span>
                        <span style="font-weight: 600;">Oct 15, 2025</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
                        <span style="color: var(--slate-500);">Items Matched</span>
                        <span style="font-weight: 600; color: var(--emerald);">142</span>
                    </div>
                     <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px;">
                        <span style="color: var(--slate-500);">Pending</span>
                        <span style="font-weight: 600; color: var(--orange);">3</span>
                    </div>
                    <button class="btn btn-secondary" style="width: 100%; justify-content: center;">View PDF Report</button>
                </div>
            </div>
         `;
    }

    getLedgerView() {
         return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">General Ledger Entries</div>
                    <div style="display: flex; gap: 8px;">
                        <input type="date" style="padding: 6px; border: 1px solid var(--slate-300); border-radius: 4px; font-size: 12px; color: var(--slate-600);" value="2025-10-01">
                        <input type="text" placeholder="Filter Account Code..." style="padding: 6px; border: 1px solid var(--slate-300); border-radius: 4px; font-size: 12px;">
                        <button class="btn btn-secondary"><i class="fas fa-filter"></i></button>
                        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Entry ID</th>
                            <th>Account</th>
                            <th>Description</th>
                            <th style="text-align: right;">Debit (MWK)</th>
                            <th style="text-align: right;">Credit (MWK)</th>
                            <th style="text-align: right;">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Oct 26</td>
                            <td class="project-id">JE-10045</td>
                            <td><span style="font-weight: 600; color: var(--slate-700);">5000-COG</span></td>
                            <td>Materials - CEN-01 Foundation</td>
                            <td style="text-align: right; font-family: 'JetBrains Mono';">4,500,000</td>
                            <td style="text-align: right; font-family: 'JetBrains Mono'; color: var(--slate-400);">-</td>
                            <td style="text-align: right; font-family: 'JetBrains Mono';">...</td>
                        </tr>
                        <tr style="background: var(--slate-50);">
                            <td>Oct 26</td>
                            <td class="project-id">JE-10045</td>
                            <td><span style="font-weight: 600; color: var(--slate-700);">1010-CASH</span></td>
                            <td>Offset - Bank Transfer</td>
                            <td style="text-align: right; font-family: 'JetBrains Mono'; color: var(--slate-400);">-</td>
                            <td style="text-align: right; font-family: 'JetBrains Mono';">4,500,000</td>
                            <td style="text-align: right; font-family: 'JetBrains Mono';">142.7M</td>
                        </tr>
                        
                        <tr>
                            <td>Oct 25</td>
                            <td class="project-id">JE-10044</td>
                            <td><span style="font-weight: 600; color: var(--slate-700);">6100-PAY</span></td>
                            <td>Monthly Payroll Run - Oct</td>
                            <td style="text-align: right; font-family: 'JetBrains Mono';">12,500,000</td>
                            <td style="text-align: right; font-family: 'JetBrains Mono'; color: var(--slate-400);">-</td>
                            <td style="text-align: right; font-family: 'JetBrains Mono';">...</td>
                        </tr>
                         <tr style="background: var(--slate-50);">
                            <td>Oct 25</td>
                            <td class="project-id">JE-10044</td>
                            <td><span style="font-weight: 600; color: var(--slate-700);">1010-CASH</span></td>
                            <td>Offset - Payroll Disbursement</td>
                            <td style="text-align: right; font-family: 'JetBrains Mono'; color: var(--slate-400);">-</td>
                            <td style="text-align: right; font-family: 'JetBrains Mono';">12,500,000</td>
                            <td style="text-align: right; font-family: 'JetBrains Mono';">147.2M</td>
                        </tr>
                    </tbody>
                </table>
            </div>
         `;
    }

    getContractsView() {
         return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Contract Management</div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-secondary"><i class="fas fa-filter"></i> Expiring Soon</button>
                    <button class="btn btn-primary" onclick="window.drawer.open('New Contract', window.DrawerTemplates.newContract)"><i class="fas fa-plus"></i> New Contract</button>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Contract ID</th>
                    <th>Title</th>
                    <th>Vendor/Party</th>
                    <th>Value (MWK)</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span class="project-id">CTR-2024-001</span></td>
                    <td style="font-weight:600;">Unilia Main Works</td>
                    <td>Unilia Construction Ltd</td>
                    <td style="font-family:'JetBrains Mono';">1.2B</td>
                    <td>Jan 01, 2025</td>
                    <td>Jun 30, 2026</td>
                    <td><span class="status active">Active</span></td>
                  </tr>
                  <tr>
                     <td><span class="project-id">CTR-SUB-05</span></td>
                    <td style="font-weight:600;">Plumbing Subcontract</td>
                    <td>Flow Masters</td>
                    <td style="font-family:'JetBrains Mono';">45M</td>
                    <td>Feb 15, 2025</td>
                    <td>Aug 15, 2025</td>
                    <td><span class="status pending">Draft</span></td>
                  </tr>
                   <tr>
                     <td><span class="project-id">CTR-SUP-88</span></td>
                    <td style="font-weight:600;">Cement Supply Framework</td>
                    <td>Malawi Cement</td>
                    <td style="font-family:'JetBrains Mono';">Rate Based</td>
                    <td>Jan 01, 2025</td>
                    <td>Dec 31, 2025</td>
                    <td><span class="status active">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
        `;
    }

    getVendorsView() {
         return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Vendor Registry & Compliance</div>
                <button class="btn btn-primary"><i class="fas fa-user-plus"></i> Onboard Vendor</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Category</th>
                    <th>Tax Clearance</th>
                    <th>NCIC Grade</th>
                    <th>Performance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="font-weight:600;">Malawi Cement Ltd</td>
                    <td>Materials</td>
                    <td><span style="color:var(--emerald);"><i class="fas fa-check-circle"></i> Valid (2025)</span></td>
                    <td>N/A</td>
                    <td>
                        <div style="display:flex; color:var(--orange);">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="far fa-star"></i>
                        </div>
                    </td>
                    <td><span class="status active">Approved</span></td>
                    <td><button class="btn btn-secondary open-drawer" style="padding:4px 8px;" onclick="window.drawer.open('Vendor Profile', window.DrawerTemplates.vendorProfile)">Profile</button></td>
                  </tr>
                   <tr>
                    <td style="font-weight:600;">Apex Security</td>
                    <td>Services</td>
                    <td><span style="color:var(--red);"><i class="fas fa-times-circle"></i> Expired</span></td>
                    <td>N/A</td>
                    <td>
                        <div style="display:flex; color:var(--orange);">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i>
                        </div>
                    </td>
                    <td><span class="status locked">Suspended</span></td>
                    <td><button class="btn btn-secondary open-drawer" style="padding:4px 8px;" onclick="window.drawer.open('Vendor Audit', window.DrawerTemplates.newAudit)">Audit</button></td>
                  </tr>
                  <tr>
                    <td style="font-weight:600;">BuildRite Construction</td>
                    <td>Sub-Contractor</td>
                    <td><span style="color:var(--emerald);"><i class="fas fa-check-circle"></i> Valid (2025)</span></td>
                    <td>15 Million</td>
                    <td>
                        <div style="display:flex; color:var(--orange);">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                        </div>
                    </td>
                    <td><span class="status active">Approved</span></td>
                    <td><button class="btn btn-secondary open-drawer" style="padding:4px 8px;" onclick="window.drawer.open('Vendor Profile', window.DrawerTemplates.vendorProfile)">Profile</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
        `;
    }

    getReportsView() {
        return `
            <div style="display:grid; grid-template-columns: 1fr 2fr; gap:24px;">
                <div class="data-card" style="height:fit-content;">
                    <div class="data-card-header">
                        <div class="card-title">Generate Report</div>
                    </div>
                    <div style="padding:24px;">
                        <div style="margin-bottom:16px;">
                            <label style="display:block; font-size:12px; font-weight:700; color:var(--slate-500); margin-bottom:6px;">Report Type</label>
                            <select style="width:100%; padding:8px; border:1px solid var(--slate-300); border-radius:4px; font-family:inherit;">
                                <option>Monthly Financial Statement</option>
                                <option>Budget Variance Analysis</option>
                                <option>Vendor Ageing Summary</option>
                                <option>Project Profitability</option>
                                <option>Tax Return Helper</option>
                            </select>
                        </div>
                        <div style="margin-bottom:16px;">
                            <label style="display:block; font-size:12px; font-weight:700; color:var(--slate-500); margin-bottom:6px;">Date Range</label>
                            <select style="width:100%; padding:8px; border:1px solid var(--slate-300); border-radius:4px; font-family:inherit;">
                                <option>Current Month (Oct 2025)</option>
                                <option>Last Month (Sep 2025)</option>
                                <option>Q3 2025</option>
                                <option>YTD 2025</option>
                                <option>Custom Range</option>
                            </select>
                        </div>
                         <div style="margin-bottom:24px;">
                            <label style="display:block; font-size:12px; font-weight:700; color:var(--slate-500); margin-bottom:6px;">Format</label>
                            <div style="display:flex; gap:12px;">
                                <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="radio" name="fmt" checked> PDF</label>
                                <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="radio" name="fmt"> Excel (.xlsx)</label>
                                <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="radio" name="fmt"> CSV</label>
                            </div>
                        </div>
                        <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="window.toast.show('Generating report...', 'info')">Generate Report</button>
                    </div>
                </div>

                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Recent Reports</div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Report Name</th>
                                <th>Generated</th>
                                <th>By</th>
                                <th>Size</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="font-weight:600;"><i class="fas fa-file-pdf" style="color:var(--red); margin-right:8px;"></i> Sep 2025 Financial Statement</td>
                                <td>Oct 01, 2025</td>
                                <td>System (Auto)</td>
                                <td>2.4 MB</td>
                                <td><button class="btn btn-secondary" style="padding:4px 8px;"><i class="fas fa-download"></i></button></td>
                            </tr>
                            <tr>
                                <td style="font-weight:600;"><i class="fas fa-file-excel" style="color:var(--emerald); margin-right:8px;"></i> Q3 Vendor Ageing</td>
                                <td>Oct 05, 2025</td>
                                <td>S. Mwale</td>
                                <td>850 KB</td>
                                <td><button class="btn btn-secondary" style="padding:4px 8px;"><i class="fas fa-download"></i></button></td>
                            </tr>
                             <tr>
                                <td style="font-weight:600;"><i class="fas fa-file-csv" style="color:var(--blue); margin-right:8px;"></i> CEN-01 Budget Dump</td>
                                <td>Yesterday</td>
                                <td>A. Kanjira</td>
                                <td>120 KB</td>
                                <td><button class="btn btn-secondary" style="padding:4px 8px;"><i class="fas fa-download"></i></button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    getPlaceholderView(title) {
        return `<div class="data-card"><div class="data-card-header"><div class="card-title">${title.charAt(0).toUpperCase() + title.slice(1)}</div></div><div style="padding: 24px;">Content for ${title} coming soon.</div></div>`;
    }

    // --- HEADER AND CONTEXT ---

    getHeaderHTML() {
        // Headers per view
        const headers = {
            'dashboard': { title: 'Dashboard', context: 'FY 2025-26 | Cash Position: Strong' },
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
                        <button class="btn btn-action" onclick="window.drawer.open('Initiate Budget Change', window.DrawerTemplates.initiateBCR)">
                            <i class="fas fa-plus"></i>
                            <span>New Budget Request</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
}
