import client from '../../../src/api/client.js';
import contractsApi from '../../../src/api/contracts.api.js';

export const CA_Dashboard = {
    getDashboardView() {
        return `
            ${this.getStatsGridHTML()}
            ${this.getDataCardHTML()}
        `;
    },

    getStatsGridHTML() {
        const stats = this.data.stats;
        return `
            <div class="stats-grid">
               <div class="stat-card" style="border-color: var(--orange-light); background: #fffbf7;">
                  <div class="stat-header"><span class="stat-label" style="color: var(--orange);">Upcoming Deadlines</span><i class="fas fa-clock" style="color: var(--orange);"></i></div>
                  <div class="stat-value" style="color: var(--orange);">${stats.upcomingDeadlines}</div>
                  <div class="stat-sub">Milestones due < 7 days</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Active Contracts</span><i class="fas fa-file-contract" style="color: var(--blue);"></i></div>
                  <div class="stat-value">${stats.activeContracts}</div>
                  <div class="stat-sub">Total Value: MWK ${(stats.totalValue / 1000000).toFixed(0)}M</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Pending Amendments</span><i class="fas fa-file-pen" style="color: var(--slate-600);"></i></div>
                  <div class="stat-value">${stats.pendingAmendments}</div>
                  <div class="stat-sub">Awaiting PM Approval</div>
               </div>
               <div class="stat-card" style="${stats.complianceAlerts > 0 ? 'border-color: var(--red-light); background: #fff5f5;' : ''}">
                  <div class="stat-header"><span class="stat-label" style="${stats.complianceAlerts > 0 ? 'color: var(--red);' : ''}">Compliance Alerts</span><i class="fas fa-triangle-exclamation" style="color: ${stats.complianceAlerts > 0 ? 'var(--red)' : 'var(--emerald)'};"></i></div>
                  <div class="stat-value" style="${stats.complianceAlerts > 0 ? 'color: var(--red);' : 'color: var(--emerald);'}">${stats.complianceAlerts}</div>
                  <div class="stat-sub">${stats.complianceAlerts > 0 ? 'Expired/Expiring Policies' : 'All policies valid'}</div>
               </div>
            </div>
        `;
    },

    getDataCardHTML() {
        const upcoming = this.data.milestones.slice(0, 5);
        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Immediate Attention Required (7-Day Lookahead)</div>
                <button class="btn btn-secondary">View Calendar</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Ref Code</th>
                    <th>Project</th>
                    <th>Milestone</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${upcoming.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:20px;">No upcoming deadlines</td></tr>' : 
                    upcoming.map(m => `
                    <tr>
                        <td><span class="mono-val">${m.refCode || m.contractRef}</span></td>
                        <td style="font-weight: 600;">${m.projectName}</td>
                        <td>${m.description}</td>
                        <td class="mono-val" style="color: ${new Date(m.dueDate) < new Date() ? 'var(--red)' : 'var(--orange)'}; font-weight: 700;">
                            ${new Date(m.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td><span class="status ${m.status.toLowerCase()}">${m.status}</span></td>
                        <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.app.caModule.openMilestoneDetails(${m.id})">Track</button></td>
                    </tr>
                    `).join('')}
                </tbody>
              </table>
            </div>

            <div class="data-card" style="margin-top:24px;">
              <div class="data-card-header">
                <div class="card-title">Pending Contract Approvals (PM Workflow)</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Ref Code</th>
                    <th>Linked Project</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${(this.data.contracts || []).filter(c => c.status === 'draft' || c.status === 'pending_approval').length === 0 ? 
                    '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--slate-400);">No contracts awaiting approval</td></tr>' : 
                    this.data.contracts.filter(c => c.status === 'draft' || c.status === 'pending_approval').map(c => `
                    <tr>
                        <td><span class="mono-val">${c.refCode}</span></td>
                        <td style="font-weight: 600;">${c.project?.name || 'N/A'}</td>
                        <td class="mono-val">${parseFloat(c.value || 0).toLocaleString()} MWK</td>
                        <td><span class="status draft">${c.status}</span></td>
                        <td>
                            <div style="display:flex; gap:4px;">
                                <button class="btn btn-primary" style="padding: 4px 12px; font-size: 11px; background: var(--emerald); border:none;" onclick="window.app.caModule.handleApproveContract(${c.id})">Approve</button>
                                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.app.caModule.openEditContractDrawer(${c.id})">Edit</button>
                            </div>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
              </table>
            </div>
        `;
    }
};
