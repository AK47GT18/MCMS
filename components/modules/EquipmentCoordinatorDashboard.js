import { StatCard } from '../ui/StatCard.js';
import { notificationService } from '../../src/services/notifications.service.js';

export class EquipmentCoordinatorDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.hubActiveTab = 'field';
        
        // --- REACTIVE STATE (SESSION-BASED) ---
        this.inventory = {
            'Cement OPC': { qty: 450, unit: 'Bags', id: 'MAT-001', thresh: 100, price: 75000 },
            'Bitumen G-Grade': { qty: 12, unit: 'Drums', id: 'MAT-082', thresh: 30, price: 425000 },
            'Diesel Fuel': { qty: 5000, unit: 'Liters', id: 'MAT-009', thresh: 1000, price: 2800 }
        };

        this.dispatchLogs = [
            { id: 'D-082', project: 'CEN-01 Unilia', section: 'KM 12+500', item: 'Cement OPC', qty: 120, unit: 'Bags', supervisor: 'Kondwani Jere', time: 'Mar 29, 09:12' }
        ];

        this.pendingReceipts = [
            { id: 'PROC-101', name: 'Bitumen G-Grade', qty: 20, unit: 'Drums', vendor: 'Malawi Bitumen Ltd' },
            { id: 'PROC-102', name: 'Cement OPC', qty: 500, unit: 'Bags', vendor: 'Shayona Cement' }
        ];

        // Phase material mapping for the predefined sheet
        this.phaseMaterials = {
            '1': [{ name: 'Survey pegs & paint', unit: 'Set' }, { name: 'Chainsaw fuel', unit: 'Liters' }],
            '2': [{ name: 'Borrow fill (laterite)', unit: 'm³' }, { name: 'Geotextile fabric', unit: 'm²' }],
            '3': [{ name: 'Crushed stone G6', unit: 'm³' }, { name: 'Water for compaction', unit: 'm³' }],
            '4': [{ name: 'Crushed stone G4/G5', unit: 'm³' }, { name: 'Cement OPC', unit: 'Bags' }],
            '5': [{ name: 'Concrete U-drain 300mm', unit: 'm' }, { name: 'HDPE culvert 450mm', unit: 'm' }],
            '6': [{ name: 'Bitumen G-Grade', unit: 'Drums' }, { name: 'Tack coat CSS-1', unit: 'Liters' }]
        };

        // Register module globally
        window.app = window.app || {};
        window.app.ecModule = this;
    }

    render() {
        return this.getTemplate();
    }

    getTemplate() {
        return `
            <div id="ec-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content" id="ec-content-area">
                    ${this.getCurrentViewHTML()}
                </div>
            </div>
        `;
    }

    getCurrentViewHTML() {
        switch(this.currentView) {
            case 'dashboard': return this.getDashboardView();
            case 'requests': return this.getResourceHubView();
            case 'inventory': return this.getInventoryView();
            case 'registry': return this.getRegistryView();
            case 'distribution': return this.getDistributionLogView();
            case 'maintenance': return this.getMaintenanceView();
            case 'utilization': return this.getUtilizationView();
            case 'operators': return this.getOperatorsView();
            default: return `<div class="p-4">View ${this.currentView} not found</div>`;
        }
    }

    getHeaderHTML() {
        const headers = {
            'dashboard': { title: 'Logistics Command', context: 'Fleet Operations & Silo Stock' },
            'requests': { title: 'Logistics Hub', context: 'FS Request Intake & FM Receipts' },
            'inventory': { title: 'Material Inventory', context: 'Consumable Resource Silo' },
            'registry': { title: 'Asset Registry', context: 'Master Equipment List' },
            'distribution': { title: 'Distribution Log', context: 'Project Resource Consumption (Burn)' },
            'maintenance': { title: 'Service Schedule', context: 'Preventative Maintenance' },
            'utilization': { title: 'Utilization Reports', context: 'Efficiency Metrics' },
            'operators': { title: 'Logistics Center', context: 'Daily Machine & Personnel Logs' }
        };
        const current = headers[this.currentView] || { title: 'Logistics Command', context: '' };

        return `
            <div class="page-header">
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">${current.title}</h1>
                    <div class="context-strip">
                      <span class="context-value">${current.context}</span>
                    </div>
                  </div>
                  <div style="display:flex; gap:8px;">
                    <button class="btn btn-secondary" onclick="window.drawer.open('Logistics Dispatch', window.DrawerTemplates.assignResource)">
                        <i class="fas fa-paper-plane"></i>
                        <span>Immediate Dispatch</span>
                    </button>
                    <button class="btn btn-action" onclick="window.app.ecModule?.syncFMProcurement()">
                        <i class="fas fa-sync"></i>
                        <span>Sync FM Receipts</span>
                    </button>
                  </div>
                </div>
            </div>
        `;
    }

    getDashboardView() {
        const lowStockCount = Object.values(this.inventory).filter(i => i.qty <= i.thresh).length;
        return `
            <div class="stats-grid">
                ${StatCard({ title: 'Awaiting Receipt', value: this.pendingReceipts.length.toString(), subtext: 'From FM Procurement', alertColor: 'blue' })}
                ${StatCard({ title: 'Critical Stock', value: lowStockCount.toString().padStart(2,'0'), subtext: 'Materials < Buffers', alertColor: 'red' })}
                ${StatCard({ title: 'Fleet Health', value: '92%', subtext: 'Mechanical Availability', alertColor: 'emerald' })}
                ${StatCard({ title: 'Daily Burn', value: this.dispatchLogs.length.toString(), subtext: 'Fulfillment today', alertColor: 'orange' })}
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 24px;">
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Live Material "Burn" Status</div>
                        <span class="status active">Real-time Stationing</span>
                    </div>
                    <div style="padding: 24px;">
                        <div style="height: 200px; background: var(--slate-50); border-radius: 12px; display: flex; align-items: flex-end; gap: 40px; padding: 20px; border: 1px solid var(--slate-100);">
                            <div style="flex: 1; height: 85%; background: var(--blue); border-radius: 4px; position: relative;">
                                <div style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 10px; color: var(--slate-500);">KM 0-5</div>
                                <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-weight: 700; font-size: 11px;">85%</div>
                            </div>
                            <div style="flex: 1; height: 42%; background: var(--orange); border-radius: 4px; position: relative;">
                                <div style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 10px; color: var(--slate-500);">KM 5-10</div>
                                <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-weight: 700; font-size: 11px;">42%</div>
                            </div>
                            <div style="flex: 1; height: 15%; background: var(--red); border-radius: 4px; position: relative;">
                                <div style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 10px; color: var(--slate-500);">KM 10-15</div>
                                <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-weight: 700; font-size: 11px;">15%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Logistics Status</div>
                    </div>
                    <div style="padding: 16px;">
                        ${Object.entries(this.inventory).map(([name, data]) => `
                            <div style="margin-bottom: 16px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                                    <span style="font-weight: 600;">${name}</span>
                                    <span style="color: ${data.qty <= data.thresh ? 'var(--red)' : '#64748B'}; font-weight: 700;">${data.qty} ${data.unit}</span>
                                </div>
                                <div style="height: 6px; background: var(--slate-100); border-radius: 3px; overflow: hidden;">
                                    <div style="width: ${Math.min(100, (data.qty / 1000) * 100)}%; background: ${data.qty <= data.thresh ? 'var(--red)' : 'var(--blue)'}; height: 100%;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getResourceHubView() {
        const activeTab = this.hubActiveTab || 'field';
        const fieldCount = 2; // Mock count
        const fmCount = this.pendingReceipts.length;

        return `
            <div class="hub-filter-bar" style="display: flex; gap: 12px; margin-bottom: 24px; background: var(--slate-100); padding: 6px; border-radius: 12px; width: fit-content;">
                <button class="btn ${activeTab === 'field' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.ecModule?.switchHubTab('field')">Field Requisitions (${fieldCount})</button>
                <button class="btn ${activeTab === 'fm' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.ecModule?.switchHubTab('fm')">FM Receipts (${fmCount})</button>
            </div>

            ${activeTab === 'fm' ? `
                <div class="data-card animate-slide-up" style="border: 1px solid var(--blue-border); background: #f8fafc;">
                    <div class="data-card-header">
                        <div class="card-title">Pending Receipts from FM (Stefan Mwale)</div>
                    </div>
                    <table>
                        <thead>
                            <tr><th>Inv ID</th><th>Material Name</th><th>Supplier</th><th>Qty Ordered</th><th style="text-align: right;">Action</th></tr>
                        </thead>
                        <tbody>
                            ${this.pendingReceipts.map(item => `
                                <tr>
                                    <td><span class="project-id">${item.id}</span></td>
                                    <td style="font-weight: 700;">${item.name}</td>
                                    <td>${item.vendor}</td>
                                    <td style="font-weight: 800; color: var(--blue);">${item.qty} ${item.unit}</td>
                                    <td style="text-align: right;">
                                        <button class="btn btn-primary" onclick="window.drawer.open('Receipt Confirmation', window.DrawerTemplates.receiveProcurement(${JSON.stringify(item)}))">Receive Goods</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Unified Requisition Queue</div>
                    </div>
                    <table>
                        <thead>
                            <tr><th>Req ID</th><th>Project</th><th>Resource</th><th>Qty Requested</th><th style="text-align: right;">Action</th></tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="project-id">REQ-089</span></td>
                                <td style="font-weight: 600;">CEN-01 Unilia</td>
                                <td>Bitumen G-Grade</td>
                                <td>20 Drums</td>
                                <td style="text-align: right;"><button class="btn btn-action" style="background: var(--orange); border: none; color: white;" onclick="window.drawer.open('Forward to FM', window.DrawerTemplates.forwardProcurement({ id: 'REQ-089', item: 'Bitumen', qty: 20 }))">Forward to FM</button></td>
                            </tr>
                            <tr>
                                <td><span class="project-id">REQ-102</span></td>
                                <td style="font-weight: 600;">MZ-05 Clinic</td>
                                <td>Cement OPC</td>
                                <td>150 Bags</td>
                                <td style="text-align: right;"><button class="btn btn-primary" onclick="window.drawer.open('Logistics Dispatch', window.DrawerTemplates.assignResource)">Dispatch</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `}
        `;
    }

    getInventoryView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Consumable Resource Silo</div>
                </div>
                <table>
                    <thead>
                        <tr><th>Material</th><th>Current Stock</th><th>Buffer Threshold</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        ${Object.entries(this.inventory).map(([name, data]) => `
                            <tr>
                                <td style="font-weight: 700;">${name}</td>
                                <td style="font-family: 'JetBrains Mono'; font-weight: 800; font-size: 15px;">${data.qty} ${data.unit}</td>
                                <td>${data.thresh} ${data.unit}</td>
                                <td><span class="status ${data.qty <= data.thresh ? 'locked' : 'active'}" style="${data.qty <= data.thresh ? 'background: var(--red-light); color: var(--red);' : ''}">${data.qty <= data.thresh ? 'BUFF ALERT' : 'HEALTHY'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getDistributionLogView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Material Daily "Burn" Registry</div>
                </div>
                <table>
                    <thead>
                        <tr><th>Disp. ID</th><th>Project</th><th>Section</th><th>Material</th><th>Qty</th><th>Supervisor</th><th>Time</th></tr>
                    </thead>
                    <tbody>
                        ${this.dispatchLogs.map(log => `
                            <tr>
                                <td><span class="project-id">${log.id}</span></td>
                                <td style="font-weight: 600;">${log.project}</td>
                                <td style="font-family: 'JetBrains Mono';">${log.section}</td>
                                <td style="font-weight: 700;">${log.item}</td>
                                <td style="font-weight: 800;">${log.qty} ${log.unit}</td>
                                <td>${log.supervisor}</td>
                                <td>${log.time}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getOperatorsView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Field Operations Command</div>
                </div>
                <table>
                    <thead>
                        <tr><th>Operator</th><th>Equipment</th><th>Section</th><th>Status</th><th>Fuel</th></tr>
                    </thead>
                    <tbody>
                        <tr><td style="font-weight: 700;">Steve Banda</td><td>CAT 320D Excavator</td><td style="font-family: 'JetBrains Mono';">KM 12+500</td><td><span class="status active">Active Ops</span></td><td>82%</td></tr>
                        <tr><td style="font-weight: 700;">Lazarous Phiri</td><td>Tata Tipper 10T</td><td style="font-family: 'JetBrains Mono';">Transit</td><td><span class="status active" style="background:#eff6ff; color:#3b82f6;">Hauling</span></td><td>35%</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    getMaintenanceView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Fleet Health Monitor</div>
                </div>
                <table>
                    <thead>
                        <tr><th>Equipment</th><th>Last Service</th><th>Next Due</th><th>Criticality</th></tr>
                    </thead>
                    <tbody>
                        <tr><td style="font-weight: 700;">CAT 320D Excavator</td><td>Mar 05</td><td style="color:var(--red); font-weight:800;">25 Hours (OVERDUE)</td><td><span class="status locked" style="background:var(--red-light); color:var(--red);">CRITICAL</span></td></tr>
                        <tr><td style="font-weight: 700;">JCB Backhoe</td><td>Mar 20</td><td>450 Hours</td><td><span class="status active">HEALTHY</span></td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    getUtilizationView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Logistics Efficiency Dashboard</div>
                </div>
                <div style="padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                    <div>
                        <div style="font-size: 14px; font-weight: 700; margin-bottom: 20px;">Fleet Utilization Rate (24h)</div>
                        <div style="height: 24px; background: var(--slate-100); border-radius: 12px; overflow: hidden; margin-bottom: 12px;"><div style="width: 78%; background: var(--emerald); height: 100%;"></div></div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px;"><span>Active: 78%</span><span>Idle: 22%</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    getRegistryView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Master Asset Registry</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Asset Procurement', window.DrawerTemplates.requestNewAsset)">
                        <i class="fas fa-plus-circle"></i> Request New Asset
                    </button>
                </div>
                <table>
                    <thead>
                        <tr><th>Asset ID</th><th>Name</th><th>Site Stationing</th><th>Hours Running</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><span class="project-id">EQP-045</span></td><td style="font-weight: 700;">CAT 320D Excavator</td><td>CEN-01 KM 12</td><td>12,450 Hr</td><td><span class="status active">Available</span></td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // --- LOGISTICS WORKFLOW HANDLERS (REACTIVE) ---

    switchHubTab(tabId) {
        this.hubActiveTab = tabId;
        window.app.loadPage(this.currentView);
    }

    switchView(view) {
        this.currentView = view;
        window.app.loadPage(this.currentView);
    }

    toggleResourceType(type, btn) {
        const machineryView = document.getElementById('machinery_view');
        const materialsView = document.getElementById('material_sheet_view');
        if (!machineryView || !materialsView) return;

        if (type === 'machinery') {
            machineryView.style.display = 'block';
            materialsView.style.display = 'none';
        } else {
            machineryView.style.display = 'none';
            materialsView.style.display = 'block';
        }

        document.querySelectorAll('.active-resource').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    updateMaterialSheet(phaseId) {
        const container = document.getElementById('material_sheet_container');
        if (!container) return;

        const materials = this.phaseMaterials[phaseId];
        if (!materials) {
            container.innerHTML = '<div style="grid-column: 1 / -1; padding: 20px; text-align: center;">No materials listed for this phase.</div>';
            return;
        }

        container.innerHTML = materials.map((mat, i) => `
            <div style="background: white; border: 1px solid var(--slate-200); padding: 12px; border-radius: 8px;">
                <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px;">${mat.name}</div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="number" id="qty_${i}" class="form-input" style="flex: 1; padding: 6px;" placeholder="Qty">
                    <span style="font-size: 11px;">${mat.unit}</span>
                </div>
            </div>
        `).join('');
    }

    async handleExecuteDispatch() {
        const project = document.getElementById('assign_project')?.value;
        const phase = document.getElementById('assign_phase')?.value;
        const supervisor = document.getElementById('assign_fs')?.value;
        const section = document.getElementById('assign_section')?.value;
        const isMachinery = document.getElementById('btn_machinery').classList.contains('active');

        window.toast.show('Executing logistics dispatch...', 'info');

        if (!isMachinery) {
            // Material Burn Logic
            const phaseMats = this.phaseMaterials[phase] || [];
            phaseMats.forEach((mat, i) => {
                const qty = Number(document.getElementById(`qty_${i}`)?.value);
                if (qty > 0 && this.inventory[mat.name]) {
                    this.inventory[mat.name].qty -= qty;
                    this.dispatchLogs.unshift({
                        id: `D-${Math.floor(Math.random()*900)+100}`,
                        project, section, item: mat.name, qty, unit: mat.unit,
                        supervisor, time: 'Just Now'
                    });
                }
            });
        }

        await notificationService.sendEmail({
            to: supervisor,
            subject: `Dispatch Notification: ${isMachinery ? 'Machinery' : 'Materials'} En-Route`,
            body: `Greetings. A dispatch of ${isMachinery ? 'Assets' : 'Construction Materials'} has been authorized for Site ${project}.`,
            description: `Stationing Destination: ${section}`
        });

        setTimeout(() => {
            window.drawer.close();
            window.app.loadPage(this.currentView);
            window.toast.show('Dispatch completed successfully.', 'success');
        }, 800);
    }

    async handleProcurementReceipt(item) {
        const qty = Number(document.getElementById('receive_qty')?.value);
        if (!qty) return;

        window.toast.show('Updating store silo...', 'info');

        if (this.inventory[item.name]) {
            this.inventory[item.name].qty += qty;
        }
        
        this.pendingReceipts = this.pendingReceipts.filter(p => p.id !== item.id);

        setTimeout(() => {
            window.drawer.close();
            window.app.loadPage(this.currentView);
            window.toast.show('Physical stock verified and received.', 'success');
        }, 800);
    }

    async handleAssetProcurementRequest() {
        const type = document.getElementById('req_asset_type')?.value;
        const reason = document.getElementById('req_reason')?.value;

        window.toast.show('Negotiating procurement request with FM...', 'info');

        await notificationService.sendEmail({
            to: 'Finance Director',
            subject: `Fleet Procurement Request: ${type}`,
            body: `Equipment Coordinator has requested a new ${type} asset.`,
            description: reason
        });

        setTimeout(() => {
            window.drawer.close();
            window.toast.show('Procurement request forwarded to Stefan Mwale.', 'success');
        }, 800);
    }

    syncFMProcurement() {
        window.toast.show('Syncing with Finance procurement system...', 'info');
        setTimeout(() => {
            this.pendingReceipts.push({ id: `PROC-777`, name: 'Diesel Fuel', qty: 5000, unit: 'Liters', vendor: 'Puma Malawi' });
            window.app.loadPage(this.currentView);
            window.toast.show('Sync successful: 1 new purchase order waiting for receipt.', 'success');
        }, 1200);
    }
}
