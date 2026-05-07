import { EC_Dashboard } from './ec/EC_Dashboard.js';
import { EC_ResourceHub } from './ec/EC_ResourceHub.js';
import { EC_Inventory } from './ec/EC_Inventory.js';
import { EC_Distribution } from './ec/EC_Distribution.js';
import { EC_Registry } from './ec/EC_Registry.js';
import { EC_Maintenance } from './ec/EC_Maintenance.js';
import { EC_Handlers } from './ec/EC_Handlers.js';
import { EC_Records } from './ec/EC_Records.js';
import { EC_Guidance } from './ec/EC_Guidance.js';
import { EC_Custody } from './ec/EC_Custody.js';
import { EC_Audit } from './ec/EC_Audit.js';
import { Shared_Issues } from './Shared_Issues.js';
import { StatCard } from '../ui/StatCard.js';
import { notificationService } from '../../src/services/notifications.service.js';
import client from '../../src/api/client.js';

export class EquipmentCoordinatorDashboard {
    constructor() {
        Object.assign(this, 
            EC_Dashboard, 
            EC_ResourceHub,
            EC_Inventory, 
            EC_Registry, 
            EC_Distribution, 
            EC_Maintenance, 
            EC_Custody, 
            EC_Records, 
            EC_Audit, 
            EC_Handlers,
            EC_Guidance,
            Shared_Issues
        );
        
        this.currentView = 'dashboard';
        this.hubActiveTab = 'field';
        
        // --- LIVE STATE (API-BACKED) ---
        this.inventory = {};
        this.dispatchLogs = [];
        this.pendingReceipts = [];
        this.requisitionQueue = [];
        this.assetRegistry = [];
        this.conflicts = [];
        this.auditLogs = [];
        this.projects = [];
        
        // WebSocket Real-time listeners
        this._setupRealtimeListeners();
    }

    _setupRealtimeListeners() {
        if (window.realtime) {
            window.realtime.on('inventory:updated', () => this._loadInventory());
            window.realtime.on('requisition:approved', (data) => {
                window.toast?.show('New field requisition received.', 'info');
                this._loadRequisitions();
            });
            window.realtime.on('ASSET_DISPATCHED', () => this._loadAssets());
            window.realtime.on('ASSET_RETURNED', () => this._loadAssets());
        } else {
            setTimeout(() => this._setupRealtimeListeners(), 2000);
        }
    }

    render() {
        this.switchView(this.currentView);
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
            case 'custody': return this.getCustodyView();
            case 'reports': return this.getRecordsView();
            case 'governance': return this.getGovernanceView();
            case 'audit': return this.getAuditView();
            default: return `<div class="p-4">View ${this.currentView} not found</div>`;
        }
    }

    getHeaderHTML() {
        const headers = {
            'dashboard': { title: 'Dashboard', context: 'Fleet Operations & Silo Stock' },
            'requests': { title: 'Logistics Hub', context: 'FS Request Intake & FM Receipts' },
            'inventory': { title: 'Material Inventory', context: 'Consumable Resource Silo' },
            'registry': { title: 'Asset Registry', context: 'Master Equipment List' },
            'distribution': { title: 'Distribution Log', context: 'Project Resource Consumption (Burn)' },
            'maintenance': { title: 'Service Schedule', context: 'Preventative Maintenance' },
            'custody': { title: 'Chain of Custody', context: 'Asset Timeline & Fault History' },
            'reports': { title: 'Records Center', context: 'Reporting & Compliance' },
            'governance': { title: 'Governance Center', context: 'Blockers & PM Responses' },
            'audit': { title: 'Security Audit logs', context: 'Immutable Event Records' }
        };
        const current = headers[this.currentView] || { title: 'Dashboard', context: '' };

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
                    <button class="btn btn-secondary" onclick="window.app.openIssueDrawer(null, 'Report Logistics Issue')">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Report Issue</span>
                    </button>
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

    _refreshCurrentView() {
        const container = document.getElementById('ec-content-area');
        if (container) {
            container.innerHTML = this.getCurrentViewHTML();
            if (this.currentView === 'dashboard') {
                this.initCharts();
            }
        }
    }

    switchView(view) {
        this.currentView = view;
        
        switch(view) {
            case 'dashboard':
                this._loadAssets();
                this._loadInventory();
                this._loadProcurementReceipts();
                this._loadDistributionLogs();
                break;
            case 'inventory':
            case 'distribution':
                this._loadInventory();
                this._loadDistributionLogs();
                break;
            case 'requests':
                if (this.hubActiveTab === 'fm') {
                    this._loadProcurementReceipts();
                } else {
                    this._loadRequisitions();
                }
                break;
            case 'registry':
            case 'maintenance':
                this._loadAssets();
                break;
            case 'custody':
            case 'audit':
                this._loadAuditLogs?.();
                break;
        }
        
        this._refreshCurrentView();
    }
}
