import { EC_Dashboard } from './ec/EC_Dashboard.js';
import { EC_ResourceHub } from './ec/EC_ResourceHub.js';
import { EC_Inventory } from './ec/EC_Inventory.js';
import { EC_Distribution } from './ec/EC_Distribution.js';
import { EC_Registry } from './ec/EC_Registry.js';
import { EC_Maintenance } from './ec/EC_Maintenance.js';
import { EC_Handlers } from './ec/EC_Handlers.js';
import { StatCard } from '../ui/StatCard.js';
import { notificationService } from '../../src/services/notifications.service.js';
import client from '../../src/api/client.js';
import inventoryApi from '../../src/api/inventory.api.js';
import assets from '../../src/api/assets.api.js';
import requisitions from '../../src/api/requisitions.api.js';
import procurement from '../../src/api/procurement.api.js';
import schedulerApi from '../../src/api/scheduler.api.js';

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
        this.conflicts = [];
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
            this._loadConflicts();
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
                    <button class="btn btn-secondary" onclick="window.app.ecModule?.openDispatchDrawer()">
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














    _refreshCurrentView() {
        const container = document.getElementById('ec-content-area');
        if (container) {
            container.innerHTML = this.getCurrentViewHTML();
        }
    }

    // =============================================
    // VIEWS
    // =============================================












    // =============================================
    // LOGISTICS WORKFLOW HANDLERS
    // =============================================


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








}

// Apply modular mixins
Object.assign(EquipmentCoordinatorDashboard.prototype, EC_Dashboard, EC_ResourceHub, EC_Inventory, EC_Distribution, EC_Registry, EC_Maintenance, EC_Handlers);
