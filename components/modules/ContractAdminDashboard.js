export class ContractAdminDashboard {
    constructor() {
        this.currentView = 'dashboard';
    }

    render() {
        return this.getTemplate();
    }

    getTemplate() {
        return `
            <div id="ca-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${this.getStatsGridHTML()}
                    ${this.getDataCardHTML()}
                </div>
            </div>
        `;
    }

    getHeaderHTML() {
        return `
            <div class="page-header">
                <div class="breadcrumb">
                  <span>Contract Workspace</span>
                  <i class="fas fa-chevron-right" style="font-size: 9px;"></i>
                  <span>Dashboard</span>
                </div>
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">Contract Overview</h1>
                    <div class="context-strip">
                      <span class="context-value">4</span> Active Contracts
                      <div class="context-dot"></div>
                      <span class="context-value" style="color: var(--emerald);">98% Compliance</span>
                      <div class="context-dot"></div>
                      <span style="color: var(--orange); font-weight: 600;">3 Approaching Deadlines</span>
                    </div>
                  </div>
                  <button class="btn btn-action" onclick="window.drawer.open('New Contract', window.DrawerTemplates.newContract)">
                    <i class="fas fa-plus"></i>
                    <span>New Contract</span>
                  </button>
                </div>
            </div>
        `;
    }

    getStatsGridHTML() {
        return `
            <div class="stats-grid">
               <div class="stat-card" style="border-left: 4px solid var(--orange);">
                  <div class="stat-header"><span class="stat-label" style="color: var(--orange);">Upcoming Deadlines</span><i class="fas fa-clock" style="color: var(--orange);"></i></div>
                  <div class="stat-value" style="color: var(--orange);">3</div>
                  <div class="stat-sub">Milestones due < 7 days</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Active Contracts</span><i class="fas fa-file-contract" style="color: var(--blue);"></i></div>
                  <div class="stat-value">4</div>
                  <div class="stat-sub">Total Value: MWK 890M</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Pending Amendments</span><i class="fas fa-file-pen" style="color: var(--slate-600);"></i></div>
                  <div class="stat-value">1</div>
                  <div class="stat-sub">Awaiting PM Approval</div>
               </div>
               <div class="stat-card" style="border-left: 4px solid var(--red);">
                  <div class="stat-header"><span class="stat-label" style="color: var(--red);">Compliance Alerts</span><i class="fas fa-triangle-exclamation" style="color: var(--red);"></i></div>
                  <div class="stat-value" style="color: var(--red);">1</div>
                  <div class="stat-sub">Expired Insurance (VEN-012)</div>
               </div>
            </div>
        `;
    }

    getDataCardHTML() {
        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Immediate Attention Required (7-Day Lookahead)</div>
                <button class="btn btn-secondary">View Calendar</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Contract ID</th>
                    <th>Project</th>
                    <th>Milestone</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr onclick="window.drawer.open('Contract Details', window.DrawerTemplates.contractDetails)">
                    <td><span class="mono-val">CNT-045</span></td>
                    <td style="font-weight: 600;">CEN-01 Unilia</td>
                    <td>Foundation Complete</td>
                    <td class="mono-val" style="color: var(--red); font-weight: 700;">Jan 07 (4 Days)</td>
                    <td><span class="status expiring" style="background: #FEF3C7; color: #92400E; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">At Risk</span></td>
                    <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">Track</button></td>
                  </tr>
                  <tr onclick="window.drawer.open('Contract Details', window.DrawerTemplates.contractDetails)">
                    <td><span class="mono-val">CNT-052</span></td>
                    <td style="font-weight: 600;">MZ-05 Clinic</td>
                    <td>Ins. Renewal</td>
                    <td class="mono-val" style="color: var(--orange); font-weight: 700;">Jan 10 (7 Days)</td>
                    <td><span class="status expiring" style="background: #FEF3C7; color: #92400E; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">Warning</span></td>
                    <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">Renew</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
        `;
    }
}
