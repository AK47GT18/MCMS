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
                    ${this.getCurrentViewHTML()}
                </div>
            </div>
        `;
    }

    getCurrentViewHTML() {
        switch(this.currentView) {
            case 'dashboard': return this.getDashboardView();
            case 'registry': return this.getRegistryView();
            case 'tracking': return this.getTrackingView();
            case 'maintenance': return this.getMaintenanceView();
            case 'costs': return this.getCostsView();
            case 'utilization': return this.getUtilizationView();
            case 'operators': return this.getOperatorsView();
            default: return `<div class="p-4">View ${this.currentView} not found</div>`;
        }
    }

    getHeaderHTML() {
        const headers = {
            'dashboard': { title: 'Fleet Overview', context: '45 Total Assets | 85% Available' },
            'registry': { title: 'Asset Registry', context: 'Master Equipment List' },
            'tracking': { title: 'GPS Tracking', context: 'Live Location Data' },
            'maintenance': { title: 'Service Schedule', context: 'Preventative Maintenance' },
            'costs': { title: 'Repair Costs', context: 'Fleet OpEx' },
            'utilization': { title: 'Utilization Reports', context: 'Efficiency Metrics' },
            'operators': { title: 'Operator Logs', context: 'Driver Activity' }
        };
        const current = headers[this.currentView] || { title: 'Fleet Management', context: '' };

        return `
            <div class="page-header">
                <div class="breadcrumb">
                  <span>Fleet Workspace</span>
                  <i class="fas fa-chevron-right" style="font-size: 9px;"></i>
                  <span>${current.title}</span>
                </div>
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">${current.title}</h1>
                    <div class="context-strip">
                      <span class="context-value">${current.context}</span>
                      ${this.currentView === 'dashboard' ? `
                           <div class="context-dot"></div>
                           <span style="color: var(--red); font-weight: 600;">1 Security Alert</span>
                      ` : ''}
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
                    <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Asset Tracking', window.DrawerTemplates.assetDetails)">Track</button></td>
                  </tr>
                  <tr onclick="window.drawer.open('Asset Details', window.DrawerTemplates.assetDetails)">
                    <td><span class="mono-val">EQP-012</span></td>
                    <td style="font-weight: 600;">Tipper Truck 10T</td>
                    <td><span class="gps-tag" style="background: var(--slate-800); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: 'JetBrains Mono';">-13.98, 33.75</span> Transit</td>
                    <td>Davi Moyo</td>
                    <td><span class="status transit" style="background: #E0E7FF; color: #3730A3; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">Moving</span></td>
                    <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Asset Tracking', window.DrawerTemplates.assetDetails)">Track</button></td>
                  </tr>
                  <tr style="background: #FEF2F2;" onclick="window.toast.show('GPS Trace Opened (Mock)', 'error')">
                    <td><span class="mono-val">EQP-023</span></td>
                    <td style="font-weight: 600; color: var(--red);">Honda Generator 5kVA</td>
                    <td><span class="gps-tag" style="background: var(--red); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: 'JetBrains Mono';">-14.12, 33.56</span> UNKNOWN</td>
                    <td>-</td>
                    <td><span class="status alert" style="background: #FEE2E2; color: #991B1B; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">THEFT ALERT</span></td>
                    <td><button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Security Lock', window.DrawerTemplates.investigation)">Lock</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
        `;
    }

    getRegistryView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Full Asset Registry</div>
                    <div style="display:flex; gap:8px;">
                        <input type="text" placeholder="Search assets..." style="padding:6px 12px; border:1px solid var(--slate-300); border-radius:4px; font-size:13px;">
                        <button class="btn btn-secondary"><i class="fas fa-filter"></i> Category</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Asset ID</th>
                            <th>Description</th>
                            <th>Brand/Model</th>
                            <th>Year</th>
                            <th>Hours/Km</th>
                            <th>Condition</th>
                            <th>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                         <tr onclick="window.drawer.open('Asset Details', window.DrawerTemplates.assetDetails)">
                            <td><span class="mono-val">EQP-045</span></td>
                            <td style="font-weight:600;">Excavator 20T</td>
                            <td>CAT 320D</td>
                            <td>2019</td>
                            <td>8,450 Hrs</td>
                            <td><span class="status active">Good</span></td>
                            <td>CEN-01 Unilia</td>
                        </tr>
                        <tr onclick="window.drawer.open('Asset Details', window.DrawerTemplates.assetDetails)">
                            <td><span class="mono-val">EQP-012</span></td>
                            <td style="font-weight:600;">Tipper 10T</td>
                            <td>Tata Prima</td>
                            <td>2021</td>
                            <td>120,500 Km</td>
                            <td><span class="status pending">Fair</span></td>
                            <td>In Transit</td>
                        </tr>
                        <tr onclick="window.drawer.open('Asset Details', window.DrawerTemplates.assetDetails)">
                             <td><span class="mono-val">EQP-008</span></td>
                             <td style="font-weight:600;">Concrete Mixer</td>
                             <td>Winget 400L</td>
                             <td>2018</td>
                             <td>N/A</td>
                             <td><span class="status locked">Poor</span></td>
                             <td>MZ-05 Yard</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    getTrackingView() {
         return `
            <div class="data-card" style="height:500px; display:flex; flex-direction:column;">
                <div class="data-card-header">
                    <div class="card-title">Live GPS Map</div>
                    <div style="font-size:12px; color:var(--slate-500);">Last Update: Just now</div>
                </div>
                <div style="flex:1; background:#e2e8f0; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; color:var(--slate-500); font-weight:600;">
                     <div style="position:absolute; top:20%; left:30%; transform:translate(-50%, -50%); text-align:center;">
                        <i class="fas fa-map-marker-alt" style="color:var(--blue); font-size:24px; animation: bounce 2s infinite;"></i>
                        <div style="background:white; padding:4px 8px; border-radius:4px; font-size:11px; margin-top:4px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">CEN-01: Excavator</div>
                     </div>
                      <div style="position:absolute; top:60%; left:70%; transform:translate(-50%, -50%); text-align:center;">
                        <i class="fas fa-truck" style="color:var(--orange); font-size:20px;"></i>
                        <div style="background:white; padding:4px 8px; border-radius:4px; font-size:11px; margin-top:4px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">Transit: Tipper (Speed: 65km/h)</div>
                     </div>
                      <div style="position:absolute; top:80%; left:20%; transform:translate(-50%, -50%); text-align:center;">
                        <i class="fas fa-triangle-exclamation" style="color:var(--red); font-size:20px; animation: pulse 1s infinite;"></i>
                        <div style="background:var(--red); color:white; padding:4px 8px; border-radius:4px; font-size:11px; margin-top:4px; box-shadow:0 2px 4px rgba(0,0,0,0.2);">ALERT: Generator Move</div>
                     </div>
                     <!-- Placeholder Map Background -->
                     <img src="https://upload.wikimedia.org/wikipedia/commons/e/ec/USA_location_map_scheme.svg" style="opacity:0.1; width:100%; height:100%; object-fit:cover; position:absolute; z-index:0;">
                </div>
            </div>
        `;
    }

    getMaintenanceView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Service Schedule</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Log Maintenance', window.DrawerTemplates.completeMaintenance)"><i class="fas fa-wrench"></i> Log Maintenance</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Due Date</th>
                            <th>Asset</th>
                            <th>Service Type</th>
                            <th>Technician</th>
                            <th>Est. Cost</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="mono-val" style="color:var(--red); font-weight:700;">Tommorrow</td>
                            <td>CAT 320D (EQP-045)</td>
                            <td>500 Hour Service</td>
                            <td>Barloworld</td>
                            <td>MWK 1.2M</td>
                            <td><span class="status locked">Scheduled</span></td>
                        </tr>
                        <tr>
                            <td class="mono-val">Oct 30, 2025</td>
                            <td>Tata Tipper (EQP-012)</td>
                            <td>Brake Overhaul</td>
                            <td>Internal</td>
                            <td>MWK 450K</td>
                            <td><span class="status pending">Planned</span></td>
                        </tr>
                         <tr>
                            <td class="mono-val" style="color:var(--emerald);">Completed</td>
                            <td>Generator (EQP-023)</td>
                            <td>Oil Change</td>
                            <td>Site Mech</td>
                            <td>MWK 80K</td>
                            <td><span class="status active">Done</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    getCostsView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Repair & Maintenance Costs (YTD)</div>
                    <button class="btn btn-secondary">Export CSV</button>
                </div>
                <div style="padding:24px; display:grid; grid-template-columns:1fr 1fr; gap:24px;">
                    <div style="text-align:center; padding:20px; background:var(--slate-50); border-radius:8px;">
                        <div style="font-size:12px; color:var(--slate-500); text-transform:uppercase; font-weight:700;">Total Spend</div>
                        <div style="font-size:24px; font-weight:800; color:var(--slate-800);">MWK 24.5M</div>
                        <div style="color:var(--red); font-size:12px; margin-top:4px;"><i class="fas fa-arrow-up"></i> 12% vs Budget</div>
                    </div>
                     <div style="text-align:center; padding:20px; background:var(--slate-50); border-radius:8px;">
                        <div style="font-size:12px; color:var(--slate-500); text-transform:uppercase; font-weight:700;">Avg Cost/Asset</div>
                        <div style="font-size:24px; font-weight:800; color:var(--slate-800);">MWK 650K</div>
                         <div style="color:var(--emerald); font-size:12px; margin-top:4px;"><i class="fas fa-arrow-down"></i> 5% vs Industry Avg</div>
                    </div>
                </div>
                 <table>
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Cost Center</th>
                            <th>Parts</th>
                            <th>Labor</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>September</td>
                            <td>Excavators</td>
                            <td>4.2M</td>
                            <td>1.1M</td>
                            <td style="font-weight:700;">5.3M</td>
                        </tr>
                        <tr>
                            <td>September</td>
                            <td>Trucks</td>
                            <td>1.5M</td>
                            <td>0.5M</td>
                            <td style="font-weight:700;">2.0M</td>
                        </tr>
                        <tr>
                            <td>August</td>
                            <td>Small Plant</td>
                            <td>0.3M</td>
                            <td>0.1M</td>
                            <td style="font-weight:700;">0.4M</td>
                        </tr>
                    </tbody>
                 </table>
            </div>
        `;
    }

    getUtilizationView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Asset Utilization</div>
                </div>
                <table>
                     <thead>
                        <tr>
                            <th>Category</th>
                            <th>Total Units</th>
                            <th>Deployed</th>
                            <th>Idle</th>
                            <th>In Repair</th>
                            <th>Util. %</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight:600;">Heavy Earthmoving</td>
                            <td>5</td>
                            <td>4</td>
                            <td>0</td>
                            <td>1</td>
                            <td><span class="status active">80%</span></td>
                        </tr>
                        <tr>
                            <td style="font-weight:600;">Tipper Trucks</td>
                            <td>8</td>
                            <td>7</td>
                            <td>1</td>
                            <td>0</td>
                            <td><span class="status active">87.5%</span></td>
                        </tr>
                         <tr>
                            <td style="font-weight:600;">Generators</td>
                            <td>10</td>
                            <td>5</td>
                            <td>5</td>
                            <td>0</td>
                            <td><span class="status pending">50%</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    getOperatorsView() {
         return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Operator Daily Logs & Incidents</div>
                    <button class="btn btn-secondary" onclick="window.drawer.open('Operator Approvals', window.DrawerTemplates.attendanceLog)">Approvals</button>
                </div>
                <table>
                     <thead>
                        <tr>
                            <th>Date</th>
                            <th>Operator</th>
                            <th>Machine</th>
                            <th>Hours Run</th>
                            <th>Fuel Used</th>
                            <th>Issues Reported</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Today</td>
                            <td>J. Banda</td>
                            <td>CAT 320D</td>
                            <td>6.5 Hrs</td>
                            <td>120 L</td>
                            <td><span style="color:var(--emerald);"><i class="fas fa-check"></i> None</span></td>
                        </tr>
                         <tr>
                            <td>Today</td>
                            <td>P. Phiri</td>
                            <td>Tata Tipper</td>
                            <td>8.0 Hrs</td>
                            <td>65 L</td>
                            <td><span style="color:var(--orange);"><i class="fas fa-triangle-exclamation"></i> AC Fault</span></td>
                        </tr>
                         <tr>
                            <td>Yesterday</td>
                            <td>M. Chibwe</td>
                            <td>Grader</td>
                            <td>5.5 Hrs</td>
                            <td>90 L</td>
                             <td><span style="color:var(--emerald);"><i class="fas fa-check"></i> None</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
}
