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

    async _loadSiteInventory() {
        try {
            const projectId = this.assignedProject?.id || 1;
            const result = await client.get(`/inventory/project/${projectId}`);
            const items = Array.isArray(result) ? result : (result.data || []);

            this.siteInventory = {};
            items.forEach(item => {
                this.siteInventory[item.materialName] = {
                    qty: Number(item.quantityOnHand || 0),
                    unit: item.unit,
                    sectorId: item.sectorId,
                    sectorName: item.sectorName,
                    inventoryId: item.id
                };
            });
            this.inventoryLoaded = true;
            this._refreshCurrentView();
        } catch (error) {
            this.inventoryLoaded = true;
            console.error('[FS] Failed to load site inventory:', error);
        }
    }

    async _loadSiteAssets() {
        try {
            const result = await assets.getAll({ status: 'checked_out' });
            const data = result.data || result;
            this.siteAssets = Array.isArray(data) ? data : (data.items || []);
            this.assetsLoaded = true;
            this._refreshCurrentView();
        } catch (error) {
            this.assetsLoaded = true;
            console.error('[FS] Failed to load site assets:', error);
        }
    }

    async _loadDashboardStats() {
        try {
            const result = await client.get('/daily-logs', {
                projectId: this.assignedProject?.id,
                date: new Date().toISOString().split('T')[0]
            });
            const logs = Array.isArray(result) ? result : (result.data || []);
            this.dailyLogsCount = logs.length;
            this._refreshCurrentView();
        } catch (error) {
            console.error('[FS] Failed to load dashboard stats:', error);
        }
    }

    async _loadAssignedProject() {
        try {
            const result = await client.get('/projects');
            const projects = Array.isArray(result) ? result : (result.data || []);
            // Get the first project assigned to this supervisor
            this.assignedProject = projects[0] || null;
        } catch (error) {
            console.error('[FS] Failed to load assigned project:', error);
        }
    }

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

    getDashboardView() {
        const inventoryEntries = Object.entries(this.siteInventory);
        const lowStock = inventoryEntries.some(([, i]) => i.qty === 0);
        const inTransitCount = this.siteAssets.filter(a => a.status === 'in_transit').length;

        return `
            <div class="stats-grid">
               <div class="stat-card" style="cursor: pointer;" onclick="window.app.fsModule.switchView('logistics')">
                  <div class="stat-header"><span class="stat-label" style="color: var(--blue);">Site Stock</span><i class="fas fa-cubes" style="color: var(--blue);"></i></div>
                  <div class="stat-value">${inventoryEntries.length}</div>
                  <div class="stat-sub">Tracked materials</div>
               </div>
               <div class="stat-card" style="cursor: pointer;" onclick="window.app.fsModule.switchView('logistics')">
                  <div class="stat-header"><span class="stat-label" style="color: ${lowStock ? 'var(--red)' : 'var(--emerald)'};">Stock Health</span><i class="fas fa-${lowStock ? 'exclamation-triangle' : 'check-circle'}" style="color: ${lowStock ? 'var(--red)' : 'var(--emerald)'};"></i></div>
                  <div class="stat-value" style="font-size: 16px;">${lowStock ? 'Stock Alert' : 'Healthy'}</div>
                  <div class="stat-sub">${lowStock ? 'Depleted materials detected' : 'All resources on hand'}</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Site Equipment</span><i class="fas fa-truck-monster" style="color: var(--blue);"></i></div>
                  <div class="stat-value">${this.siteAssets.length}</div>
                  <div class="stat-sub">Assigned to site</div>
               </div>
               <div class="stat-card" style="border-color: var(--emerald-light); background: #f0fdf4;">
                  <div class="stat-header"><span class="stat-label" style="color: var(--emerald);">Site Logs</span><i class="fas fa-clipboard-check" style="color: var(--emerald);"></i></div>
                  <div class="stat-value">${this.dailyLogsCount}</div>
                  <div class="stat-sub">Submitted Today</div>
               </div>
            </div>

            <div class="stats-grid action-tiles" style="margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                <div class="stat-card" style="border: 1px solid var(--slate-200); cursor: pointer;" onclick="window.drawer.open('Daily Progress', window.DrawerTemplates.dailyProgressLog())">
                    <div style="color: var(--orange); margin-bottom: 12px; font-size: 20px;"><i class="fas fa-camera"></i></div>
                    <div style="font-weight: 800; font-size: 13px;">Daily Log</div>
                </div>
                <div class="stat-card" style="border: 1px solid var(--slate-200); cursor: pointer;" onclick="window.drawer.open('Request Resource', window.DrawerTemplates.requestResourceFS)">
                    <div style="color: var(--blue); margin-bottom: 12px; font-size: 20px;"><i class="fas fa-plus-circle"></i></div>
                    <div style="font-weight: 800; font-size: 13px;">Request</div>
                </div>
                <div class="stat-card" style="border: 1px solid var(--slate-200); cursor: pointer;" onclick="window.drawer.open('Safety Incident', window.DrawerTemplates.safetyIncident)">
                    <div style="color: var(--red); margin-bottom: 12px; font-size: 20px;"><i class="fas fa-helmet-safety"></i></div>
                    <div style="font-weight: 800; font-size: 13px;">Incident</div>
                </div>
                <div class="stat-card" style="border: 1px solid var(--slate-200); cursor: pointer;" onclick="window.drawer.open('Report Issue', window.DrawerTemplates.submitComplaint)">
                    <div style="color: var(--amber); margin-bottom: 12px; font-size: 20px;"><i class="fas fa-exclamation-triangle"></i></div>
                    <div style="font-weight: 800; font-size: 13px;">Issue</div>
                </div>
            </div>

            <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-top: 24px;">
                <div class="data-card">
                    <div class="data-card-header"><div class="card-title">Live Site Activity</div></div>
                    <div style="padding: 24px;">
                        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                            <div style="flex: 1; padding: 16px; background: var(--slate-50); border-radius: 12px;">
                                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Current Workstation</div>
                                <div style="font-size: 14px; font-weight: 800; margin-top: 4px;">${this.assignedProject?.name || 'Loading…'}</div>
                            </div>
                            <div style="flex: 1; padding: 16px; background: var(--slate-50); border-radius: 12px;">
                                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Active Phase</div>
                                <div style="font-size: 14px; font-weight: 800; margin-top: 4px; color: var(--blue);">${this.assignedProject?.status || 'Loading…'}</div>
                            </div>
                        </div>
                        <div style="height: 12px; background: var(--slate-100); border-radius: 6px; overflow: hidden; margin-bottom: 8px;">
                            <div style="width: ${this.assignedProject?.progress || 0}%; background: var(--emerald); height: 100%; transition: width 0.5s ease;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: var(--slate-500);">
                            <span>Execution Progress</span>
                            <span>${this.assignedProject?.progress || 0}% Complete</span>
                        </div>
                    </div>
                </div>

                <div class="data-card">
                    <div class="data-card-header"><div class="card-title">Quick Tasks</div></div>
                    <div style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
                        <button class="btn btn-secondary" onclick="window.drawer.open('Attendance', window.DrawerTemplates.attendanceLog)">Mark Site Attendance</button>
                        <button class="btn btn-secondary" onclick="window.app.fsModule.switchView('logistics')">View Site Inventory</button>
                        <button class="btn btn-secondary" onclick="window.app.fsModule.switchView('tasks')">View Work Orders</button>
                    </div>
                </div>
            </div>
        `;
    }

    getLogisticsView() {
        // Trigger refresh
        setTimeout(() => this._loadSiteInventory(), 0);

        const entries = Object.entries(this.siteInventory);

        return `
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="data-card-header">
                    <div class="card-title">Site Material Inventory</div>
                    <button class="btn btn-secondary" onclick="window.app.fsModule._loadSiteInventory()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                ${!this.inventoryLoaded 
                ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading site inventory from server…</div></div>'
                : (entries.length === 0 
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-box-open" style="font-size:24px; margin-bottom:12px; display:block;"></i><div>No materials currently assigned to this site.</div></div>'
                    : `<table>
                        <thead>
                            <tr><th>Material</th><th>On-Site Stock</th><th>Sector</th><th style="text-align: right;">Action</th></tr>
                        </thead>
                        <tbody>
                            ${entries.map(([name, data]) => `
                                <tr>
                                    <td style="font-weight: 700;">${name}</td>
                                    <td style="font-family: 'JetBrains Mono'; font-weight: 800; font-size: 15px; color: ${data.qty === 0 ? 'var(--red)' : 'var(--slate-900)'};">${data.qty} ${data.unit}</td>
                                    <td style="font-size: 12px; color: var(--slate-500);">${data.sectorName || '--'}</td>
                                    <td style="text-align: right;">
                                        <button class="btn btn-secondary" onclick="window.drawer.open('Log Burn', window.DrawerTemplates.logMaterialBurn(${JSON.stringify({ name, ...data }).replace(/"/g, '&quot;')}))" ${data.qty === 0 ? 'disabled' : ''}>Log Consumption</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                )
            }
            </div>

            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title" style="color: var(--blue);">Site Equipment</div>
                </div>
                ${!this.assetsLoaded
                ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Checking site equipment fleet…</div></div>'
                : (this.siteAssets.length === 0
                    ? '<div style="padding: 32px; text-align: center; color: var(--slate-400);"><i class="fas fa-truck-pickup" style="font-size:24px; margin-bottom:12px; display:block; opacity: 0.5;"></i>No equipment currently assigned to site.</div>'
                    : `<table>
                        <thead><tr><th>Asset</th><th>Code</th><th>Status</th><th style="text-align: right;">Action</th></tr></thead>
                        <tbody>
                            ${this.siteAssets.map(asset => `
                                <tr>
                                    <td style="font-weight: 700;">${asset.name}</td>
                                    <td><span class="project-id">${asset.assetCode || asset.id}</span></td>
                                    <td>
                                        <span class="status ${asset.status === 'maintenance' ? 'locked' : (asset.status === 'checked_out' ? 'active' : 'pending')}" style="${asset.status === 'maintenance' ? 'background: var(--red-light); color: var(--red);' : ''}">${(asset.status || '').replace(/_/g, ' ')}</span>
                                    </td>
                                    <td style="text-align: right;">
                                        ${asset.status !== 'maintenance' ?
                        `<button class="btn btn-secondary" onclick="window.app.fsModule.handleReportBreakdown('${asset.id}', '${asset.name}')" style="color: var(--red); border-color: var(--red-light);">
                                             <i class="fas fa-triangle-exclamation"></i> Report Breakdown
                                           </button>` : `<span style="font-size: 12px; color: var(--slate-400);">In Maintenance</span>`
                    }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                )
            }
            </div>
        `;
    }

    // --- LOGISTICS HANDLERS ---

    switchView(view) {
        this.currentView = view;
        window.app.loadPage(this.currentView);
    }

    async handleReportBreakdown(assetId, assetName) {
        if (!confirm(`Are you sure you want to flag ${assetName} as BROKEN DOWN? This will immediately halt operations for this equipment and alert the Equipment Coordinator.`)) {
            return;
        }

        try {
            await window.loader.show('Reporting breakdown to base...', async () => {
                await window.assets.flagIssue(assetId, `Field Supervisor reported breakdown on site.`);
            });
            window.modal.showSuccess('Breakdown Reported', `${assetName} has been flagged for maintenance.`);
            await this._loadSiteAssets();
        } catch (error) {
            console.error('[FS] Failed to report breakdown:', error);
            window.modal.showError('Report Failed', error.message || 'Failed to report breakdown');
        }
    }

    toggleRequestType(type, btn) {
        const machView = document.getElementById('fs_machinery_req_view');
        const matView = document.getElementById('fs_material_req_view');
        if (!machView || !matView) return;

        if (type === 'machinery') {
            machView.style.display = 'block';
            matView.style.display = 'none';
        } else {
            machView.style.display = 'none';
            matView.style.display = 'block';
        }

        document.querySelectorAll('.active-resource').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    async handleSubmitRequisition() {
        const isMachinery = document.getElementById('fs_btn_machinery')?.classList.contains('active');
        const item = isMachinery ? document.getElementById('fs_req_asset')?.value : document.getElementById('fs_req_material')?.value;
        const qty = isMachinery ? 1 : document.getElementById('fs_req_qty')?.value;
        console.log('[FS] Transmitting request to Equipment Coordinator…');

        try {
            // Submit via API
            await client.post('/requisitions', {
                projectId: this.assignedProject?.id || 1,
                totalAmount: 0,
                vendorName: 'Internal Request',
                items: [{ itemName: item, quantity: Number(qty) || 1, unitPrice: 0 }]
            });

            setTimeout(() => {
                window.drawer.close();
                console.log(`[FS] Request for ${item} submitted.`);
            }, 800);
        } catch (error) {
            console.error('[FS] Request failed:', error);
        }
    }

    handleConfirmIntake(id) {
        // This is now handled via the inventory API
        const item = this.incomingLogistics.find(i => i.id === id);
        if (!item) return;

        console.log(`[FS] Acknowledging receipt of ${item.item}…`);

        // Update via API
        if (item.type !== 'Machinery' && item.qty) {
            inventoryApi.distribute({
                sectorId: 1,
                materialName: item.item,
                unit: item.unit || 'Units',
                quantity: item.qty,
                reference: `Intake: ${id}`,
                notes: 'Confirmed arrival at site'
            }).then(() => {
                this.incomingLogistics = this.incomingLogistics.filter(i => i.id !== id);
                this._loadSiteInventory();
                console.log('[FS] Logistics intake complete. Inventory updated.');
            }).catch(err => {
                console.error('[FS] Intake failed:', err);
            });
        }
    }

    async handleExecuteBurn(name) {
        const qty = Number(document.getElementById('burn_qty')?.value);
        if (!qty) return;

        const material = this.siteInventory[name];
        if (!material || material.qty < qty) return;

        console.log('[FS] Recording material consumption…');

        try {
            await inventoryApi.consume({
                sectorId: material.sectorId || 1,
                materialName: name,
                quantity: qty,
                reference: section,
                notes: `Consumed at ${section} by Field Supervisor`
            });

            setTimeout(() => {
                window.drawer.close();
                this._loadSiteInventory();
                console.log(`[FS] Consumed ${qty} units. Stock updated.`);
            }, 600);
        } catch (error) {
            console.error('[FS] Consumption failed:', error);
        }
    }

    // --- EXISTING VIEWS (Gantt, Tasks, Equipment) ---

    getTasksView() {
        setTimeout(() => this._loadTasks(), 0);
        return `
            <div class="data-card">
              <div class="data-card-header"><div class="card-title">Assigned Tasks</div></div>
              <div id="fs-tasks-container">
                <div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading tasks…</div></div>
              </div>
            </div>
        `;
    }

    async _loadTasks() {
        const container = document.getElementById('fs-tasks-container');
        if (!container) return;

        try {
            const projectId = this.assignedProject?.id || 1;
            const result = await tasks.getByProject(projectId);
            const data = result.data || result;
            const taskList = Array.isArray(data) ? data : (data.tasks || []);

            if (taskList.length === 0) {
                container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--slate-400);">No tasks assigned yet.</div>';
                return;
            }

            container.innerHTML = `
                <table>
                    <thead><tr><th>Task</th><th>Start</th><th>End</th><th>Progress</th><th>Action</th></tr></thead>
                    <tbody>
                        ${taskList.map(t => `
                            <tr>
                                <td style="font-weight: 700;">${t.name}</td>
                                <td>${t.startDate ? new Date(t.startDate).toLocaleDateString() : '--'}</td>
                                <td>${t.endDate ? new Date(t.endDate).toLocaleDateString() : '--'}</td>
                                <td>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <div style="flex:1; height:6px; background:var(--slate-100); border-radius:3px;"><div style="width:${t.progress || 0}%; height:100%; background:var(--orange); border-radius:3px;"></div></div>
                                        <span style="font-size:11px; font-weight:700;">${t.progress || 0}%</span>
                                    </div>
                                </td>
                                <td><button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="window.drawer.open('Update Task', window.DrawerTemplates.updateTask)">Update</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">Failed to load tasks: ${error.message}</div>`;
        }
    }

    getGanttView() {
        setTimeout(() => this.renderGanttChart(), 100);

        const viewModes = ['Day', 'Week', 'Month', 'Year'];
        const viewModeOptions = viewModes.map(m =>
            `<option value="${m}" ${this.currentGanttViewMode === m ? 'selected' : ''}>${m}</option>`
        ).join('');

        return `
            <div class="data-card">
                <div class="data-card-header" style="background: var(--slate-50); border-bottom: 1px solid var(--slate-200);">
                    <div style="display:flex; gap:16px; align-items:center;">
                         <div style="width: 32px; height: 32px; background: white; border-radius: 6px; border: 1px solid var(--slate-200); display: flex; align-items: center; justify-content: center; color: var(--slate-600);">
                            <i class="fas fa-calendar-alt"></i>
                         </div>
                         <div>
                            <div style="font-weight:700; font-size: 14px;">Execution Schedule</div>
                            <div style="font-size:11px; color:var(--slate-500);">Project: ${this.assignedProject?.name || 'Loading…'}</div>
                         </div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="window.app.fsModule.scrollToToday()">
                            <i class="fas fa-crosshairs"></i> Today
                        </button>
                        <select class="form-input" style="padding: 6px 12px; font-size: 12px; border-radius: 6px; min-width: 100px;" onchange="window.app.fsModule.changeGanttViewMode(this.value)">
                            ${viewModeOptions}
                        </select>
                    </div>
                </div>
                </div>
                <div id="gantt-chart-container" style="position: relative; overflow-x:auto; background: white; min-height: 400px; padding: 20px; border: 1px solid var(--slate-100); border-radius: 8px;">
                    <div class="gantt-landscape-prompt">
                        <div style="text-align: center; color: white;">
                            <i class="fas fa-mobile-alt" style="font-size: 40px; margin-bottom: 15px; transform: rotate(90deg); display: block;"></i>
                            <h3 style="margin-bottom: 10px;">Rotate Device</h3>
                            <p style="font-size: 14px;">Please rotate your phone to landscape mode to view the schedule properly.</p>
                        </div>
                    </div>
                    <div id="gantt" class="gantt-target" style="position: relative; min-height: 350px;"></div>
                </div>
            </div>
        `;
    }

    async renderGanttChart() {
        try {
            const el = document.getElementById('gantt');
            if (!el) return;

            const projectId = this.assignedProject?.id || 1;
            const response = await tasks.getByProject(projectId);
            const data = response.data || response;
            const tasksList = Array.isArray(data) ? data : (data.tasks || []);

            if (tasksList.length === 0) {
                el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--slate-400);">No tasks scheduled yet.</div>';
                return;
            }

            const mappedTasks = tasksList.map(t => ({
                id: (t.id || t.code).toString(),
                name: t.name,
                start: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                end: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                progress: t.progress || 0,
                dependencies: t.dependencyId ? t.dependencyId.toString() : ''
            }));

            el.innerHTML = '';

            const GanttCls = window.Gantt || window.FrappeGantt;
            if (!GanttCls) {
                el.innerHTML = '<div style="padding:20px; text-align:center; color:var(--slate-400);">Gantt library loading…</div>';
                return;
            }

            this.ganttInstance = new GanttCls("#gantt", mappedTasks, {
                header_height: 50,
                column_width: 30,
                bar_height: 25,
                bar_corner_radius: 4,
                view_mode: this.currentGanttViewMode,
                date_format: 'YYYY-MM-DD',
                on_click: (task) => {
                    window.drawer.open('End of Day Log: ' + task.name, window.DrawerTemplates.dailyProgressLog(task.id));
                }
            });

        } catch (e) {
            console.error('[FS Gantt] Error:', e);
            const el = document.getElementById('gantt');
            if (el) el.innerHTML = `<div style="padding:20px; color:var(--red);">Gantt Error: ${e.message}</div>`;
        }
    }

    getEquipmentView() {
        setTimeout(() => this._loadSiteAssets(), 0);

        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">On-Site Equipment</div>
                <button class="btn btn-primary" onclick="window.drawer.open('Request Equipment', window.DrawerTemplates.requestResourceFS)"><i class="fas fa-plus"></i> Request</button>
              </div>
              ${!this.assetsLoaded
                ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Syncing site fleet status…</div></div>'
                : (this.siteAssets.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-truck-loading" style="font-size:24px; margin-bottom:12px; display:block;"></i>No equipment assigned to this workstation.</div>'
                    : `<table>
                    <thead><tr><th>Asset</th><th>ID</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${this.siteAssets.map(asset => `
                            <tr>
                                <td style="font-weight: 700;">${asset.name}</td>
                                <td><span class="project-id">${asset.assetCode || asset.id}</span></td>
                                <td>${asset.category || '--'}</td>
                                <td><span class="status ${asset.status === 'checked_out' ? 'active' : 'pending'}">${(asset.status || '').replace(/_/g, ' ')}</span></td>
                                <td><button class="btn btn-secondary" style="padding:4px 8px; font-size:10px;">Log Usage</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`
                )
            }
            </div>
        `;
    }

    changeGanttViewMode(mode) {
        this.currentGanttViewMode = mode;
        if (this.ganttInstance) this.ganttInstance.change_view_mode(mode);
    }

    scrollToToday() {
        if (this.ganttInstance?.scroll_today) this.ganttInstance.scroll_today();
    }

    async handleDailyLogSubmit(payloadOverride = null) {
        try {
            // Get location if available
            let lat = null, lng = null;
            if (navigator.geolocation) {
                try {
                    console.log('[FS] Verifying site coordinates...');
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000
                        });
                    });
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                } catch (e) {
                    console.warn('GPS capture failed:', e);
                    if (e.code === 1) {
                        throw new Error('Location permission denied. Please enable GPS in your browser/device settings to submit logs.');
                    }
                    throw new Error('Could not verify location. Please ensure location services are enabled and you have internet/GPS connection.');
                }
            } else {
                throw new Error('Geolocation is not supported by your browser.');
            }

            console.log('[FS] Uploading site log...');

            // Build payload
            const payload = {
                projectId: this.assignedProject?.id || 1, // Fallback for testing
                logDate: new Date().toISOString().split('T')[0],
                narrative: payloadOverride?.narrative || document.getElementById('daily-narrative')?.value || 'Daily Progress',
                status: 'submitted',
                submissionLat: lat,
                submissionLng: lng
            };

            // Add extra fields if payload override provided
            if (payloadOverride) {
                if (payloadOverride.taskId) payload.taskId = parseInt(payloadOverride.taskId);
                if (payloadOverride.progressIncrement) payload.progressIncrement = parseInt(payloadOverride.progressIncrement);
                if (payloadOverride.expenseItems) payload.expenseItems = payloadOverride.expenseItems;
                if (payloadOverride.sos) payload.isSos = true;
            }

            await dailyLogs.create(payload);
            console.log('[FS] Daily progress logged successfully');
            window.drawer.close();
            this._loadDashboardStats(); // Refresh stats 
        } catch (error) {
            console.error('Log submission error:', error);
            let errorMsg = error.response?.data?.message || error.message || 'Failed to submit log';
            errorMsg = errorMsg.replace('ValidationError: ', '').replace('AppError: ', '');
            console.error('[FS] Log submission error:', error);
        }
    }
}
