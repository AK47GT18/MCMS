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
            'dashboard': { title: 'Dashboard', context: '45 Total Assets | 85% Available' },
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
                  <div style="display:flex; gap:8px;">
                    <button class="btn btn-secondary" onclick="window.drawer.open('Request New Vehicle', window.DrawerTemplates.requestNewVehicle)">
                        <i class="fas fa-truck-pickup"></i>
                        <span>Request Vehicle</span>
                    </button>
                    <button class="btn btn-action" onclick="window.drawer.open('Assign Equipment', window.DrawerTemplates.assignEquipment)">
                        <i class="fas fa-key"></i>
                        <span>Assign Equipment</span>
                    </button>
                  </div>
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
                  <div class="stat-header"><span class="stat-label">Fleet Utilization</span><i class="fas fa-gauge-high" style="color: var(--blue);"></i></div>
                  <div class="stat-value">78.4%</div>
                  <div class="stat-sub"><span style="color: var(--emerald); font-weight: 700;"><i class="fas fa-caret-up"></i> 5.2%</span> vs last month</div>
               </div>
               <div class="stat-card" style="border-color: var(--orange-light); background: #fffbf7;" onclick="window.app.loadPage('maintenance')">
                  <div class="stat-header"><span class="stat-label" style="color: var(--orange);">Maintenance Due</span><i class="fas fa-wrench" style="color: var(--orange);"></i></div>
                  <div class="stat-value" style="color: var(--orange);">02</div>
                  <div class="stat-sub">Critical service required next 48h</div>
               </div>
               <div class="stat-card" style="border-color: var(--red-light); background: #fff5f5;">
                  <div class="stat-header"><span class="stat-label" style="color: var(--red);">Low Fuel Alerts</span><i class="fas fa-gas-pump" style="color: var(--red);"></i></div>
                  <div class="stat-value" style="color: var(--red);">01</div>
                  <div class="stat-sub">EQP-023 needs refuel</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Total Fleet Value</span><i class="fas fa-coins" style="color: var(--slate-600);"></i></div>
                  <div class="stat-value">MWK 3.52B</div>
                  <div class="stat-sub">45 Registered Assets</div>
               </div>
            </div>
        `;
    }

    getDataCardHTML() {
        return `
            <div class="data-card">
              <div class="data-card-header" style="background: var(--slate-50); border-bottom: 1px solid var(--slate-200);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; background: white; border-radius: 6px; border: 1px solid var(--slate-200); display: flex; align-items: center; justify-content: center; color: var(--slate-600);">
                        <i class="fas fa-clipboard-check"></i>
                    </div>
                    <div>
                        <div class="card-title" style="font-size: 14px; font-weight: 700;">Asset Check-In / Check-Out Log</div>
                        <div style="font-size: 11px; color: var(--slate-500); font-weight: 500;">Track equipment usage, returns, and refuel status</div>
                    </div>
                </div>
                <button class="btn btn-secondary" onclick="window.app.loadPage('registry')">
                    <i class="fas fa-list"></i> Full Registry
                </button>
              </div>
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: white;">
                      <th style="padding: 16px 20px;">Asset ID</th>
                      <th>Equipment Name</th>
                      <th>Last Location</th>
                      <th>Last Checked Out By</th>
                      <th>Fuel Level</th>
                      <th>Status</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr onclick="window.drawer.open('Asset Details', window.DrawerTemplates.assetDetails)">
                      <td style="padding: 16px 20px;"><span class="mono-val" style="background: var(--slate-100); padding: 2px 6px; border-radius: 4px; font-weight: 600;">EQP-045</span></td>
                      <td>
                        <div style="font-weight: 700; color: var(--slate-900);">Caterpillar 320D Excavator</div>
                        <div style="font-size: 11px; color: var(--slate-500);">Heavy Earthmoving • S/N: CAT-8892</div>
                      </td>
                      <td>
                        <div style="font-weight: 600; color: var(--slate-700);">CEN-01 Unilia Site</div>
                        <div style="font-size: 10px; color: var(--slate-400);">Checked in: Jan 15, 08:30</div>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 24px; height: 24px; background: var(--slate-200); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">JB</div>
                            <span style="font-weight: 500;">John Banda (PM)</span>
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="width: 50px; height: 6px; background: var(--slate-200); border-radius: 3px;"><div style="width: 85%; height: 100%; background: var(--emerald); border-radius: 3px;"></div></div>
                            <span style="font-size: 11px; font-weight: 600; color: var(--emerald);">85%</span>
                        </div>
                      </td>
                      <td><span class="status active" style="font-size: 10px; font-weight: 700; text-transform: uppercase;">Checked Out</span></td>
                      <td style="text-align: right; padding-right: 20px;">
                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; border-radius: 4px; font-weight: 700;">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                      </td>
                    </tr>
                    <tr onclick="window.drawer.open('Asset Details', window.DrawerTemplates.assetDetails)">
                      <td style="padding: 16px 20px;"><span class="mono-val" style="background: var(--slate-100); padding: 2px 6px; border-radius: 4px; font-weight: 600;">EQP-012</span></td>
                      <td>
                        <div style="font-weight: 700; color: var(--slate-900);">Tata Tipper Truck 10T</div>
                        <div style="font-size: 11px; color: var(--slate-500);">Logistics • S/N: TATA-Prima-12</div>
                      </td>
                      <td>
                        <div style="font-weight: 600; color: var(--slate-700);">MZ-05 Mzimba Clinic</div>
                        <div style="font-size: 10px; color: var(--slate-400);">Checked out: Jan 16, 06:00</div>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 24px; height: 24px; background: var(--slate-200); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">DM</div>
                            <span style="font-weight: 500;">Davi Moyo</span>
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="width: 50px; height: 6px; background: var(--slate-200); border-radius: 3px;"><div style="width: 45%; height: 100%; background: var(--orange); border-radius: 3px;"></div></div>
                            <span style="font-size: 11px; font-weight: 600; color: var(--orange);">45%</span>
                        </div>
                      </td>
                      <td><span class="status transit" style="font-size: 10px; font-weight: 700; text-transform: uppercase;">In Transit</span></td>
                      <td style="text-align: right; padding-right: 20px;">
                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; border-radius: 4px; font-weight: 700;">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                      </td>
                    </tr>
                    <tr style="background: #FFFBEB;" onclick="window.drawer.open('Refuel Required', window.DrawerTemplates.assetDetails)">
                      <td style="padding: 16px 20px;"><span class="mono-val" style="background: var(--orange); color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">EQP-023</span></td>
                      <td>
                        <div style="font-weight: 700; color: var(--orange-hover);">Honda Generator 5kVA</div>
                        <div style="font-size: 11px; color: #92400E;">Power Gen • S/N: HON-GEN-23</div>
                      </td>
                      <td>
                        <div style="font-weight: 600; color: var(--slate-700);">CEN-01 Block A Store</div>
                        <div style="font-size: 10px; color: var(--slate-400);">Returned: Jan 14, 17:00</div>
                      </td>
                       <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 24px; height: 24px; background: var(--slate-200); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">PP</div>
                            <span style="font-weight: 500;">Peter Phiri</span>
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="width: 50px; height: 6px; background: var(--slate-200); border-radius: 3px;"><div style="width: 15%; height: 100%; background: var(--red); border-radius: 3px;"></div></div>
                            <span style="font-size: 11px; font-weight: 600; color: var(--red);">15%</span>
                        </div>
                      </td>
                      <td><span class="status" style="font-size: 10px; font-weight: 800; text-transform: uppercase; background: #FEF3C7; color: #92400E;">Needs Refuel</span></td>
                      <td style="text-align: right; padding-right: 20px;">
                        <button class="btn btn-action" style="padding: 6px 12px; font-size: 11px; border-radius: 4px; font-weight: 700;">
                            <i class="fas fa-gas-pump"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title"><i class="fas fa-clipboard-list"></i> Asset Movement Log</div>
                    <div style="display: flex; gap: 8px;">
                        <select class="form-input" style="padding: 8px 12px; font-size: 12px; border-radius: 6px;">
                            <option>All Equipment</option>
                            <option>Excavators</option>
                            <option>Trucks</option>
                            <option>Generators</option>
                        </select>
                        <button class="btn btn-secondary btn-sm"><i class="fas fa-filter"></i> Filter</button>
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date/Time</th>
                                <th>Asset</th>
                                <th>Action</th>
                                <th>Location</th>
                                <th>User</th>
                                <th>Fuel (Before / After)</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="font-family: 'JetBrains Mono'; font-size: 11px; color: var(--slate-500);">Jan 16, 06:00</td>
                                <td><span class="mono-val">EQP-012</span> Tipper Truck</td>
                                <td><span class="status active" style="font-size: 10px;">CHECK OUT</span></td>
                                <td style="font-weight: 600;">MZ-05 Mzimba Clinic</td>
                                <td>Davi Moyo</td>
                                <td><span style="color: var(--orange);">60%</span> → <span style="color: var(--orange);">45%</span></td>
                                <td style="color: var(--slate-500); font-size: 11px;">Material delivery run</td>
                            </tr>
                            <tr>
                                <td style="font-family: 'JetBrains Mono'; font-size: 11px; color: var(--slate-500);">Jan 15, 08:30</td>
                                <td><span class="mono-val">EQP-045</span> CAT Excavator</td>
                                <td><span class="status active" style="font-size: 10px;">CHECK OUT</span></td>
                                <td style="font-weight: 600;">CEN-01 Unilia Site</td>
                                <td>John Banda (PM)</td>
                                <td><span style="color: var(--emerald);">100%</span> → <span style="color: var(--emerald);">85%</span></td>
                                <td style="color: var(--slate-500); font-size: 11px;">Foundation excavation</td>
                            </tr>
                            <tr>
                                <td style="font-family: 'JetBrains Mono'; font-size: 11px; color: var(--slate-500);">Jan 14, 17:00</td>
                                <td><span class="mono-val">EQP-023</span> Generator 5kVA</td>
                                <td><span class="status pending" style="font-size: 10px;">RETURN</span></td>
                                <td style="font-weight: 600;">CEN-01 Block A Store</td>
                                <td>Peter Phiri</td>
                                <td><span style="color: var(--red);">15%</span> → <span style="color: var(--red);">15%</span></td>
                                <td style="color: var(--red); font-size: 11px; font-weight: 600;">⚠ Needs Refuel</td>
                            </tr>
                             <tr>
                                <td style="font-family: 'JetBrains Mono'; font-size: 11px; color: var(--slate-500);">Jan 14, 07:00</td>
                                <td><span class="mono-val">EQP-023</span> Generator 5kVA</td>
                                <td><span class="status active" style="font-size: 10px;">CHECK OUT</span></td>
                                <td style="font-weight: 600;">CEN-01 Block B</td>
                                <td>Peter Phiri</td>
                                <td><span style="color: var(--emerald);">80%</span> → <span style="color: var(--red);">15%</span></td>
                                <td style="color: var(--slate-500); font-size: 11px;">Power for welding</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    initializeTrackingMap() {
        setTimeout(() => {
            const mapContainer = document.getElementById('fleet-tracking-map');
            if (!mapContainer) return;

            if (typeof L === 'undefined') {
                mapContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--red);">Leaflet JS not found. Please refresh.</div>';
                return;
            }

            // Clear loading placeholder
            mapContainer.innerHTML = '';

            // Center on Malawi
            const center = [-13.9626, 33.7741];
            const map = L.map('fleet-tracking-map').setView(center, 12);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            const assets = [
                { id: 'EQP-045', name: 'CAT Excavator', coords: [-13.9626, 33.7741], status: 'In Use', icon: 'truck-front', color: 'var(--emerald)' },
                { id: 'EQP-012', name: 'Tipper Truck', coords: [-13.9800, 33.7500], status: 'Moving', icon: 'truck', color: 'var(--blue)' },
                { id: 'EQP-023', name: 'Generator 5kVA', coords: [-14.1200, 33.5600], status: 'Alert', icon: 'triangle-exclamation', color: 'var(--red)' }
            ];

            assets.forEach(asset => {
                const marker = L.marker(asset.coords).addTo(map);
                marker.bindPopup(`
                    <div style="font-family: inherit; font-size: 12px;">
                        <div style="font-weight: 700; color: var(--slate-900); margin-bottom: 4px;">${asset.name}</div>
                        <div style="color: var(--slate-500); margin-bottom: 8px;">ID: ${asset.id}</div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="status active" style="font-size: 10px; background: ${asset.color}20; color: ${asset.color}">${asset.status}</span>
                            <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="window.drawer.open('Asset Details', window.DrawerTemplates.assetDetails)">Details</button>
                        </div>
                    </div>
                `);
            });

            // Force recalculation
            map.invalidateSize();
            setTimeout(() => map.invalidateSize(), 200);
        }, 300);
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

    // --- Equipment Assignment Helpers ---

    showRecommendedVehicles(projectType) {
        const vehicleMap = {
            'civil_works': ['Excavator', 'Bulldozer', 'Tower Crane', 'Concrete Mixer', 'Compactor'],
            'bridge_construction': ['Pile Driver', 'Mobile Crane', 'Excavator', 'Concrete Pump', 'Barge'],
            'road_works': ['Grader', 'Road Roller', 'Asphalt Paver', 'Tipper Truck', 'Water Bowser'],
            'building_works': ['Tower Crane', 'Concrete Mixer', 'Scaffolding Lift', 'Excavator', 'Forklift']
        };

        const vehicles = vehicleMap[projectType] || vehicleMap['civil_works'];
        const container = document.getElementById('recommended-list');
        if (container) {
            container.innerHTML = vehicles.map(v => 
                `<span style="background: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid #BFDBFE;">${v}</span>`
            ).join('');
        }
    }

    checkEquipmentConflict(equipmentId) {
        // Simulate conflict check - in real app this would query the API
        const conflictingEquipment = {
            'EQP-045': { project: 'CEN-01 Unilia', returnDate: 'Feb 15, 2026' },
            'EQP-012': { project: 'MZ-05 Mzimba Clinic', returnDate: 'Feb 20, 2026' }
        };

        const alertEl = document.getElementById('equipment-conflict-alert');
        const messageEl = document.getElementById('conflict-message');
        
        if (!alertEl || !messageEl) return;

        if (conflictingEquipment[equipmentId]) {
            const conflict = conflictingEquipment[equipmentId];
            messageEl.innerHTML = `This equipment is currently assigned to <strong>${conflict.project}</strong> until <strong>${conflict.returnDate}</strong>.`;
            alertEl.style.display = 'block';
        } else {
            alertEl.style.display = 'none';
        }
    }

    stallRequest() {
        const alertEl = document.getElementById('equipment-conflict-alert');
        if (alertEl) {
            alertEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-clock" style="color: var(--blue);"></i>
                    <span style="font-size: 12px; font-weight: 600; color: var(--blue);">Request Stalled</span>
                </div>
                <div style="font-size: 11px; color: var(--slate-600); margin-top: 4px;">
                    You will be notified when this equipment becomes available.
                </div>
            `;
            alertEl.style.background = '#EFF6FF';
            alertEl.style.borderColor = '#BFDBFE';
        }
        if (window.toast) {
            window.toast.show('Request stalled - will notify when available', 'info');
        }
    }

    reassignEquipment() {
        const alertEl = document.getElementById('equipment-conflict-alert');
        if (alertEl) {
            alertEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-check-circle" style="color: var(--emerald);"></i>
                    <span style="font-size: 12px; font-weight: 600; color: var(--emerald);">Reassignment Approved</span>
                </div>
                <div style="font-size: 11px; color: var(--slate-600); margin-top: 4px;">
                    Previous assignment will be terminated. Proceed with handover.
                </div>
            `;
            alertEl.style.background = '#ECFDF5';
            alertEl.style.borderColor = '#A7F3D0';
        }
        if (window.toast) {
            window.toast.show('Reassignment approved - previous assignment terminated', 'success');
        }
    }
}
