export class EquipmentCoordinatorDashboard {
    constructor() {
        this.currentView = 'dashboard';
    }

    render() {
        return this.getTemplate();
    }

    getTemplate() {
        return `
            <div id="ec-module" class="animate-fade-in">
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
                  <span>Fleet Workspace</span>
                  <i class="fas fa-chevron-right" style="font-size: 9px;"></i>
                  <span>Dashboard</span>
                </div>
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">Fleet Overview</h1>
                    <div class="context-strip">
                      <span class="context-value">45</span> Total Assets
                      <div class="context-dot"></div>
                      <span class="context-value" style="color: var(--emerald);">85% Available</span>
                      <div class="context-dot"></div>
                      <span style="color: var(--red); font-weight: 600;">1 Security Alert</span>
                    </div>
                  </div>
                  <button class="btn btn-action" onclick="window.drawer.open('Assign Equipment', window.DrawerTemplates.assignEquipment)">
                    <i class="fas fa-key"></i>
                    <span>Assign Equipment</span>
                  </button>
                </div>
            </div>
        `;
    }

    getStatsGridHTML() {
        return `
            <div class="stats-grid">
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Utilization Rate</span><i class="fas fa-gauge-high" style="color: var(--blue);"></i></div>
                  <div class="stat-value">78%</div>
                  <div class="stat-sub">35 Assets Deployed</div>
               </div>
               <div class="stat-card warn" style="cursor: pointer;" onclick="window.drawer.open('Schedule Maintenance', window.DrawerTemplates.scheduleMaintenance)">
                  <div class="stat-header"><span class="stat-label" style="color: var(--amber);">Maintenance Due</span><i class="fas fa-wrench" style="color: var(--amber);"></i></div>
                  <div class="stat-value" style="color: var(--amber);">2</div>
                  <div class="stat-sub">Scheduled Next 48h</div>
               </div>
               <div class="stat-card alert">
                  <div class="stat-header"><span class="stat-label" style="color: var(--red);">Security Alerts</span><i class="fas fa-lock-open" style="color: var(--red);"></i></div>
                  <div class="stat-value" style="color: var(--red);">1</div>
                  <div class="stat-sub">Geo-Fence Breach (EQP-023)</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Total Fleet</span><i class="fas fa-truck-front" style="color: var(--slate-600);"></i></div>
                  <div class="stat-value">45</div>
                  <div class="stat-sub">Value: MWK 3.5B</div>
               </div>
            </div>
        `;
    }

    getDataCardHTML() {
        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Real-Time Fleet Status</div>
                <button class="btn btn-secondary">Map View</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Equipment Name</th>
                    <th>Current Location</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr onclick="window.drawer.open('Asset Details', window.DrawerTemplates.assetDetails)">
                    <td><span class="mono-val">EQP-045</span></td>
                    <td style="font-weight: 600;">Caterpillar 320D Excavator</td>
                    <td><span class="gps-tag" style="background: var(--slate-800); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: 'JetBrains Mono';">-13.96, 33.77</span> CEN-01</td>
                    <td>John Banda (PM)</td>
                    <td><span class="status active" style="background: #DCFCE7; color: #166534; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">In Use</span></td>
                    <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">Track</button></td>
                  </tr>
                  <tr onclick="window.drawer.open('Asset Details', window.DrawerTemplates.assetDetails)">
                    <td><span class="mono-val">EQP-012</span></td>
                    <td style="font-weight: 600;">Tipper Truck 10T</td>
                    <td><span class="gps-tag" style="background: var(--slate-800); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: 'JetBrains Mono';">-13.98, 33.75</span> Transit</td>
                    <td>Davi Moyo</td>
                    <td><span class="status transit" style="background: #E0E7FF; color: #3730A3; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">Moving</span></td>
                    <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">Track</button></td>
                  </tr>
                  <tr style="background: #FEF2F2;" onclick="window.toast.show('GPS Trace Opened (Mock)', 'error')">
                    <td><span class="mono-val">EQP-023</span></td>
                    <td style="font-weight: 600; color: var(--red);">Honda Generator 5kVA</td>
                    <td><span class="gps-tag" style="background: var(--red); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: 'JetBrains Mono';">-14.12, 33.56</span> UNKNOWN</td>
                    <td>-</td>
                    <td><span class="status alert" style="background: #FEE2E2; color: #991B1B; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">THEFT ALERT</span></td>
                    <td><button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;">Lock</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
        `;
    }
}
