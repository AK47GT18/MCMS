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
        
        const roadType = this.assignedProject?.roadSpecification?.roadType || 'RT-5';
        const phase = this.assignedProject.currentPhase || 1;

        console.log('[FS] Caching requisition data for:', roadType);

        try {
            // 1. Get recommendations (purely from mapping, no API needed)
            const resources = getRecommendedResources(roadType, phase);
            
            // Populate them immediately so the drawer isn't empty
            this.assignedProject.recommendedMachines = resources.machinery.map(m => ({
                ...m,
                available: true // Default to true while loading
            }));
            this.assignedProject.recommendedMaterials = resources.materials.map(m => ({
                ...m
            }));

            // 2. Fetch availability (async/background)
            Promise.all([
                client.get('/inventory').catch(() => []),
                assets.getAll().catch(() => [])
            ]).then(([inventoryRes, assetsRes]) => {
                const inventory = Array.isArray(inventoryRes) ? inventoryRes : (inventoryRes.data || inventoryRes.items || []);
                const allAssets = Array.isArray(assetsRes) ? assetsRes : (assetsRes.data || assetsRes.items || []);

                if (allAssets.length > 0) {
                    this.assignedProject.recommendedMachines = resources.machinery.map(m => {
                        const models = m.model.split(' / ').map(s => s.trim());
                        const availableAssets = allAssets.filter(a => models.includes(a.name) && a.status === 'available');
                        return {
                            ...m,
                            available: availableAssets.length > 0,
                            availableCount: availableAssets.length
                        };
                    });
                    // Refresh view if drawer is open? Or just let it be.
                }
            });

            console.log('[FS] Recommended machines loaded:', this.assignedProject.recommendedMachines.length);
        } catch (e) {
            console.error('[FS] Critical failure in requisition caching:', e);
            this.assignedProject.recommendedMachines = this.assignedProject.recommendedMachines || [];
            this.assignedProject.recommendedMaterials = this.assignedProject.recommendedMaterials || [];
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
        this.requisitionCart = []; // Reset cart for new request
        window.drawer.open('Request Resource', window.DrawerTemplates.requestResourceFS(this.assignedProject));
    }

    render() {
        // Trigger initial data load once
        if (this.projectLoading && !this._loadStarted) {
            this._loadStarted = true;
            setTimeout(() => {
                this._loadAssignedProject().then(() => {
                    this.projectLoading = false;
                    this._cacheRequisitionData().then(() => {
                        this._refreshCurrentView();
                    });
                    this._loadSiteInventory();
                    this._loadDashboardStats();
                    this._loadSiteAssets();
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
                        <button class="btn btn-secondary" onclick="window.app.openIssueDrawer(window.app.fsModule.assignedProject?.id, 'Report Site Issue')">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>Report Issue</span>
                        </button>
                        <button class="btn btn-secondary" onclick="window.app.fsModule.openResourceRequestDrawer()">
                            <i class="fas fa-plus-circle"></i>
                            <span>Request from EC</span>
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

    getReportingView() {
        // Trigger data load after render
        setTimeout(() => this.loadReportingData('incidents'), 0);

        return `
            <div style="margin-bottom: 24px;">
                <h2 style="font-size: 20px; font-weight: 800; color: var(--slate-900); margin-bottom: 4px;">Safety & Issues Center</h2>
                <p style="font-size: 13px; color: var(--slate-500);">Track incidents and reported issues across your site.</p>
            </div>

            <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid var(--slate-200); padding-bottom: 0;">
                <button id="tab_incidents" class="btn" style="padding: 10px 20px; font-weight: 700; font-size: 13px; border: none; border-bottom: 3px solid var(--red); color: var(--red); background: transparent; border-radius: 0; cursor: pointer;"
                    onclick="window.app.fsModule.switchReportingTab('incidents')">
                    <i class="fas fa-helmet-safety" style="margin-right: 6px;"></i> Safety Incidents
                </button>
                <button id="tab_issues" class="btn" style="padding: 10px 20px; font-weight: 700; font-size: 13px; border: none; border-bottom: 3px solid transparent; color: var(--slate-400); background: transparent; border-radius: 0; cursor: pointer;"
                    onclick="window.app.fsModule.switchReportingTab('issues')">
                    <i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i> Reported Issues
                </button>
                <div style="margin-left: auto; display: flex; gap: 8px;">
                    <button class="btn btn-primary" id="reporting_new_btn" style="padding: 8px 16px; font-size: 12px; background: var(--red); border-color: var(--red);"
                        onclick="window.drawer.open('Report Safety Incident', window.DrawerTemplates.safetyIncident())">
                        <i class="fas fa-plus"></i> Report New
                    </button>
                </div>
            </div>

            <div id="reporting-table-container" style="border: 1px solid var(--slate-200); border-radius: 12px; overflow: hidden; background: white;">
                <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                    <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                    <div>Loading reports...</div>
                </div>
            </div>
        `;
    }

    switchReportingTab(tab) {
        const incBtn = document.getElementById('tab_incidents');
        const issBtn = document.getElementById('tab_issues');
        const newBtn = document.getElementById('reporting_new_btn');

        if (tab === 'incidents') {
            incBtn.style.borderBottomColor = 'var(--red)';
            incBtn.style.color = 'var(--red)';
            issBtn.style.borderBottomColor = 'transparent';
            issBtn.style.color = 'var(--slate-400)';
            newBtn.style.background = 'var(--red)';
            newBtn.style.borderColor = 'var(--red)';
            newBtn.innerHTML = '<i class="fas fa-plus"></i> Report New';
            newBtn.onclick = () => window.drawer.open('Report Safety Incident', window.DrawerTemplates.safetyIncident());
        } else {
            issBtn.style.borderBottomColor = 'var(--amber)';
            issBtn.style.color = 'var(--amber-dark, #92400e)';
            incBtn.style.borderBottomColor = 'transparent';
            incBtn.style.color = 'var(--slate-400)';
            newBtn.style.background = 'var(--amber)';
            newBtn.style.borderColor = 'var(--amber)';
            newBtn.innerHTML = '<i class="fas fa-plus"></i> Report Issue';
            newBtn.onclick = () => window.drawer.open('Report Issue', window.DrawerTemplates.submitComplaint);
        }

        this.loadReportingData(tab);
    }

    async loadReportingData(tab) {
        const container = document.getElementById('reporting-table-container');
        if (!container) return;

        container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i><div>Loading...</div></div>`;

        try {
            const endpoint = tab === 'incidents' ? '/safety-incidents' : '/issues';
            const res = await client.get(endpoint, { projectId: this.assignedProject?.id });
            const data = Array.isArray(res) ? res : (res.data || []);

            if (data.length === 0) {
                const icon = tab === 'incidents' ? 'fa-shield-check' : 'fa-check-circle';
                const msg = tab === 'incidents' ? 'No safety incidents reported.' : 'No issues reported.';
                const color = tab === 'incidents' ? 'var(--emerald)' : 'var(--blue)';
                container.innerHTML = `
                    <div style="padding: 60px; text-align: center; color: var(--slate-400);">
                        <i class="fas ${icon}" style="font-size: 40px; margin-bottom: 16px; color: ${color};"></i>
                        <div style="font-weight: 700; font-size: 14px;">${msg}</div>
                        <div style="font-size: 12px; margin-top: 4px;">All clear on your site.</div>
                    </div>
                `;
                return;
            }

            if (tab === 'incidents') {
                this.renderIncidentsTable(container, data);
            } else {
                this.renderIssuesTable(container, data);
            }
        } catch (err) {
            console.error(`[FS] Error loading ${tab}:`, err);
            container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--red);"><i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 8px;"></i><div>Failed to load data.</div></div>`;
        }
    }

    renderIncidentsTable(container, incidents) {
        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--slate-50); border-bottom: 2px solid var(--slate-200); text-align: left;">
                        <th style="padding: 14px 16px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">ID</th>
                        <th style="padding: 14px 16px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Date</th>
                        <th style="padding: 14px 16px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Type</th>
                        <th style="padding: 14px 16px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Priority</th>
                        <th style="padding: 14px 16px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Status</th>
                        <th style="padding: 14px 16px; text-align: right; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${incidents.map(inc => {
                        const statusClass = (inc.status || 'pending').toLowerCase() === 'resolved' ? 'active' : 'pending';
                        const priorityColor = (inc.priority || 'high').toLowerCase() === 'high' ? 'var(--red)' : (inc.priority || '').toLowerCase() === 'medium' ? 'var(--amber)' : 'var(--emerald)';
                        return `
                            <tr style="border-bottom: 1px solid var(--slate-100); cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                                <td style="padding: 14px 16px; font-weight: 700; font-size: 13px; color: var(--slate-900);">${inc.id || '—'}</td>
                                <td style="padding: 14px 16px; font-size: 12px; color: var(--slate-600);">${new Date(inc.createdAt || Date.now()).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'2-digit'})}</td>
                                <td style="padding: 14px 16px; font-size: 13px; font-weight: 600;">${inc.type || 'Injury'}</td>
                                <td style="padding: 14px 16px;"><span style="color: ${priorityColor}; font-weight: 700; font-size: 12px; text-transform: uppercase;">${inc.priority || 'High'}</span></td>
                                <td style="padding: 14px 16px;"><span class="status ${statusClass}" style="font-size: 11px;">${(inc.status || 'PENDING').toUpperCase()}</span></td>
                                <td style="padding: 14px 16px; text-align: right;">
                                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px;" onclick='event.stopPropagation(); window.drawer.open("Incident Thread", window.DrawerTemplates.safetyIncident(${JSON.stringify(inc).replace(/'/g, "&#39;").replace(/"/g, "&quot;")}))'>
                                        <i class="fas fa-comments"></i> Thread
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    renderIssuesTable(container, issues) {
        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--slate-50); border-bottom: 2px solid var(--slate-200); text-align: left;">
                        <th style="padding: 14px 16px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">ID</th>
                        <th style="padding: 14px 16px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Date</th>
                        <th style="padding: 14px 16px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Category</th>
                        <th style="padding: 14px 16px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Priority</th>
                        <th style="padding: 14px 16px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Status</th>
                        <th style="padding: 14px 16px; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">PM Response</th>
                        <th style="padding: 14px 16px; text-align: right; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${issues.map(issue => {
                        const statusClass = (issue.status || 'open').toLowerCase() === 'resolved' ? 'active' : (issue.status || '').toLowerCase() === 'in_progress' ? 'locked' : 'pending';
                        const priorityColor = (issue.priority || 'medium').toLowerCase() === 'high' ? 'var(--red)' : (issue.priority || '').toLowerCase() === 'medium' ? 'var(--amber)' : 'var(--emerald)';
                        return `
                            <tr style="border-bottom: 1px solid var(--slate-100); cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                                <td style="padding: 14px 16px; font-weight: 700; font-size: 13px; color: var(--slate-900);">#${issue.id || '—'}</td>
                                <td style="padding: 14px 16px; font-size: 12px; color: var(--slate-600);">${new Date(issue.createdAt || Date.now()).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'2-digit'})}</td>
                                <td style="padding: 14px 16px; font-size: 13px; font-weight: 600;">${issue.category || 'General'}</td>
                                <td style="padding: 14px 16px;"><span style="color: ${priorityColor}; font-weight: 700; font-size: 12px; text-transform: uppercase;">${issue.priority || 'Medium'}</span></td>
                                <td style="padding: 14px 16px;"><span class="status ${statusClass}" style="font-size: 11px;">${(issue.status || 'OPEN').toUpperCase()}</span></td>
                                <td style="padding: 14px 16px; font-size: 12px; color: var(--slate-500); font-style: italic; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${issue.resolutionNotes || 'Awaiting response...'}
                                </td>
                                <td style="padding: 14px 16px; text-align: right;">
                                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px;" onclick='event.stopPropagation(); window.drawer.open("Issue Details", window.DrawerTemplates.complaintDetails(${JSON.stringify(issue).replace(/'/g, "&#39;").replace(/"/g, "&quot;")}))'>
                                        <i class="fas fa-eye"></i> Details
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    switchView(view) {
        this.currentView = view;
        window.app.loadPage(this.currentView);
    }
}

// Apply modular mixins
Object.assign(FieldSupervisorDashboard.prototype, FS_Dashboard, FS_Logistics, FS_Equipment, FS_Tasks);
