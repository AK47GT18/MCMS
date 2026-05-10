import { FS_Dashboard } from './fs/FS_Dashboard.js';
import { FS_Logistics } from './fs/FS_Logistics.js';
import { FS_Equipment } from './fs/FS_Equipment.js';
import { FS_Tasks } from './fs/FS_Tasks.js';
import client from '../../src/api/client.js';
import inventoryApi from '../../src/api/inventory.api.js';
import assets from '../../src/api/assets.api.js';
import tasks from '../../src/api/tasks.api.js';
import dailyLogs from '../../src/api/dailyLogs.api.js';
import { getRecommendedResources } from '../../src/utils/resourceMapping.js';

export class FieldSupervisorDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.projectWallet = { total: 5000000, spent: 4200000 };
        this.currentGanttViewMode = 'Month';

        // --- LIVE STATE (API-BACKED) ---
        this.siteInventory = {};
        this.incomingLogistics = [];
        this.assignedProject = null;
        this.siteAssets = [];
        this.dailyLogsCount = 0;
        this.safetyDays = 124;
        this._loadStarted = false;

        this.inventoryLoaded = false;
        this.assetsLoaded = false;
        this.tasksLoaded = false;
        this.projectLoading = true;
        this.geofenceMap = null;
        this.userMarker = null;
        this.accuracyCircle = null;
        this.isTracking = false;
        this.isExpanded = false;

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

    async _cacheRequisitionData() {
        if (!this.assignedProject) return;
        
        const projectId = this.assignedProject.id;
        console.log('[FS] Caching real project-scoped requisition data for project:', projectId);

        try {
            // Fetch everything in parallel
            const [roadSpec, ownedAssets, rentalContracts] = await Promise.all([
                Promise.resolve({ layers: [], accessories: [] }), // Removed client.get('/road-specifications?projectId=${projectId}') to prevent 404
                client.get(`/assets?projectId=${projectId}`).catch(() => []),
                client.get(`/vehicle-contracts?projectId=${projectId}&status=active`).catch(() => [])
            ]);

            // 1. Process Materials from Road Specification
            // This ensures FS only requests what the PM approved
            const layers = roadSpec?.layers || [];
            const accessories = roadSpec?.accessories || [];

            this.assignedProject.recommendedMaterials = [
                ...layers.map(l => ({
                    name: l.materialType,
                    unit: l.unit,
                    approvedQty: Number(l.totalQuantity),
                    phase: l.phaseNumber,
                    phaseName: l.phaseName || `Phase ${l.phaseNumber}`
                })),
                ...accessories.map(a => ({
                    name: a.itemName,
                    unit: a.unit,
                    approvedQty: Number(a.totalQuantity),
                    category: a.category,
                    phaseName: 'Road Furniture & Accessories'
                }))
            ];

            // 2. Process Machinery (Owned + Rented)
            const ownedList = Array.isArray(ownedAssets) ? ownedAssets : (ownedAssets.data || []);
            const rentalList = Array.isArray(rentalContracts) ? rentalContracts : (rentalContracts.contracts || []);

            this.assignedProject.recommendedMachines = [
                ...ownedList.map(a => ({
                    name: a.name,
                    type: a.category,
                    code: a.assetCode,
                    source: 'owned',
                    available: a.status === 'available',
                    status: a.status
                })),
                ...rentalList.map(c => ({
                    name: `${c.machineType} (${c.vendorName})`,
                    type: c.machineType,
                    code: c.refCode,
                    source: 'rental',
                    available: c.status === 'active',
                    expiresAt: c.endDate,
                    vendor: c.vendorName
                }))
            ];

            console.log(`[FS] Cache complete: ${this.assignedProject.recommendedMaterials.length} materials, ${this.assignedProject.recommendedMachines.length} machines.`);
        } catch (e) {
            console.error('[FS] Failed to cache requisition data:', e);
            // Fallback to empty if critical fail
            this.assignedProject.recommendedMaterials = this.assignedProject.recommendedMaterials || [];
            this.assignedProject.recommendedMachines = this.assignedProject.recommendedMachines || [];
        }
    }

    _refreshCurrentView() {
        const contentArea = document.getElementById('fs-content-area');
        const moduleContainer = document.getElementById('fs-module');

        if (contentArea) {
            let contentHTML = '';
            switch (this.currentView) {
                case 'dashboard': contentHTML = this.getDashboardView(); break;
                case 'tasks': contentHTML = this.getTasksView(); break;
                case 'gantt': contentHTML = this.getGanttView(); break;
                case 'equipment': contentHTML = this.getEquipmentView(); break;
                case 'logistics': contentHTML = this.getLogisticsView(); break;
                case 'reporting': contentHTML = this.getReportingView(); break;
                default: contentHTML = this.getDashboardView();
            }
            contentArea.innerHTML = contentHTML;
            
            // Re-initialize map if returning to dashboard
            if (this.currentView === 'dashboard') {
                setTimeout(() => {
                    if (typeof this.initGeofenceMap === 'function') {
                        this.initGeofenceMap();
                    }
                }, 100);
            }
        } else if (moduleContainer) {
            // If the module container exists but content area doesn't, we likely just finished loading
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = this.render();
            }
        }
    }

    openResourceRequestDrawer() {
        if (!this.assignedProject) {
            if (window.toast) window.toast.show('Project data still loading. Please wait.', 'warning');
            return;
        }

        // Enrich materials with current site status for filtering
        if (this.assignedProject.recommendedMaterials) {
            this.assignedProject.recommendedMaterials.forEach(m => {
                const siteItem = this.siteInventory?.[m.name];
                m.onSiteQty = siteItem ? siteItem.qty : 0;
                
                // Calculate in-transit for this item
                let inTransit = 0;
                (this.inTransitItems || []).forEach(req => {
                    const item = req.items.find(i => i.itemName === m.name);
                    if (item) inTransit += Number(item.quantity);
                });
                m.inTransitQty = inTransit;
            });
        }

        this.requisitionCart = []; // Reset cart for new request
        window.drawer.open('Request Resource', window.DrawerTemplates.requestResourceFS(this.assignedProject));
    }

    render() {
        // Trigger initial data load once
        if (this.projectLoading && !this._loadStarted) {
            this._loadStarted = true;
            setTimeout(() => {
                this._loadAssignedProject().then(async () => {
                    this.projectLoading = false;
                    
                    // Load all secondary data in parallel
                    await Promise.all([
                        this._cacheRequisitionData(),
                        this._loadSiteInventory(),
                        this._loadDashboardStats(),
                        this._loadSiteAssets(),
                        this._loadWeather()
                    ]);
                    
                    // Final single refresh once everything is primed
                    this._refreshCurrentView();
                }).catch((err) => {
                    console.error('[FS] Initialization failed:', err);
                    this.projectLoading = false;
                    this._refreshCurrentView();
                });
            }, 100);
        }

        if (this.projectLoading) {
            return `
                <div id="fs-module" style="height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--slate-50);">
                    <div style="text-align: center;">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 40px; color: var(--orange); margin-bottom: 16px;"></i>
                        <div style="font-weight: 700; color: var(--slate-600);">Syncing Project Workspace...</div>
                    </div>
                </div>
            `;
        }

        if (!this.assignedProject) {
            return `
                <div id="fs-module" class="animate-fade-in">
                    ${this.getNoProjectView()}
                </div>
            `;
        }

        let contentHTML = '';

        switch (this.currentView) {
            case 'dashboard': contentHTML = this.getDashboardView(); break;
            case 'tasks': contentHTML = this.getTasksView(); break;
            case 'gantt': contentHTML = this.getGanttView(); break;
            case 'equipment': contentHTML = this.getEquipmentView(); break;
            case 'logistics': contentHTML = this.getLogisticsView(); break;
            case 'daily_progress': contentHTML = this.getDailyProgressView(); break;
            case 'reporting': contentHTML = this.getReportingView(); break;
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

    getNoProjectView() {
        return `
            <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--slate-50); padding: 40px;">
                <div style="max-width: 450px; text-align: center;">
                    <div style="width: 120px; height: 120px; background: white; border-radius: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 32px; box-shadow: var(--shadow-lg);">
                        <i class="fas fa-hard-hat" style="font-size: 48px; color: var(--slate-300);"></i>
                    </div>
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--slate-900); margin-bottom: 12px;">No Project Assigned</h2>
                    <p style="font-size: 15px; color: var(--slate-500); line-height: 1.6; margin-bottom: 32px;">
                        Your supervisor workspace is currently standby. Once you are assigned to an active site, your dashboard, inventory, and task center will activate here.
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="btn btn-secondary" onclick="location.reload()">
                            <i class="fas fa-sync"></i> Check for Assignment
                        </button>
                    </div>
                    <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--slate-200); font-size: 11px; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">
                        Mkaka Construction Management System
                    </div>
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
            'logistics': { title: 'Logistics & Fleet', context: 'Resource Intake & Asset Management' }
        };
        const current = headers[this.currentView] || { title: 'Site Overview', context: '' };
        const projectName = this.assignedProject?.name || current.context;

        return `
            <div class="page-header">

                <div class="page-title-row">
                  <div>
                    <h1 class="page-title" style="font-size: 24px;">${current.title}</h1>
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
                    <button class="btn btn-action" style="padding: 6px 12px; font-size: 12px;" onclick="window.app.fsModule.openDailyLogDrawer()">
                        <i class="fas fa-camera"></i>
                        <span>Daily Log</span>
                    </button>
                    
                    <!-- Desktop-only Actions in Header -->
                    <div class="hidden-mobile" style="display:flex; gap:8px;">
                        <button class="btn btn-secondary" onclick="window.app.fsModule.switchView('reporting')">
                            <i class="fas fa-headset"></i>
                            <span>Governance</span>
                        </button>
                        <button class="btn btn-secondary" onclick="window.app.fsModule.openResourceRequestDrawer()">
                            <i class="fas fa-plus-circle"></i>
                            <span>Request from EC</span>
                        </button>
                    </div>

                    <!-- Reporting Menu Trigger for Mobile -->
                    <button class="btn btn-secondary hidden-desktop" style="padding: 6px 10px;" onclick="window.drawer.open('Site Reporting', window.DrawerTemplates.reportingMenu())">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                  </div>
                </div>
            </div>
        `;
    }

    getReportingView() {
        // Trigger data load after render
        setTimeout(() => this.loadReportingData('issues'), 0);

        return `
            <div class="view-content" style="padding: 24px;">
                <div class="data-card shadow-sm" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--slate-200);">
                    <div style="padding: 20px; border-bottom: 1px solid var(--slate-100); display: flex; justify-content: space-between; align-items: center; background: var(--slate-50);">
                        <div>
                            <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--slate-900);">Governance & Reported Issues</h3>
                            <p style="margin: 4px 0 0; font-size: 12px; color: var(--slate-500);">Track blockers and PM responses to your site reports.</p>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <select id="issue-category-filter" class="form-input" style="padding: 6px 12px; font-size: 11px; width: auto; height: 32px;" onchange="window.app.fsModule.loadReportingData('issues')">
                                <option value="all">All Categories</option>
                                <option value="Material Shortage">Material Shortage</option>
                                <option value="Weather Delay">Weather Delay</option>
                                <option value="Equipment Breakdown">Equipment Breakdown</option>
                                <option value="Technical Clarification">Technical Clarification</option>
                                <option value="Labor Dispute">Labor Dispute</option>
                            </select>
                            <select id="issue-status-filter" class="form-input" style="padding: 6px 12px; font-size: 11px; width: auto; height: 32px;" onchange="window.app.fsModule.loadReportingData('issues')">
                                <option value="all">All Statuses</option>
                                <option value="open">Open Blockers</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>
                            <button class="btn btn-secondary btn-sm" style="height: 32px;" onclick="window.app.fsModule.loadReportingData('issues')">
                                <i class="fas fa-sync"></i>
                            </button>
                            <button class="btn btn-action btn-sm" style="height: 32px;" onclick="window.drawer.open('Report Issue', window.DrawerTemplates.submitComplaint(window.app.fsModule.assignedProject?.id))">
                                <i class="fas fa-plus"></i> Report Issue
                            </button>
                        </div>
                    </div>

                    <div id="reporting-table-container">
                        <div style="padding: 60px; text-align: center; color: var(--slate-400);">
                            <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                            <div>Loading reports...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getDailyProgressView() {
        setTimeout(() => this.loadDailyProgressData(), 0);
        return `
            <div class="view-content" style="padding: 24px;">
                <div class="data-card shadow-sm" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--slate-200);">
                    <div style="padding: 20px; border-bottom: 1px solid var(--slate-100); display: flex; justify-content: space-between; align-items: center; background: var(--slate-50);">
                        <div>
                            <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--slate-900);">Daily Progress Reports</h3>
                            <p style="margin: 4px 0 0; font-size: 12px; color: var(--slate-500);">Historical record of site activity and work logs.</p>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button class="btn btn-secondary btn-sm" style="height: 32px;" onclick="window.app.fsModule.loadDailyProgressData()">
                                <i class="fas fa-sync"></i> Refresh
                            </button>
                            <button class="btn btn-action btn-sm" style="height: 32px;" onclick="window.app.fsModule.openDailyLogDrawer()">
                                <i class="fas fa-plus"></i> Submit Daily Report
                            </button>
                        </div>
                    </div>

                    <div id="daily-progress-table-container">
                        <div style="padding: 60px; text-align: center; color: var(--slate-400);">
                            <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                            <div>Loading reports...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadDailyProgressData() {
        const container = document.getElementById('daily-progress-table-container');
        if (!container) return;

        try {
            const res = await client.get('/daily-logs', { projectId: this.assignedProject?.id });
            const data = Array.isArray(res) ? res : (res.data || []);
            
            if (data.length === 0) {
                container.innerHTML = `
                    <div style="padding: 60px; text-align: center; color: var(--slate-400);">
                        <i class="fas fa-clipboard-list" style="font-size: 40px; margin-bottom: 16px; opacity: 0.3;"></i>
                        <div style="font-weight: 700; font-size: 14px;">No progress reports found.</div>
                        <div style="font-size: 12px; margin-top: 4px;">Click "Submit Daily Report" to log your first update.</div>
                    </div>
                `;
                return;
            }

            this.renderDailyProgressTable(container, data);
        } catch (err) {
            console.error('[FS] Error loading daily logs:', err);
            container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--red);">Failed to load data.</div>`;
        }
    }

    renderDailyProgressTable(container, logs) {
        if (logs.length === 0) {
            container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--slate-400);">No progress logs reported yet.</div>';
            return;
        }
        
        const sortedLogs = logs.sort((a,b) => new Date(b.logDate) - new Date(a.logDate));

        const tableRows = sortedLogs.map(log => {
            const isFlagged = log.locationFlagged;
            return `
                <tr>
                    <td style="font-weight: 700;">${new Date(log.logDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>${log.weather || 'Good Weather'}</td>
                    <td>
                        ${isFlagged 
                            ? `<span class="badge badge-warning" style="font-size: 10px;"><i class="fas fa-exclamation-triangle"></i> Flagged</span>` 
                            : `<span class="badge badge-success" style="font-size: 10px;"><i class="fas fa-check-circle"></i> Verified</span>`}
                    </td>
                    <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${log.narrative || '—'}
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 60px; height: 6px; background: var(--slate-100); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${log.progressCompletion || log.workProgress || 0}%; height: 100%; background: var(--emerald);"></div>
                            </div>
                            <span style="font-size: 11px; font-weight: 700;">${log.progressCompletion || log.workProgress || 0}%</span>
                        </div>
                    </td>
                    <td style="text-align: center;">
                        <i class="fas fa-images"></i> ${log.photos?.length || 0}
                    </td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 11px;" 
                            onclick='window.drawer.open("Log Details", window.DrawerTemplates.dailyLogDetails(${JSON.stringify(log).replace(/"/g, '&quot;')}))'>
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        const cardRows = sortedLogs.map(log => {
            const isFlagged = log.locationFlagged;
            return `
                <div class="log-card" style="background: white; border: 1px solid var(--slate-200); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="font-weight: 800; font-size: 14px; color: var(--slate-900);">${new Date(log.logDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div style="font-size: 11px; color: var(--slate-500);">${log.weather || 'Good Weather'}</div>
                        </div>
                        ${isFlagged 
                            ? `<span class="badge badge-warning" style="font-size: 10px;"><i class="fas fa-exclamation-triangle"></i> Flagged</span>` 
                            : `<span class="badge badge-success" style="font-size: 10px;"><i class="fas fa-check-circle"></i> Verified</span>`}
                    </div>
                    
                    <div style="font-size: 13px; color: var(--slate-600); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 36px;">
                        ${log.narrative || '—'}
                    </div>

                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="flex: 1; height: 6px; background: var(--slate-100); border-radius: 3px; overflow: hidden;">
                            <div style="width: ${log.progressCompletion || log.workProgress || 0}%; height: 100%; background: var(--emerald);"></div>
                        </div>
                        <span style="font-size: 11px; font-weight: 700; color: var(--slate-700);">${log.progressCompletion || log.workProgress || 0}%</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--slate-50);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); display: flex; align-items: center; gap: 4px;">
                                <i class="fas fa-images"></i> ${log.photos?.length || 0}
                            </div>
                            <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); display: flex; align-items: center; gap: 4px;">
                                <i class="fas fa-users"></i> ${log.headcount || 0}
                            </div>
                        </div>
                        <button class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 11px; border-radius: 8px;" 
                            onclick='window.drawer.open("Log Details", window.DrawerTemplates.dailyLogDetails(${JSON.stringify(log).replace(/"/g, '&quot;')}))'>
                            View Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="hidden-mobile">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Weather</th>
                                <th>Status</th>
                                <th>Narrative</th>
                                <th>Progress</th>
                                <th style="text-align: center;">Photos</th>
                                <th style="text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="hidden-desktop">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; padding: 20px;">
                    ${cardRows}
                </div>
            </div>
        `;
    }

    // switchReportingTab removed as Governance is now the primary center

    async loadReportingData(tab) {
        const container = document.getElementById('reporting-table-container');
        if (!container) return;

        container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i><div>Loading...</div></div>`;

        try {
            const res = await client.get('/issues', { projectId: this.assignedProject?.id });
            const filterStatus = document.getElementById('issue-status-filter')?.value || 'all';
            const filterCategory = document.getElementById('issue-category-filter')?.value || 'all';
            let data = Array.isArray(res) ? res : (res.data || []);

            if (filterStatus !== 'all') {
                data = data.filter(i => (i.status || 'open').toLowerCase() === filterStatus);
            }
            if (filterCategory !== 'all') {
                data = data.filter(i => i.type === filterCategory || i.category === filterCategory);
            }

            this.renderIssuesTable(container, data);
        } catch (err) {
            console.error(`[FS] Error loading ${tab}:`, err);
            container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--red);"><i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 8px;"></i><div>Failed to load data.</div></div>`;
        }
    }

    renderIssuesTable(container, issues) {
        container.innerHTML = `
            <div class="hidden-mobile">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Evidence</th>
                                <th>Description</th>
                                <th>Latest Response</th>
                                <th style="text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${issues.length === 0 
                                ? '<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--slate-400);">No issues reported by you.</td></tr>'
                                : issues.map(issue => {
                                const statusClass = (issue.status || 'open').toLowerCase() === 'resolved' ? 'active' : (issue.status || '').toLowerCase() === 'in_progress' ? 'locked' : 'pending';
                                return `
                                    <tr>
                                        <td style="font-weight: 700;">#${issue.id || '—'}</td>
                                        <td>
                                            <span class="badge" style="background: var(--slate-100); color: var(--slate-600); font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                                                ${issue.category || issue.type || 'General'}
                                            </span>
                                        </td>
                                        <td><span class="status ${statusClass}" style="font-size: 10px; font-weight: 700;">${(issue.status || 'OPEN').toUpperCase()}</span></td>
                                        <td style="text-align: center;">
                                            ${issue.photoUrl || (issue.photos && issue.photos.length > 0) ? `
                                                <i class="fas fa-image" style="color: var(--blue); cursor: pointer;" title="View Evidence" 
                                                   onclick='window.viewDocument("${issue.photoUrl || issue.photos[0]}", "Evidence Preview")'></i>
                                            ` : '<span style="color: var(--slate-300);">—</span>'}
                                        </td>
                                        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px;">
                                            ${issue.description || 'No description provided'}
                                        </td>
                                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-style: italic; color: var(--slate-500); font-size: 12px;">
                                            ${issue.resolutionNotes || '<span style="opacity: 0.5;">Pending PM review...</span>'}
                                        </td>
                                        <td style="text-align: right;">
                                            <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 11px;" 
                                                onclick='window.drawer.open("Issue Details", window.DrawerTemplates.complaintDetails(${JSON.stringify(issue).replace(/"/g, '&quot;')}))'>
                                                <i class="fas fa-eye"></i> View Thread
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="hidden-desktop">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; padding: 20px;">
                    ${issues.length === 0 
                        ? '<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--slate-400);">No issues reported by you.</div>'
                        : issues.map(issue => {
                        const statusClass = (issue.status || 'open').toLowerCase() === 'resolved' ? 'active' : (issue.status || '').toLowerCase() === 'in_progress' ? 'locked' : 'pending';
                        return `
                            <div class="issue-card" style="background: white; border: 1px solid var(--slate-200); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div>
                                        <div style="font-weight: 800; font-size: 15px; color: var(--slate-900);">#${issue.id || '—'}</div>
                                        <span class="badge" style="background: var(--slate-100); color: var(--slate-600); font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; margin-top: 4px; display: inline-block;">
                                            ${issue.category || issue.type || 'General'}
                                        </span>
                                    </div>
                                    <span class="status ${statusClass}" style="font-size: 10px; font-weight: 700;">${(issue.status || 'OPEN').toUpperCase()}</span>
                                </div>
                                
                                <div style="font-size: 13px; color: var(--slate-600); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 36px;">
                                    ${issue.description || 'No description provided'}
                                </div>

                                <div style="padding: 12px; background: var(--slate-50); border-radius: 8px; border: 1px solid var(--slate-100); margin-top: 4px;">
                                    <div style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase; margin-bottom: 4px;">Latest Response</div>
                                    <div style="font-style: italic; color: var(--slate-600); font-size: 12px; line-height: 1.4;">
                                        ${issue.resolutionNotes || '<span style="opacity: 0.5;">Pending PM review...</span>'}
                                    </div>
                                </div>

                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                                    <div>
                                        ${issue.photoUrl || (issue.photos && issue.photos.length > 0) ? `
                                            <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 11px; color: var(--blue); border-color: var(--blue-light);" onclick='window.viewDocument("${issue.photoUrl || issue.photos[0]}", "Evidence Preview")'>
                                                <i class="fas fa-image"></i> View Evidence
                                            </button>
                                        ` : '<span style="font-size: 11px; color: var(--slate-400);"><i class="fas fa-image" style="opacity: 0.5;"></i> No Evidence</span>'}
                                    </div>
                                    <button class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 11px; border-radius: 8px;" 
                                        onclick='window.drawer.open("Issue Details", window.DrawerTemplates.complaintDetails(${JSON.stringify(issue).replace(/"/g, '&quot;')}))'>
                                        View Thread
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    switchView(view) {
        this.currentView = view;
        window.app.loadPage(this.currentView);
    }
}

// Apply modular mixins
Object.assign(FieldSupervisorDashboard.prototype, FS_Dashboard, FS_Logistics, FS_Equipment, FS_Tasks);
