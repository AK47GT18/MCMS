
export class OperationsManagerDashboard {
    constructor() {
        this.currentView = 'dashboard';
    }

    render() {
        let contentHTML = '';
         switch(this.currentView) {
            case 'dashboard': contentHTML = this.getDashboardView(); break;
            case 'sites': contentHTML = this.getSitesView(); break;
            case 'resources': contentHTML = this.getResourcesView(); break;
            case 'supply': contentHTML = this.getSupplyView(); break;
            case 'inventory': contentHTML = this.getInventoryView(); break;
            case 'safety': contentHTML = this.getSafetyView(); break;
            default: contentHTML = this.getDashboardView();
        }

        return `
            <div id="om-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${contentHTML}
                </div>
            </div>
        `;
    }

    getHeaderHTML() {
        const titleMap = {
            'dashboard': 'Operations Overview',
            'sites': 'Site Performance Metrics',
            'resources': 'Resource & Labor Efficiency',
            'supply': 'Supply Chain Logistics',
            'inventory': 'Global Inventory',
            'safety': 'Safety & Compliance Audits'
        };

        return `
            <div class="page-header">
                <div class="breadcrumb">
                  <span>Workspace</span>
                  <i class="fas fa-chevron-right" style="font-size: 9px;"></i>
                  <span>${titleMap[this.currentView] || 'Operations'}</span>
                </div>
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">${titleMap[this.currentView]}</h1>
                     ${this.getContextStrip()}
                  </div>
                  <button class="btn btn-action">
                    <i class="fas fa-file-export"></i>
                    <span>Export Reports</span>
                  </button>
                </div>
            </div>
        `;
    }

    getContextStrip() {
        return `
            <div class="context-strip">
              <span class="context-value">8</span> Active Sites
              <div class="context-dot"></div>
              <span class="context-value">124</span> Total Personnel
              <div class="context-dot"></div>
              <span style="color: var(--emerald); font-weight: 600;">98% Equipment Uptime</span>
            </div>
        `;
    }

    getDashboardView() {
        return `
            ${this.getStatsGridHTML()}
            ${this.getDataCardHTML()}
        `;
    }

    getStatsGridHTML() {
        return `
            <div class="stats-grid">
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Labor Efficiency</span><i class="fas fa-users-cog" style="color: var(--blue);"></i></div>
                  <div class="stat-value">94%</div>
                  <div class="stat-sub"><i class="fas fa-arrow-up"></i> Positive Trend</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Material Usage</span><i class="fas fa-cubes" style="color: var(--orange);"></i></div>
                  <div class="stat-value">On Target</div>
                  <div class="stat-sub">Variance +/- 2%</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Active Fleets</span><i class="fas fa-truck-moving" style="color: var(--slate-600);"></i></div>
                  <div class="stat-value">22 / 24</div>
                  <div class="stat-sub">2 Units in Maintenance</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Safety Score</span><i class="fas fa-shield-alt" style="color: var(--emerald);"></i></div>
                  <div class="stat-value">A+</div>
                  <div class="stat-sub">Zero Incidents (30 Days)</div>
               </div>
            </div>
        `;
    }

    getDataCardHTML() {
        return `
        <div class="data-card">
          <div class="data-card-header">
            <div class="card-title">Site Performance Metrics</div>
            <button class="btn btn-secondary"><i class="fas fa-filter"></i> Filter</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Site ID</th>
                <th>Location</th>
                <th>Supervisor</th>
                <th>Daily Output</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="project-id">CEN-01</span></td>
                <td style="font-weight: 600;">Unilia Library</td>
                <td>John Banda</td>
                <td>
                    <div class="progress-text"><span>Target Reached</span> <span>105%</span></div>
                    <div class="progress-container"><div class="progress-bar" style="width: 100%; background: var(--emerald);"></div></div>
                </td>
                <td><span class="status active">Optimal</span></td>
                <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Site Audit', window.DrawerTemplates.newAudit)">Audit</button></td>
              </tr>
              <tr>
                <td><span class="project-id">MZ-05</span></td>
                <td style="font-weight: 600;">Mzuzu Clinic</td>
                <td>Peter Phiri</td>
                <td>
                    <div class="progress-text"><span>Target Reached</span> <span>88%</span></div>
                    <div class="progress-container"><div class="progress-bar" style="width: 88%; background: var(--orange);"></div></div>
                </td>
                <td><span class="status pending">Lagging</span></td>
                <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Site Audit', window.DrawerTemplates.newAudit)">Audit</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        `;
    }

    getSitesView() { 
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Site Performance Overview</div>
                    <button class="btn btn-secondary">Consolidated Report</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Site</th>
                            <th>Project Manager</th>
                            <th>Schedule Var.</th>
                            <th>Budget Var.</th>
                            <th>Safety Score</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight:600;">CEN-01 Unilia</td>
                            <td>J. Banda</td>
                            <td><span style="color:var(--emerald);">+ 2 Days</span></td>
                            <td><span style="color:var(--emerald);">- 1.5%</span></td>
                            <td>98%</td>
                            <td><span class="status active">Excellent</span></td>
                        </tr>
                         <tr>
                            <td style="font-weight:600;">MZ-05 Clinic</td>
                            <td>P. Phiri</td>
                             <td><span style="color:var(--red);">- 5 Days</span></td>
                            <td><span style="color:var(--orange);">+ 2.0%</span></td>
                            <td>92%</td>
                            <td><span class="status pending">Attention</span></td>
                        </tr>
                         <tr>
                            <td style="font-weight:600;">LIL-02 Mall</td>
                            <td>D. Moyo</td>
                            <td><span style="color:var(--emerald);">On Track</span></td>
                            <td><span style="color:var(--emerald);">On Track</span></td>
                            <td>95%</td>
                            <td><span class="status active">Good</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `; 
    }

    getResourcesView() { 
        return `
            <div class="data-card">
                 <div class="data-card-header">
                    <div class="card-title">Resource Allocation & Efficiency</div>
                     <button class="btn btn-secondary" onclick="window.drawer.open('Shift Plan', window.DrawerTemplates.shiftPlan)">Shift Plan</button>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px; padding:24px; border-bottom:1px solid var(--slate-200);">
                     <div style="text-align:center;">
                        <div style="font-size:32px; font-weight:700; color:var(--blue);">124</div>
                        <div style="font-size:12px; color:var(--slate-500);">Total Personnel Active</div>
                     </div>
                      <div style="text-align:center;">
                        <div style="font-size:32px; font-weight:700; color:var(--emerald);">94%</div>
                        <div style="font-size:12px; color:var(--slate-500);">Labor Efficiency Rate</div>
                     </div>
                      <div style="text-align:center;">
                        <div style="font-size:32px; font-weight:700; color:var(--orange);">MWK 1.2M</div>
                        <div style="font-size:12px; color:var(--slate-500);">Daily Labor Cost</div>
                     </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Team / Gang</th>
                            <th>Site</th>
                            <th>Size</th>
                            <th>Task</th>
                            <th>Output %</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight:600;">Concreting Gang A</td>
                            <td>CEN-01</td>
                            <td>12</td>
                            <td>Foundations</td>
                            <td><span class="status active">105%</span></td>
                        </tr>
                        <tr>
                            <td style="font-weight:600;">Bricklayers Team B</td>
                            <td>MZ-05</td>
                            <td>8</td>
                            <td>Superstructure</td>
                            <td><span class="status pending">85%</span></td>
                        </tr>
                         <tr>
                            <td style="font-weight:600;">Steel Fixers</td>
                            <td>LIL-02</td>
                            <td>6</td>
                            <td>Rebar Prep</td>
                            <td><span class="status active">98%</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `; 
    }

    getSupplyView() { 
        return `
             <div class="data-card">
                 <div class="data-card-header">
                    <div class="card-title">Supply Chain Tracking</div>
                    <button class="btn btn-secondary"><i class="fas fa-truck"></i> View Fleet</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Order Ref</th>
                            <th>Supplier</th>
                            <th>Material</th>
                            <th>Qty</th>
                            <th>Destination</th>
                            <th>ETA</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="mono-val">PO-2025-882</td>
                            <td>Malawi Cement</td>
                            <td>Cement 42.5N</td>
                            <td>600 Bags</td>
                            <td>CEN-01</td>
                            <td style="color:var(--emerald); font-weight:700;">Today</td>
                            <td><span class="status active">In Transit</span></td>
                        </tr>
                         <tr>
                            <td class="mono-val">PO-2025-885</td>
                            <td>BuildRite</td>
                            <td>Reinforcement Bars</td>
                            <td>12 Tons</td>
                            <td>MZ-05</td>
                            <td>Tomorrow</td>
                            <td><span class="status pending">Loading</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `; 
    }

    getInventoryView() { 
        return `
             <div class="data-card">
                 <div class="data-card-header">
                    <div class="card-title">Global Inventory Levels (Warehouse & Sites)</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Central Store</th>
                            <th>CEN-01 Site</th>
                            <th>MZ-05 Site</th>
                            <th>Total Stock</th>
                            <th>Re-Order Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight:600;">Cement (50kg)</td>
                            <td>5,000</td>
                            <td>450</td>
                            <td>120</td>
                            <td style="font-weight:700;">5,570</td>
                            <td><span class="status active">OK</span></td>
                        </tr>
                         <tr>
                            <td style="font-weight:600;">Diesel (Liters)</td>
                            <td>15,000</td>
                            <td>2,200</td>
                            <td>800</td>
                            <td style="font-weight:700;">18,000</td>
                            <td><span class="status active">OK</span></td>
                        </tr>
                         <tr>
                            <td style="font-weight:600;">Safety Boots (Pairs)</td>
                            <td>12</td>
                            <td>5</td>
                            <td>2</td>
                            <td style="font-weight:700;">19</td>
                            <td><span class="status alert">Critical</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `; 
    }

    getSafetyView() { 
        return `
            <div class="data-card">
                 <div class="data-card-header">
                    <div class="card-title">Safety Audits & Compliance</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('New Safety Audit', window.DrawerTemplates.newAudit)">New Audit</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Audit Date</th>
                            <th>Site</th>
                            <th>Auditor</th>
                            <th>Score</th>
                            <th>Major Findings</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Oct 10, 2025</td>
                            <td>CEN-01 Unilia</td>
                            <td>Safety Officer</td>
                            <td style="font-weight:700; color:var(--emerald);">98%</td>
                            <td>None</td>
                            <td><span class="status active">Passed</span></td>
                        </tr>
                        <tr>
                            <td>Oct 05, 2025</td>
                            <td>MZ-05 Clinic</td>
                            <td>Ext. Consultant</td>
                            <td style="font-weight:700; color:var(--orange);">85%</td>
                            <td>Site hoarding damage</td>
                            <td><span class="status pending">Corrective Action</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `; 
    }

}
