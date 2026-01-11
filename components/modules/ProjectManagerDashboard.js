import { StatCard } from '../ui/StatCard.js';

export class ProjectManagerDashboard {
    constructor() {
        this.currentView = 'portfolio';
    }

    render() {
        return this.getTemplate();
    }

    getTemplate() {
        return `
            <div id="pm-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${this.getStatsGridHTML()}
                    ${this.getCurrentViewHTML()}
                </div>
            </div>
        `;
    }

    getStatsGridHTML() {
        return `
            <div class="stats-grid">
               <div class="stat-card">
                  <div class="stat-header">
                    <span class="stat-label">Budget Health</span>
                    <i class="fas fa-wallet" style="color: var(--emerald);"></i>
                  </div>
                  <div class="stat-value">85%</div>
                  <div class="stat-sub"><i class="fas fa-arrow-up"></i> Utilized (Aggregate)</div>
               </div>
               
               <div class="stat-card" style="border-color: var(--orange-light); background: #fffbf7;" onclick="window.toast.show('Filtering for pending reviews...', 'info')">
                  <div class="stat-header">
                    <span class="stat-label" style="color: var(--orange);">Pending Reviews</span>
                    <i class="fas fa-clipboard-check" style="color: var(--orange);"></i>
                  </div>
                  <div class="stat-value" style="color: var(--orange);">3</div>
                  <div class="stat-sub">Field logs awaiting approval</div>
               </div>

               <div class="stat-card">
                  <div class="stat-header">
                    <span class="stat-label">Schedule Variance</span>
                    <i class="fas fa-clock" style="color: var(--blue);"></i>
                  </div>
                  <div class="stat-value">-2 Days</div>
                  <div class="stat-sub">Minor delay on CEN-01</div>
               </div>

               <div class="stat-card">
                  <div class="stat-header">
                    <span class="stat-label">Incidents</span>
                    <i class="fas fa-exclamation-triangle" style="color: var(--red);"></i>
                  </div>
                  <div class="stat-value">0</div>
                  <div class="stat-sub" style="color: var(--emerald);">No open safety issues</div>
               </div>
            </div>
        `;
    }

    getCurrentViewHTML() {
        return `
        <div class="data-card">
          <div class="data-card-header">
            <div class="tabs" style="margin-bottom: 0;">
              <div class="tab active">Active Projects</div>
              <div class="tab">Pending Verification (3)</div>
              <div class="tab">Archived</div>
            </div>
            <button class="btn btn-secondary"><i class="fas fa-filter"></i> Filter</button>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Project Name</th>
                <th>Supervisor</th>
                <th style="width: 200px;">Progress</th>
                <th>Budget (MWK)</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr onclick="window.drawer.open('Site Log Verification', window.DrawerTemplates.siteLogVerification)">
                <td><span class="project-id">CEN-01</span></td>
                <td style="font-weight: 600;">Unilia Library Complex
                    <div style="font-size: 11px; color: var(--orange); margin-top: 2px;">
                        <i class="fas fa-circle" style="font-size: 8px;"></i> New Site Log Received
                    </div>
                </td>
                <td>John Banda</td>
                <td>
                    <div class="progress-text"><span>Foundation</span> <span>25%</span></div>
                    <div class="progress-container"><div class="progress-bar" style="width: 25%"></div></div>
                </td>
                <td style="font-family: 'JetBrains Mono';">450,000,000</td>
                <td><span class="status review"><i class="fas fa-hourglass-half"></i> Review Log</span></td>
                <td><i class="fas fa-chevron-right" style="color: var(--slate-300);"></i></td>
              </tr>

              <tr onclick="window.drawer.open('Project Details', '<div class=\\'p-4\\'>Details for MZ-05</div>')">
                <td><span class="project-id">MZ-05</span></td>
                <td style="font-weight: 600;">Mzuzu Clinic Extension</td>
                <td>Peter Phiri</td>
                <td>
                    <div class="progress-text"><span>Finishing</span> <span>92%</span></div>
                    <div class="progress-container"><div class="progress-bar" style="width: 92%; background: var(--emerald);"></div></div>
                </td>
                <td style="font-family: 'JetBrains Mono';">120,000,000</td>
                <td><span class="status active"><i class="fas fa-check"></i> On Track</span></td>
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
                <td style="font-family: 'JetBrains Mono';">85,000,000</td>
                <td><span class="status delayed"><i class="fas fa-exclamation-circle"></i> Material Delay</span></td>
                <td><i class="fas fa-chevron-right" style="color: var(--slate-300);"></i></td>
              </tr>
            </tbody>
          </table>
        </div>
        `;
    }

    getHeaderHTML() {
        return `
            <div class="page-header">
                <div class="breadcrumb">
                  <span>Workspace</span>
                  <i class="fas fa-chevron-right" style="font-size: 9px;"></i>
                  <span>Project Portfolio</span>
                </div>
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">Project Controls</h1>
                    <div class="context-strip">
                      <span class="context-value">4</span> Active Projects
                      <div class="context-dot"></div>
                      <span class="context-value">MWK 450M</span> Total Value
                      <div class="context-dot"></div>
                      <span style="color: var(--orange); font-weight: 600;">3 Pending Logs (Action Req)</span>
                    </div>
                  </div>
                  <button class="btn btn-action" onclick="window.drawer.open('Initialize New Project', window.DrawerTemplates.newProject)">
                    <i class="fas fa-plus"></i>
                    <span>New Project</span>
                  </button>
                </div>
            </div>
        `;
    }
}
