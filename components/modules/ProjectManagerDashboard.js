import { StatCard } from '../ui/StatCard.js';

export class ProjectManagerDashboard {
    constructor() {
        this.currentView = 'portfolio';
    }

    render() {
        let contentHTML = '';
        
        switch(this.currentView) {
            case 'portfolio': contentHTML = this.getPortfolioView(); break;
            case 'gantt': contentHTML = this.getGanttView(); break;
            case 'budget': contentHTML = this.getBudgetView(); break;
            case 'teams': contentHTML = this.getTeamsView(); break;
            case 'contracts': contentHTML = this.getContractsView(); break;
            case 'reports': contentHTML = this.getReportsView(); break;
            case 'analytics': contentHTML = this.getAnalyticsView(); break;
            case 'reviews': contentHTML = this.getReviewsView(); break;
            default: contentHTML = this.getPortfolioView();
        }

        return `
            <div id="pm-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${contentHTML}
                </div>
            </div>
        `;
    }

    getHeaderHTML() {
        const titleMap = {
            'portfolio': 'Project Portfolio',
            'gantt': 'Execution Schedule',
            'budget': 'Financial Control',
            'teams': 'Field Operations',
            'contracts': 'Contract Registry',
            'reports': 'Reports Center',
            'analytics': 'Performance Analytics',
            'reviews': 'Approvals & Reviews'
        };

        return `
            <div class="page-header">
                <div class="breadcrumb">
                  <span>Workspace</span>
                  <i class="fas fa-chevron-right" style="font-size: 9px;"></i>
                  <span>${titleMap[this.currentView] || 'Dashboard'}</span>
                </div>
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">${titleMap[this.currentView] || 'Overview'}</h1>
                    ${this.getContextStrip()}
                  </div>
                  ${this.getActionButtons()}
                </div>
            </div>
        `;
    }

    getContextStrip() {
        if (this.currentView === 'budget') {
            return `
                <div class="context-strip">
                  <span class="context-value">MWK 450M</span> Total Budget
                  <div class="context-dot"></div>
                  <span style="color: var(--emerald); font-weight: 600;">85% Utilized</span>
                  <div class="context-dot"></div>
                  <span style="color: var(--orange);">2 Pending Approvals</span>
                </div>`;
        }
        return `
            <div class="context-strip">
              <span class="context-value">4</span> Active Projects
              <div class="context-dot"></div>
              <span class="context-value">MWK 1.2B</span> Portfolio Value
              <div class="context-dot"></div>
              <span style="color: var(--orange); font-weight: 600;">3 Pending Logs</span>
            </div>`;
    }

    getActionButtons() {
        if (this.currentView === 'portfolio') {
            return `
                <button class="btn btn-action" onclick="window.drawer.open('Initialize New Project', window.DrawerTemplates.newProject)">
                    <i class="fas fa-plus"></i> <span>New Project</span>
                </button>`;
        }
        if (this.currentView === 'gantt') {
             return `
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-secondary"><i class="fas fa-filter"></i> Filter</button>
                    <button class="btn btn-primary" onclick="window.drawer.open('Add Task', window.DrawerTemplates.addTask)"><i class="fas fa-plus"></i> Add Task</button>
                </div>`;
        }
        return '';
    }

    // --- 1. PORTFOLIO MODULE ---
    getPortfolioView() {
        return `
            ${this.getStatsGridHTML()}
            <div class="data-card">
              <div class="data-card-header">
                <div class="tabs" style="margin-bottom: 0;">
                  <div class="tab active" data-status="active" onclick="this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active');">Active Projects</div>
                  <div class="tab" data-status="planning" onclick="this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active');">Planning</div>
                  <div class="tab" data-status="hold" onclick="this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active');">On Hold</div>
                  <div class="tab" data-status="completed" onclick="this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active');">Completed</div>
                </div>
                <button class="btn btn-secondary"><i class="fas fa-filter"></i> Filter</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Project ID</th>
                    <th>Project Name</th>
                    <th>Manager</th>
                    <th>Progress</th>
                    <th>Budget Health</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr onclick="window.drawer.open('Project Details', window.DrawerTemplates.projectDetails)">
                    <td><span class="project-id">Mz-05</span></td>
                    <td style="font-weight: 600;">Mzuzu Clinic Extension</td>
                    <td>Peter Phiri</td>
                    <td>
                        <div class="progress-text"><span>Finishing</span> <span>92%</span></div>
                        <div class="progress-container"><div class="progress-bar" style="width: 92%; background: var(--emerald);"></div></div>
                    </td>
                    <td><span class="status active" style="background:var(--emerald-light); color:var(--emerald-dark);">Good (85%)</span></td>
                    <td><span class="status active"><i class="fas fa-play-circle"></i> Active</span></td>
                    <td><i class="fas fa-chevron-right" style="color: var(--slate-300);"></i></td>
                  </tr>
                  <tr>
                    <td><span class="project-id">LIL-02</span></td>
                    <td style="font-weight: 600;">Area 18 Mall Access</td>
                    <td>Davi Moyo</td>
                    <td>
                        <div class="progress-text"><span>Surfacing</span> <span>60%</span></div>
                        <div class="progress-container"><div class="progress-bar" style="width: 60%; background: var(--red);"></div></div>
                    </td>
                    <td><span class="status delayed" style="background:var(--red-light); color:var(--red-dark);">Overrun (105%)</span></td>
                    <td><span class="status delayed"><i class="fas fa-exclamation-circle"></i> Delayed</span></td>
                    <td><i class="fas fa-chevron-right" style="color: var(--slate-300);"></i></td>
                  </tr>
                </tbody>
              </table>
            </div>
        `;
    }

    getStatsGridHTML() {
        return `
            <div class="stats-grid">
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Budget Health</span><i class="fas fa-wallet" style="color: var(--emerald);"></i></div>
                  <div class="stat-value">85%</div>
                  <div class="stat-sub"><i class="fas fa-arrow-up"></i> Utilized (Aggregate)</div>
               </div>
               <div class="stat-card" style="border-color: var(--orange-light); background: #fffbf7;" onclick="window.toast.show('Filtering for pending reviews...', 'info')">
                  <div class="stat-header"><span class="stat-label" style="color: var(--orange);">Pending Reviews</span><i class="fas fa-clipboard-check" style="color: var(--orange);"></i></div>
                  <div class="stat-value" style="color: var(--orange);">3</div>
                  <div class="stat-sub">Field logs awaiting approval</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Schedule Variance</span><i class="fas fa-clock" style="color: var(--blue);"></i></div>
                  <div class="stat-value">-2 Days</div>
                  <div class="stat-sub">Minor delay on CEN-01</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Incidents</span><i class="fas fa-exclamation-triangle" style="color: var(--red);"></i></div>
                  <div class="stat-value">0</div>
                  <div class="stat-sub" style="color: var(--emerald);">No open safety issues</div>
               </div>
            </div>
        `;
    }

    // --- 2.1 GANTT SCHEDULE (EXECUTION) ---
    getGanttView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div style="display:flex; gap:16px; align-items:center;">
                         <div style="font-weight:700;">CEN-01 Unilia Library</div>
                         <div style="font-size:12px; color:var(--slate-500);">Critical Path View</div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-secondary" style="font-size:11px;">Day</button>
                        <button class="btn btn-secondary active" style="font-size:11px; background:var(--slate-800); color:white;">Week</button>
                        <button class="btn btn-secondary" style="font-size:11px;">Month</button>
                    </div>
                </div>
                <div style="padding:20px; overflow-x:auto;">
                    <!-- Simple Gantt Visualization -->
                    <div style="display:grid; grid-template-columns: 200px 1fr; gap:0; border:1px solid var(--slate-200);">
                        <!-- Header -->
                        <div style="background:var(--slate-50); padding:10px; border-right:1px solid var(--slate-200); font-weight:700; font-size:12px;">Task Name</div>
                        <div style="background:var(--slate-50); padding:10px; font-weight:700; font-size:12px;">Timeline (Jan 2025)</div>
                        
                        <!-- Task 1 -->
                        <div style="padding:10px; border-right:1px solid var(--slate-200); border-bottom:1px solid var(--slate-100); font-size:13px;">1.1 Site Clearing</div>
                        <div style="padding:10px; border-bottom:1px solid var(--slate-100); position:relative; min-height:40px;">
                            <div style="position:absolute; left:0%; width:20%; height:20px; background:var(--emerald); border-radius:4px; top:10px;"></div>
                            <span style="position:absolute; left:22%; top:12px; font-size:10px; color:var(--emerald-dark); font-weight:600;">Completed</span>
                        </div>

                        <!-- Task 2 -->
                        <div style="padding:10px; border-right:1px solid var(--slate-200); border-bottom:1px solid var(--slate-100); font-size:13px;">1.2 Excavation</div>
                        <div style="padding:10px; border-bottom:1px solid var(--slate-100); position:relative; min-height:40px;">
                            <div style="position:absolute; left:20%; width:30%; height:20px; background:var(--blue); border-radius:4px; top:10px; opacity:0.8;"></div>
                            <span style="position:absolute; left:22%; top:12px; font-size:10px; color:white; font-weight:600;">In Progress (60%)</span>
                        </div>

                        <!-- Task 3 -->
                        <div style="padding:10px; border-right:1px solid var(--slate-200); border-bottom:1px solid var(--slate-100); font-size:13px;">1.3 Foundation Poured</div>
                        <div style="padding:10px; border-bottom:1px solid var(--slate-100); position:relative; min-height:40px;">
                            <div style="position:absolute; left:50%; width:15%; height:20px; background:var(--slate-300); border-radius:4px; top:10px;"></div>
                            <span style="position:absolute; left:51%; top:12px; font-size:10px; color:var(--slate-600);">Scheduled</span>
                        </div>
                         
                         <!-- Task 4 (Delayed) -->
                        <div style="padding:10px; border-right:1px solid var(--slate-200); border-bottom:1px solid var(--slate-100); font-size:13px; color:var(--red);">1.4 Material Delivery</div>
                        <div style="padding:10px; border-bottom:1px solid var(--slate-100); position:relative; min-height:40px;">
                            <div style="position:absolute; left:40%; width:10%; height:20px; background:var(--red-light); border:1px solid var(--red); border-radius:4px; top:10px;"></div>
                            <span style="position:absolute; left:41%; top:12px; font-size:10px; color:var(--red);">Delayed (2 Days)</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- 2.2 BUDGET CONTROL (EXECUTION) ---
    getBudgetView() {
        return `
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Transaction Ledger</div>
                        <button class="btn btn-action" onclick="window.drawer.open('New Transaction', window.DrawerTemplates.transactionEntry)"><i class="fas fa-plus"></i> New Entry</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Ref</th>
                                <th>Category</th>
                                <th>Vendor</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="project-id">TRX-099</td>
                                <td>Materials</td>
                                <td>Malawi Cement</td>
                                <td style="font-family:'JetBrains Mono'">MWK 4.5M</td>
                                <td><span class="status pending">Level 1 Appr.</span></td>
                            </tr>
                            <tr>
                                <td class="project-id">TRX-098</td>
                                <td>Labor</td>
                                <td>Payroll Run</td>
                                <td style="font-family:'JetBrains Mono'">MWK 12.2M</td>
                                <td><span class="status active">Paid</span></td>
                            </tr>
                             <tr>
                                <td class="project-id">TRX-097</td>
                                <td>Equipment</td>
                                <td>CAT Rentals</td>
                                <td style="font-family:'JetBrains Mono'">MWK 1.1M</td>
                                <td><span class="status active">Paid</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div class="stat-card" style="background:var(--slate-800); color:white; border:none;">
                        <div class="stat-label" style="color:var(--slate-400);">Total Spend (Active)</div>
                        <div class="stat-value" style="color:white; font-size:28px;">MWK 382.5M</div>
                        <div class="stat-sub" style="color:var(--emerald);">Within 5% Variance</div>
                    </div>

                    <div class="fraud-alert-card" style="background:#FEF2F2; border:1px solid #FECACA; padding:16px; border-radius:8px;">
                         <div style="display:flex; gap:10px; margin-bottom:8px;">
                            <i class="fas fa-exclamation-triangle" style="color:var(--red);"></i>
                            <div style="font-weight:700; color:var(--red-dark); font-size:13px;">Budget Alert</div>
                         </div>
                         <div style="font-size:12px; color:var(--red-dark); line-height:1.4;">
                            <strong>CEN-01 Materials</strong> category has reached <strong>92%</strong> utilization. Level 2 approval required for next PO.
                         </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- 2.3 FIELD TEAMS (EXECUTION) ---
    getTeamsView() {
        return `
            <div class="data-card">
                 <div class="data-card-header">
                    <div class="card-title">Live Site Status</div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px; padding:20px;">
                    <!-- Site Card 1 -->
                    <div style="border:1px solid var(--slate-200); border-radius:8px; padding:16px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                            <div style="font-weight:700;">CEN-01 Unilia</div>
                            <span class="status active"><i class="fas fa-satellite-dish"></i> Live</span>
                        </div>
                        <div style="display:flex; gap:12px; margin-bottom:16px;">
                            <div class="profile-avatar" style="width:32px; height:32px; font-size:12px;">JB</div>
                            <div>
                                <div style="font-size:12px; font-weight:600;">John Banda</div>
                                <div style="font-size:11px; color:var(--slate-500);">Supervisor</div>
                            </div>
                        </div>
                        <div style="background:var(--slate-50); padding:10px; border-radius:6px; font-size:11px; margin-bottom:12px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span>Attendance</span>
                                <strong>14/15 Present</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Last Report</span>
                                <strong>14:00 Today</strong>
                            </div>
                        </div>
                        <button class="btn btn-secondary" style="width:100%; font-size:11px;" onclick="window.drawer.open('Site Log Verification', window.DrawerTemplates.siteLogVerification)">View Daily Logs</button>
                    </div>

                    <!-- Site Card 2 -->
                    <div style="border:1px solid var(--slate-200); border-radius:8px; padding:16px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                            <div style="font-weight:700;">MZ-05 Clinic</div>
                            <span class="status pending"><i class="fas fa-ellipsis-h"></i> Offline</span>
                        </div>
                        <div style="display:flex; gap:12px; margin-bottom:16px;">
                            <div class="profile-avatar" style="width:32px; height:32px; font-size:12px; background:var(--orange);">PP</div>
                            <div>
                                <div style="font-size:12px; font-weight:600;">Peter Phiri</div>
                                <div style="font-size:11px; color:var(--slate-500);">Supervisor</div>
                            </div>
                        </div>
                         <div style="background:var(--slate-50); padding:10px; border-radius:6px; font-size:11px; margin-bottom:12px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span>Attendance</span>
                                <strong>--</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Last Report</span>
                                <strong>Yesterday</strong>
                            </div>
                        </div>
                        <button class="btn btn-secondary" style="width:100%; font-size:11px;" onclick="window.drawer.open('Site Log Verification', window.DrawerTemplates.siteLogVerification)">View Daily Logs</button>
                    </div>
                </div>
            </div>
        `;
    }

    // --- 5. CONTRACTS (DOCUMENTS) ---
    getContractsView() {
         return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Contract Repository</div>
                <button class="btn btn-primary" onclick="window.drawer.open('New Contract', window.DrawerTemplates.newContract)"><i class="fas fa-upload"></i> Upload</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Contract ID</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Version</th>
                    <th>Expiry in</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span class="project-id">CTR-2024-001</span></td>
                    <td style="font-weight:600;">Unilia Main Works</td>
                    <td>Construction</td>
                    <td><span style="background:var(--blue-light); color:var(--blue-dark); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">v3.0</span></td>
                    <td style="color:var(--orange);">18 Months</td>
                    <td><button class="btn btn-secondary" style="padding:4px 8px;"><i class="fas fa-download"></i></button></td>
                  </tr>
                  <tr>
                     <td><span class="project-id">CTR-SUB-05</span></td>
                    <td style="font-weight:600;">Plumbing Subcontract</td>
                    <td>Specialist</td>
                    <td><span style="background:var(--slate-200); color:var(--slate-600); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">v1.0</span></td>
                    <td style="color:var(--red);">7 Days</td>
                    <td><button class="btn btn-secondary" style="padding:4px 8px;"><i class="fas fa-download"></i></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
        `;
    }

    // --- 6. REPORTS (REPORTS) ---
    getReportsView() {
        return `
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
                <div class="data-card" style="padding:20px; text-align:center;">
                    <div style="font-size:32px; color:var(--slate-300); margin-bottom:16px;"><i class="fas fa-chart-bar"></i></div>
                    <div style="font-weight:700; margin-bottom:8px;">Project Status Report</div>
                    <p style="font-size:12px; color:var(--slate-500); margin-bottom:16px;">Timeline adherence, budget variance, and critical risks summary.</p>
                    <button class="btn btn-primary" style="width:100%; justify-content:center;">Generate PDF</button>
                </div>
                 <div class="data-card" style="padding:20px; text-align:center;">
                    <div style="font-size:32px; color:var(--slate-300); margin-bottom:16px;"><i class="fas fa-coins"></i></div>
                    <div style="font-weight:700; margin-bottom:8px;">Financial Expenditure</div>
                    <p style="font-size:12px; color:var(--slate-500); margin-bottom:16px;">Expenditure by vendor, category, and time period analysis.</p>
                    <button class="btn btn-secondary" style="width:100%; justify-content:center;">Generate PDF</button>
                </div>
                 <div class="data-card" style="padding:20px; text-align:center;">
                    <div style="font-size:32px; color:var(--slate-300); margin-bottom:16px;"><i class="fas fa-hard-hat"></i></div>
                    <div style="font-weight:700; margin-bottom:8px;">Site Activity Log</div>
                    <p style="font-size:12px; color:var(--slate-500); margin-bottom:16px;">Compiled field reports, incidents, and attendance records.</p>
                    <button class="btn btn-secondary" style="width:100%; justify-content:center;">Generate PDF</button>
                </div>
            </div>
        `;
    }

    getAnalyticsView() {
        return `
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
                <!-- Chart 1: Project Budget Breakdown -->
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Budget Utilization by Project</div>
                        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export</button>
                    </div>
                    <div style="padding:24px;">
                        <div class="chart-container">
                            <div class="bar-group">
                                <div class="bar" style="height: 85%; background: var(--emerald);"></div>
                                <div class="bar-label">CEN-01</div>
                            </div>
                             <div class="bar-group">
                                <div class="bar" style="height: 92%; background: var(--orange);"></div>
                                <div class="bar-label">MZ-05</div>
                            </div>
                             <div class="bar-group">
                                <div class="bar" style="height: 105%; background: var(--red);"></div>
                                <div class="bar-label">LIL-02</div>
                            </div>
                             <div class="bar-group">
                                <div class="bar" style="height: 40%; background: var(--blue);"></div>
                                <div class="bar-label">BLK-09</div>
                            </div>
                             <div class="bar-group">
                                <div class="bar" style="height: 10%; background: var(--slate-300);"></div>
                                <div class="bar-label">KAR-11</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chart 2: Expense Categories Donut -->
                <div class="data-card">
                     <div class="data-card-header">
                        <div class="card-title">Expense Categories</div>
                    </div>
                    <div style="padding:24px; display:flex; flex-direction:column; align-items:center;">
                        <div class="donut-chart" style="background: conic-gradient(var(--blue) 0% 45%, var(--emerald) 45% 75%, var(--orange) 75% 90%, var(--slate-300) 90% 100%);">
                            <div class="donut-hole">
                                <div style="font-weight:700; font-size:24px;">100%</div>
                                <div style="font-size:11px; color:var(--slate-500);">Total Spend</div>
                            </div>
                        </div>
                        <div style="margin-top:24px; width:100%;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
                                <span style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:var(--blue); border-radius:2px;"></div> Materials</span>
                                <strong>45%</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
                                <span style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:var(--emerald); border-radius:2px;"></div> Labor</span>
                                <strong>30%</strong>
                            </div>
                             <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
                                <span style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:var(--orange); border-radius:2px;"></div> Logistics</span>
                                <strong>15%</strong>
                            </div>
                             <div style="display:flex; justify-content:space-between; font-size:12px;">
                                <span style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:var(--slate-300); border-radius:2px;"></div> Other</span>
                                <strong>10%</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- 8. REVIEWS (LOGS) ---
    getReviewsView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Pending For Review</div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-secondary" onclick="window.toast.show('All items approved', 'success')"><i class="fas fa-check-double"></i> Approve All</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Log ID</th>
                            <th>Project</th>
                            <th>Submitted By</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr onclick="window.drawer.open('Review Daily Log', window.DrawerTemplates.siteLogVerification)">
                            <td><span class="project-id">LOG-2024-889</span></td>
                            <td>CEN-01 Unilia</td>
                            <td>John Banda</td>
                            <td>Oct 24, 2024</td>
                            <td><span style="background:var(--blue-light); color:var(--blue-dark); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">Site Daily</span></td>
                            <td><span class="status pending">Pending</span></td>
                            <td><button class="btn btn-secondary" style="padding:4px 8px;">Review</button></td>
                        </tr>
                        <tr>
                            <td><span class="project-id">INC-2024-002</span></td>
                            <td>MZ-05 Clinic</td>
                            <td>Peter Phiri</td>
                            <td>Oct 23, 2024</td>
                            <td><span style="background:var(--red-light); color:var(--red-dark); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">Incident</span></td>
                            <td><span class="status pending">Escalated</span></td>
                            <td><button class="btn btn-secondary" style="padding:4px 8px;" onclick="window.drawer.open('Incident Report', window.DrawerTemplates.incidentReport)">Review</button></td>
                        </tr>
                        <tr>
                            <td><span class="project-id">REQ-2024-112</span></td>
                            <td>LIL-02 Mall</td>
                            <td>Davi Moyo</td>
                            <td>Oct 22, 2024</td>
                            <td><span style="background:var(--orange-light); color:var(--orange-dark); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">Material</span></td>
                            <td><span class="status pending">Pending</span></td>
                            <td><button class="btn btn-secondary" style="padding:4px 8px;" onclick="window.drawer.open('Requisition Review', window.DrawerTemplates.requisitionReview)">Review</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
}
