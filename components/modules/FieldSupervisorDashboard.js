import { FS_Dashboard } from './fs/FS_Dashboard.js';
import { FS_Logistics } from './fs/FS_Logistics.js';
import { FS_Equipment } from './fs/FS_Equipment.js';
import { FS_Tasks } from './fs/FS_Tasks.js';
import client from '../../src/api/client.js';
import inventoryApi from '../../src/api/inventory.api.js';
import assets from '../../src/api/assets.api.js';
import tasks from '../../src/api/tasks.api.js';
import dailyLogs from '../../src/api/dailyLogs.api.js';

export class FieldSupervisorDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.projectWallet = { total: 5000000, spent: 4200000 };
        this.currentGanttViewMode = 'Day';

        // --- LIVE STATE (API-BACKED) ---
        this.siteInventory = {};
        this.incomingLogistics = [];
        this.assignedProject = null;
        this.siteAssets = [];
        this.dailyLogsCount = 0;
        this.safetyDays = 124;

        this.inventoryLoaded = false;
        this.assetsLoaded = false;
        this.tasksLoaded = false;

        // Register module globally for template access
        window.app = window.app || {};
        window.app.fsModule = this;

        // --- REAL-TIME LISTENERS ---
        this._setupRealtimeListeners();
    }

    _setupRealtimeListeners() {
        if (window.realtime) {
            window.realtime.on('INVENTORY_UPDATED', (data) => {
                console.log('[FS][WS] Inventory updated:', data);
                if (this.currentView === 'logistics' || this.currentView === 'dashboard') {
                    this._loadSiteInventory();
                }
            });
            window.realtime.on('INVENTORY_CONSUMED', (data) => {
                console.log('[FS][WS] Site consumption:', data);
                if (this.currentView === 'logistics') {
                    this._loadSiteInventory();
                }
            });
            window.realtime.on('ASSET_DISPATCHED', (data) => {
                console.log('[FS][WS] Asset dispatched to site:', data);
                console.log('[FS] Equipment dispatched to site');
                if (this.currentView === 'logistics' || this.currentView === 'equipment') {
                    this._loadSiteAssets();
                }
            });
        } else {
            setTimeout(() => this._setupRealtimeListeners(), 2000);
        }
    }

    // =============================================
    // DATA LOADERS (API-BACKED)
    // =============================================





    _refreshCurrentView() {
        const container = document.getElementById('fs-content-area');
        if (container) {
            let contentHTML = '';
            switch (this.currentView) {
                case 'dashboard': contentHTML = this.getDashboardView(); break;
                case 'tasks': contentHTML = this.getTasksView(); break;
                case 'gantt': contentHTML = this.getGanttView(); break;
                case 'equipment': contentHTML = this.getEquipmentView(); break;
                case 'logistics': contentHTML = this.getLogisticsView(); break;
                default: contentHTML = this.getDashboardView();
            }
            container.innerHTML = contentHTML;
        }
    }

    render() {
        // Trigger initial data load
        setTimeout(() => {
            this._loadAssignedProject().then(() => {
                this._loadSiteInventory();
                this._loadDashboardStats();
            });
            this._loadSiteAssets();
        }, 0);

        let contentHTML = '';

        switch (this.currentView) {
            case 'dashboard': contentHTML = this.getDashboardView(); break;
            case 'tasks': contentHTML = this.getTasksView(); break;
            case 'gantt': contentHTML = this.getGanttView(); break;
            case 'equipment': contentHTML = this.getEquipmentView(); break;
            case 'logistics': contentHTML = this.getLogisticsView(); break;
            default: contentHTML = this.getDashboardView();
        }

        return `
            <div id="fs-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content" id="fs-content-area">
                    ${contentHTML}
                </div>
            </div>
        `;
    }

    getHeaderHTML() {
        const headers = {
            'dashboard': { title: 'Site Dashboard', context: 'CEN-01 Unilia Site Control' },
            'tasks': { title: 'Execution Tasks', context: 'Daily Site Objectives' },
            'gantt': { title: 'Master Schedule', context: 'Project Timeline & Dependencies' },
            'equipment': { title: 'Site Equipment', context: 'Assigned Fleet & Machinery' },
            'logistics': { title: 'Site Logistics', context: 'Resource Intake & Inventory' }
        };
        const current = headers[this.currentView] || { title: 'Site Overview', context: '' };
        const projectName = this.assignedProject?.name || current.context;

        return `
            <div class="page-header">
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">${current.title}</h1>
                    <div class="context-strip">
                      <span class="context-value">${projectName}</span>
                      <span style="color: var(--slate-400);">•</span>
                      <span style="color: var(--emerald); font-weight: 700;">
                        <span id="fs-ws-status" style="display:inline-block; width:8px; height:8px; border-radius:50%; background: ${window.realtime?.getStatus().connected ? 'var(--emerald)' : 'var(--red)'}; margin-right:4px;"></span>
                        ${window.realtime?.getStatus().connected ? 'Live' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  <div style="display:flex; gap:8px; align-items: center;">
                    <!-- Primary Mobile Action (Reduced size) -->
                    <button class="btn btn-action" style="padding: 6px 12px; font-size: 12px;" onclick="window.drawer.open('Daily Progress', window.DrawerTemplates.dailyProgressLog())">
                        <i class="fas fa-camera"></i>
                        <span>Daily Log</span>
                    </button>
                    
                    <!-- Desktop-only Actions in Header -->
                    <div class="hidden-mobile" style="display:flex; gap:8px;">
                        <button class="btn btn-secondary" onclick="window.drawer.open('Request Resource', window.DrawerTemplates.requestResourceFS)">
                            <i class="fas fa-plus-circle"></i>
                            <span>Request Resource</span>
                        </button>
                    </div>

                    <!-- Reporting Menu Trigger for Mobile -->
                    <button class="btn btn-secondary hidden-desktop" style="padding: 6px 10px;" onclick="window.drawer.open('Reporting', window.DrawerTemplates.reportingMenu)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                  </div>
                </div>
            </div>
        `;
    }



    // --- LOGISTICS HANDLERS ---

    switchView(view) {
        this.currentView = view;
        window.app.loadPage(this.currentView);
    }






    // --- EXISTING VIEWS (Gantt, Tasks, Equipment) ---








}

// Apply modular mixins
Object.assign(FieldSupervisorDashboard.prototype, FS_Dashboard, FS_Logistics, FS_Equipment, FS_Tasks);
