import { StatCard } from '../ui/StatCard.js';
import { notificationService } from '../../src/services/notifications.service.js';
import client from '../../src/api/client.js';
import inventoryApi from '../../src/api/inventory.api.js';
import assets from '../../src/api/assets.api.js';
import requisitions from '../../src/api/requisitions.api.js';
import procurement from '../../src/api/procurement.api.js';

export class EquipmentCoordinatorDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.hubActiveTab = 'field';
        
        // --- LIVE STATE (API-BACKED) ---
        this.inventory = {};
        this.dispatchLogs = [];
        this.pendingReceipts = [];
        this.requisitionQueue = [];
        this.assetRegistry = [];
        this.isLoading = false;

        // Phase material mapping (static reference data)
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

        // --- REAL-TIME LISTENERS ---
        this._setupRealtimeListeners();

        // --- INITIAL DATA LOAD (Non-recursive) ---
        setTimeout(() => {
            this._loadInventory();
            this._loadProcurementReceipts();
            this._loadAssets();
            this._loadRequisitions();
        }, 100);
    }

    _setupRealtimeListeners() {
        if (window.realtime) {
            window.realtime.on('INVENTORY_UPDATED', (data) => {
                console.log('[EC][WS] Inventory updated:', data);
                if (this.currentView === 'dashboard' || this.currentView === 'inventory') {
                    this._loadInventory();
                }
            });
            window.realtime.on('INVENTORY_CONSUMED', (data) => {
                console.log('[EC][WS] Inventory consumed:', data);
                if (this.currentView === 'dashboard' || this.currentView === 'inventory' || this.currentView === 'distribution') {
                    this._loadInventory();
                }
            });
            window.realtime.on('REQUISITION_CREATED', (data) => {
                console.log('[EC][WS] New requisition:', data);
                window.toast?.show('New field requisition received.', 'info');
                if (this.currentView === 'requests') {
                    this._loadRequisitions();
                }
            });
            window.realtime.on('ASSET_DISPATCHED', () => {
                if (this.currentView === 'registry') this._loadAssets();
            });
            window.realtime.on('ASSET_RETURNED', () => {
                if (this.currentView === 'registry') this._loadAssets();
            });
        } else {
            // Retry after a delay if realtime is not yet initialized
            setTimeout(() => this._setupRealtimeListeners(), 2000);
        }
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

    // =============================================
    // DATA LOADERS (API-BACKED)
    // =============================================

    async _loadInventory() {
        if (this.isLoadingInventory) return;
        this.isLoadingInventory = true;
        try {
            // Get inventory for the first project's first sector, or fetch all
            const result = await client.get('/inventory/project/1');
            const items = Array.isArray(result) ? result : (result.data || []);
            
            // Convert API format to display format
            this.inventory = {};
            items.forEach(item => {
                this.inventory[item.materialName] = {
                    qty: Number(item.quantityOnHand || 0),
                    unit: item.unit,
                    id: item.id,
                    thresh: Number(item.lowThreshold || 0),
                    sectorId: item.sectorId,
                    sectorName: item.sectorName
                };
            });

            // Re-render the relevant container
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load inventory:', error);
        } finally {
            this.isLoadingInventory = false;
        }
    }

    async _loadRequisitions() {
        if (this.isLoadingRequisitions) return;
        this.isLoadingRequisitions = true;
        try {
            // Load approved requisitions ready for GRN/Intake
            const result = await requisitions.getAll({ status: 'approved' });
            const data = result.data || result;
            this.requisitionQueue = Array.isArray(data) ? data : (data.items || data.requisitions || []);
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load requisitions:', error);
        } finally {
            this.isLoadingRequisitions = false;
        }
    }

    async _loadProcurementReceipts() {
        if (this.isLoadingProc) return;
        this.isLoadingProc = true;
        try {
            const result = await procurement.getAll({ status: 'purchased' });
            const data = result.data || result;
            const items = Array.isArray(data) ? data : (data.items || data.procurements || []);
            this.pendingReceipts = items.map(p => ({
                id: p.reqCode || `PROC-${p.id}`,
                name: p.vehicleName || p.itemName || 'Unknown',
                qty: p.quantity || 1,
                unit: p.unit || 'Units',
                vendor: p.vendorName || p.supplier || 'Supplier'
            }));
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load procurement receipts:', error);
        } finally {
            this.isLoadingProc = false;
        }
    }

    async _loadAssets() {
        if (this.isLoadingAssets) return;
        this.isLoadingAssets = true;
        try {
            const result = await assets.getAll();
            const data = result.data || result;
            this.assetRegistry = Array.isArray(data) ? data : (data.items || []);
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load assets:', error);
        } finally {
            this.isLoadingAssets = false;
        }
    }

    async _loadDistributionLogs() {
        if (this.isLoadingLogs) return;
        this.isLoadingLogs = true;
        try {
            // Get inventory logs (distribution records)
            const result = await client.get('/inventory/project/1');
            const items = Array.isArray(result) ? result : (result.data || []);
            
            this.dispatchLogs = [];
            items.forEach(item => {
                if (item.logs) {
                    item.logs.forEach(log => {
                        this.dispatchLogs.push({
                            id: `D-${log.id}`,
                            project: item.sectorName || 'Project Site',
                            section: log.reference || 'N/A',
                            item: item.materialName,
                            qty: Number(log.quantity),
                            unit: item.unit,
                            supervisor: log.user?.name || 'System',
                            time: new Date(log.timestamp).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                            type: log.type
                        });
                    });
                }
            });
            
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load distribution logs:', error);
        } finally {
            this.isLoadingLogs = false;
        }
    }

    _refreshCurrentView() {
        const container = document.getElementById('ec-content-area');
        if (container) {
            container.innerHTML = this.getCurrentViewHTML();
        }
    }

    // =============================================
    // VIEWS
    // =============================================

    getDashboardView() {
        const lowStockCount = Object.values(this.inventory).filter(i => i.qty <= i.thresh).length;
        const inventoryEntries = Object.entries(this.inventory);

        return `
            <div class="stats-grid">
                ${StatCard({ title: 'Awaiting Receipt', value: this.pendingReceipts.length.toString(), subtext: 'From FM Procurement', alertColor: 'blue' })}
                ${StatCard({ title: 'Critical Stock', value: lowStockCount.toString().padStart(2,'0'), subtext: 'Materials < Buffers', alertColor: 'red' })}
                ${StatCard({ title: 'Fleet Health', value: this.assetRegistry.length ? (this.assetRegistry.filter(a => a.status === 'available').length / this.assetRegistry.length * 100).toFixed(0) + '%' : '--', subtext: 'Readiness Rate', alertColor: 'emerald' })}
                ${StatCard({ title: 'Daily Burn', value: this.dispatchLogs.length.toString(), subtext: 'Fulfillment today', alertColor: 'orange' })}
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 24px;">
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Live Material "Burn" Status</div>
                        <span class="status active">Real-time</span>
                    </div>
                    <div id="ec-burn-chart" style="padding: 24px;">
                        ${inventoryEntries.length === 0
                            ? '<div style="text-align:center; color: var(--slate-400); padding: 40px;"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:8px;"></i><div>Loading inventory…</div></div>'
                            : this._renderBurnChart(inventoryEntries)
                        }
                    </div>
                </div>

                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Logistics Status</div>
                    </div>
                    <div style="padding: 16px;" id="ec-logistics-status">
                        ${inventoryEntries.length === 0
                            ? '<div style="text-align:center; color: var(--slate-400); padding: 20px;">Loading…</div>'
                            : inventoryEntries.map(([name, data]) => `
                                <div style="margin-bottom: 16px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                                        <span style="font-weight: 600;">${name}</span>
                                        <span style="color: ${data.qty <= data.thresh ? 'var(--red)' : '#64748B'}; font-weight: 700;">${data.qty} ${data.unit}</span>
                                    </div>
                                    <div style="height: 6px; background: var(--slate-100); border-radius: 3px; overflow: hidden;">
                                        <div style="width: ${Math.min(100, (data.qty / Math.max(data.thresh * 3, 1)) * 100)}%; background: ${data.qty <= data.thresh ? 'var(--red)' : 'var(--blue)'}; height: 100%;"></div>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
        `;
    }

    _renderBurnChart(entries) {
        if (entries.length === 0) return '<div style="padding:40px; text-align:center; color: var(--slate-400);">No inventory data</div>';
        const maxQty = Math.max(...entries.map(([, d]) => d.qty), 1);
        const colors = ['var(--blue)', 'var(--orange)', 'var(--emerald)', 'var(--red)', 'var(--purple)'];
        
        return `
            <div style="height: 200px; background: var(--slate-50); border-radius: 12px; display: flex; align-items: flex-end; gap: 40px; padding: 20px; border: 1px solid var(--slate-100);">
                ${entries.map(([name, data], i) => {
                    const pct = Math.max(5, (data.qty / maxQty) * 100);
                    return `
                        <div style="flex: 1; height: ${pct}%; background: ${colors[i % colors.length]}; border-radius: 4px; position: relative; min-height: 10px; transition: height 0.5s ease;">
                            <div style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 10px; color: var(--slate-500); white-space: nowrap;">${name.split(' ')[0]}</div>
                            <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-weight: 700; font-size: 11px;">${data.qty}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    getResourceHubView() {
        const activeTab = this.hubActiveTab || 'field';

        const fieldCount = this.requisitionQueue.length;
        const fmCount = this.pendingReceipts.length;

        return `
            <div class="hub-filter-bar" style="display: flex; gap: 12px; margin-bottom: 24px; background: var(--slate-100); padding: 6px; border-radius: 12px; width: fit-content;">
                <button class="btn ${activeTab === 'field' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.ecModule?.switchHubTab('field')">Field Requisitions (${fieldCount})</button>
                <button class="btn ${activeTab === 'fm' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.ecModule?.switchHubTab('fm')">FM Receipts (${fmCount})</button>
            </div>

            ${activeTab === 'fm' ? this._renderFMReceiptsTable() : this._renderRequisitionsTable()}
        `;
    }

    _renderFMReceiptsTable() {
        if (this.pendingReceipts.length === 0) {
            return `<div class="data-card"><div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-check-circle" style="font-size: 32px; margin-bottom: 12px; color: var(--emerald);"></i><div style="font-weight: 600;">No pending receipts</div></div></div>`;
        }
        return `
            <div class="data-card animate-slide-up" style="border: 1px solid var(--blue-border); background: #f8fafc;">
                <div class="data-card-header">
                    <div class="card-title">Pending Receipts from FM</div>
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
                                    <button class="btn btn-primary" onclick="window.drawer.open('Receipt Confirmation', window.DrawerTemplates.receiveProcurement(${JSON.stringify(item).replace(/"/g, '&quot;')}))">Receive Goods</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    _renderRequisitionsTable() {
        if (this.requisitionQueue.length === 0) {
            return `<div class="data-card"><div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px;"></i><div style="font-weight: 600;">No approved requisitions ready for Intake</div><div style="font-size: 13px;">Waiting for Finance approval</div></div></div>`;
        }
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Approved Requisitions (Pending Intake)</div>
                </div>
                <table>
                    <thead>
                        <tr><th>Req ID</th><th>Project</th><th>Resource</th><th>Total Cost</th><th style="text-align: right;">Action</th></tr>
                    </thead>
                    <tbody>
                        ${this.requisitionQueue.map(req => {
                            const items = req.items || [];
                            const desc = items.length ? items.map(i => `${i.quantity} ${i.itemName}`).join(', ') : 'Resources';
                            return `
                            <tr>
                                <td><span class="project-id">${req.reqCode || 'REQ-' + req.id}</span></td>
                                <td style="font-weight: 600;">${req.project?.name || req.project?.code || 'Project'}</td>
                                <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${desc}</td>
                                <td>K${Number(req.totalAmount || 0).toLocaleString()}</td>
                                <td style="text-align: right;">
                                    <button class="btn btn-primary" onclick="window.app.ecModule.handleIntake('${req.id}')"><i class="fas fa-box-open"></i> Intake (GRN)</button>
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getInventoryView() {

        const entries = Object.entries(this.inventory);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Consumable Resource Silo</div>
                    <button class="btn btn-secondary" onclick="window.app.ecModule._loadInventory()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                ${entries.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading inventory from server…</div></div>'
                    : `<table>
                        <thead>
                            <tr><th>Material</th><th>Current Stock</th><th>Buffer Threshold</th><th>Sector</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            ${entries.map(([name, data]) => `
                                <tr>
                                    <td style="font-weight: 700;">${name}</td>
                                    <td style="font-family: 'JetBrains Mono'; font-weight: 800; font-size: 15px;">${data.qty} ${data.unit}</td>
                                    <td>${data.thresh} ${data.unit}</td>
                                    <td style="font-size: 12px; color: var(--slate-500);">${data.sectorName || '--'}</td>
                                    <td><span class="status ${data.qty <= data.thresh ? 'locked' : 'active'}" style="${data.qty <= data.thresh ? 'background: var(--red-light); color: var(--red);' : ''}">${data.qty <= data.thresh ? 'BUFF ALERT' : 'HEALTHY'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `;
    }

    getDistributionLogView() {

        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Material Daily "Burn" Registry</div>
                    <button class="btn btn-secondary" onclick="window.app.ecModule._loadDistributionLogs()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                ${this.dispatchLogs.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading distribution logs…</div></div>'
                    : `<table>
                        <thead>
                            <tr><th>Log ID</th><th>Sector</th><th>Section</th><th>Material</th><th>Qty</th><th>Type</th><th>By</th><th>Time</th></tr>
                        </thead>
                        <tbody>
                            ${this.dispatchLogs.map(log => `
                                <tr>
                                    <td><span class="project-id">${log.id}</span></td>
                                    <td style="font-weight: 600;">${log.project}</td>
                                    <td style="font-family: 'JetBrains Mono';">${log.section}</td>
                                    <td style="font-weight: 700;">${log.item}</td>
                                    <td style="font-weight: 800;">${log.qty} ${log.unit}</td>
                                    <td><span class="status ${log.type === 'IN' ? 'active' : 'pending'}">${log.type === 'IN' ? 'STOCK IN' : 'CONSUMED'}</span></td>
                                    <td>${log.supervisor}</td>
                                    <td>${log.time}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
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
                ${this.assetRegistry.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading asset registry…</div></div>'
                    : `<table>
                        <thead>
                            <tr><th>Asset ID</th><th>Name</th><th>Category</th><th>Hours/Km</th><th>Condition</th><th>Status</th><th style="text-align: right;">Action</th></tr>
                        </thead>
                        <tbody>
                            ${this.assetRegistry.map(asset => `
                                <tr>
                                    <td><span class="project-id">${asset.assetCode || 'EQP-' + asset.id}</span></td>
                                    <td style="font-weight: 700;">${asset.name}</td>
                                    <td>${asset.category || '--'}</td>
                                    <td style="font-family: 'JetBrains Mono';">${asset.hoursOrKm ? asset.hoursOrKm.toLocaleString() + ' Hr' : '--'}</td>
                                    <td><span style="color: ${asset.condition === 'Poor' ? 'var(--red)' : 'var(--emerald)'}; font-weight:700;">${asset.condition || '--'}</span></td>
                                    <td><span class="status ${asset.status === 'available' ? 'active' : asset.status === 'checked_out' ? 'pending' : 'locked'}" style="${asset.status === 'maintenance' ? 'background: var(--red-light); color: var(--red);' : ''}">${(asset.status || 'unknown').replace(/_/g, ' ')}</span></td>
                                    <td style="text-align: right;">
                                        ${asset.status === 'maintenance' ? 
                                          `<button class="btn btn-primary" onclick="window.app.ecModule.handleResolveIssue('${asset.id}', '${asset.name}')"><i class="fas fa-wrench"></i> Mark Fixed</button>`
                                          : `<span style="font-size: 12px; color: var(--slate-400);">No Action</span>`
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `;
    }

    getOperatorsView() {
        // Load assets with operator info

        const activeAssets = this.assetRegistry.filter(a => a.status === 'checked_out');

        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Field Operations Command</div>
                    <button class="btn btn-secondary" onclick="window.app.ecModule._loadAssets()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                ${activeAssets.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-truck-monster" style="font-size: 32px; margin-bottom: 12px;"></i><div style="font-weight: 600;">No active operators</div><div style="font-size: 13px;">Check out assets to see field operations</div></div>'
                    : `<table>
                        <thead>
                            <tr><th>Operator</th><th>Equipment</th><th>Project</th><th>Status</th><th>Fuel</th></tr>
                        </thead>
                        <tbody>
                            ${activeAssets.map(asset => `
                                <tr>
                                    <td style="font-weight: 700;">${asset.currentProject?.fieldSupervisor?.name || 'Assigned'}</td>
                                    <td>${asset.name}</td>
                                    <td>${asset.currentProject?.name || '--'}</td>
                                    <td><span class="status active">Active Ops</span></td>
                                    <td>${asset.fuelLevel ? asset.fuelLevel + '%' : '--'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `;
    }

    getMaintenanceView() {

        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Fleet Health Monitor</div>
                </div>
                ${this.assetRegistry.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading fleet data…</div></div>'
                    : `<table>
                        <thead>
                            <tr><th>Equipment</th><th>Last Service</th><th>Condition</th><th>Criticality</th></tr>
                        </thead>
                        <tbody>
                            ${this.assetRegistry.map(asset => {
                                const lastService = asset.lastMaintenanceAt ? new Date(asset.lastMaintenanceAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : 'Never';
                                const isCritical = asset.condition === 'Poor';
                                return `
                                <tr>
                                    <td style="font-weight: 700;">${asset.name}</td>
                                    <td>${lastService}</td>
                                    <td>${asset.condition || '--'}</td>
                                    <td><span class="status ${isCritical ? 'locked' : 'active'}" style="${isCritical ? 'background:var(--red-light); color:var(--red);' : ''}">${isCritical ? 'CRITICAL' : 'HEALTHY'}</span></td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `;
    }

    getUtilizationView() {
        const total = this.assetRegistry.length || 1;
        const active = this.assetRegistry.filter(a => a.status === 'checked_out').length;
        const pct = Math.round((active / total) * 100);

        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Logistics Efficiency Dashboard</div>
                </div>
                <div style="padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                    <div>
                        <div style="font-size: 14px; font-weight: 700; margin-bottom: 20px;">Fleet Utilization Rate (Live)</div>
                        <div style="height: 24px; background: var(--slate-100); border-radius: 12px; overflow: hidden; margin-bottom: 12px;"><div style="width: ${pct}%; background: var(--emerald); height: 100%; transition: width 0.5s ease;"></div></div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px;"><span>Active: ${pct}%</span><span>Idle: ${100 - pct}%</span></div>
                    </div>
                    <div>
                        <div style="font-size: 14px; font-weight: 700; margin-bottom: 20px;">Inventory Health</div>
                        <div style="font-size: 32px; font-weight: 800; color: var(--slate-800);">${Object.keys(this.inventory).length}</div>
                        <div style="font-size: 12px; color: var(--slate-500);">Tracked materials across all sectors</div>
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // LOGISTICS WORKFLOW HANDLERS
    // =============================================

    switchHubTab(tabId) {
        this.hubActiveTab = tabId;
        if (tabId === 'fm') {
            this._loadProcurementReceipts();
        } else {
            this._loadRequisitions();
        }
        window.app.loadPage(this.currentView);
    }

    switchView(view) {
        this.currentView = view;
        
        // Load appropriate data for the specific view
        switch(view) {
            case 'dashboard':
                this._loadInventory();
                this._loadProcurementReceipts();
                this._loadDistributionLogs();
                break;
            case 'inventory':
            case 'distribution':
                this._loadInventory();
                break;
            case 'requests':
                if (this.hubActiveTab === 'fm') {
                    this._loadProcurementReceipts();
                } else {
                    this._loadRequisitions();
                }
                break;
            case 'registry':
            case 'operators':
            case 'maintenance':
                this._loadAssets();
                break;
        }

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
        const isMachinery = document.getElementById('btn_machinery')?.classList.contains('active');

        window.toast.show('Executing logistics dispatch…', 'info');

        if (!isMachinery) {
            // API-backed material distribution
            const phaseMats = this.phaseMaterials[phase] || [];
            for (const [i, mat] of phaseMats.entries()) {
                const qty = Number(document.getElementById(`qty_${i}`)?.value);
                if (qty > 0) {
                    try {
                        await inventoryApi.distribute({
                            sectorId: 1, // TODO: dynamic sector selection
                            materialName: mat.name,
                            category: 'Construction',
                            unit: mat.unit,
                            quantity: qty,
                            reference: section,
                            notes: `Dispatched to ${supervisor} at ${project}`
                        });
                    } catch (err) {
                        console.error(`[EC] Failed to distribute ${mat.name}:`, err);
                    }
                }
            }
        }

        await notificationService.sendEmail({
            to: supervisor,
            subject: `Dispatch Notification: ${isMachinery ? 'Machinery' : 'Materials'} En-Route`,
            body: `Greetings. A dispatch of ${isMachinery ? 'Assets' : 'Construction Materials'} has been authorized for Site ${project}.`,
            description: `Stationing Destination: ${section}`
        });

        setTimeout(() => {
            window.drawer.close();
            this._loadInventory();
            window.app.loadPage(this.currentView);
            window.toast.show('Dispatch completed successfully.', 'success');
        }, 800);
    }

    async handleProcurementReceipt(item) {
        const qty = Number(document.getElementById('receive_qty')?.value);
        if (!qty) return;

        window.toast.show('Updating store silo via API…', 'info');

        try {
            await inventoryApi.distribute({
                sectorId: 1,
                materialName: item.name,
                category: 'Procurement',
                unit: item.unit,
                quantity: qty,
                reference: `Receipt: ${item.id}`,
                notes: `Received from ${item.vendor}`
            });
            
            this.pendingReceipts = this.pendingReceipts.filter(p => p.id !== item.id);

            setTimeout(() => {
                window.drawer.close();
                window.app.loadPage(this.currentView);
                window.toast.show('Physical stock verified and received.', 'success');
            }, 800);
        } catch (error) {
            console.error('[EC] Receipt failed:', error);
            window.toast.show('Failed to update inventory: ' + (error.message || 'Server error'), 'error');
        }
    }

    async handleIntake(requisitionId) {
        try {
            await window.loader.show('Processing GRN and Intaking Inventory...', async () => {
                const reqId = parseInt(requisitionId, 10);
                await window.requisitions.fulfill(reqId, 1); // Default to Sector 1 for yard
            });
            modal.showSuccess('Goods Received', 'Materials have been added to inventory.');
            await this._loadRequisitions();
            await this._loadInventory();
        } catch (error) {
            console.error('[EC] Intake failed', error);
            modal.showError('Intake Failed', error.message || 'Failed to process GRN');
        }
    }

    async handleAssetUpdate(assetId) {}

    async handleResolveIssue(assetId, assetName) {
        if (!confirm(`Mark ${assetName} as FIXED and return it to AVAILABLE fleet pool?`)) {
            return;
        }

        try {
            await window.loader.show('Resolving maintenance issue...', async () => {
                await window.assets.resolveIssue(assetId, `Fixed by workshop and returned to fleet.`);
            });
            modal.showSuccess('Asset Repaired', `${assetName} is now available for field deployment.`);
            await this._loadAssets();
        } catch (error) {
            console.error('[EC] Failed to resolve:', error);
            modal.showError('Error', error.message || 'Failed to update asset');
        }
    }

    async handleAssetProcurementRequest() {
        const type = document.getElementById('req_asset_type')?.value;
        const reason = document.getElementById('req_reason')?.value;

        window.toast.show('Submitting procurement request…', 'info');

        try {
            await procurement.create({
                vehicleName: type,
                justification: reason,
                priority: 'Standard'
            });

            await notificationService.sendEmail({
                to: 'Finance Director',
                subject: `Fleet Procurement Request: ${type}`,
                body: `Equipment Coordinator has requested a new ${type} asset.`,
                description: reason
            });

            setTimeout(() => {
                window.drawer.close();
                window.toast.show('Procurement request submitted to Finance.', 'success');
            }, 800);
        } catch (error) {
            window.toast.show('Failed to submit request: ' + (error.message || 'Server error'), 'error');
        }
    }

    async syncFMProcurement() {
        window.toast.show('Syncing with Finance procurement system…', 'info');
        
        try {
            await this._loadProcurementReceipts();
            window.app.loadPage(this.currentView);
            window.toast.show(`Sync complete: ${this.pendingReceipts.length} pending receipt(s).`, 'success');
        } catch (error) {
            window.toast.show('Sync failed: ' + (error.message || 'Server error'), 'error');
        }
    }
}
