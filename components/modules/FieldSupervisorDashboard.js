export class FieldSupervisorDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.projectWallet = { total: 5000000, spent: 4200000 };
        this.currentGanttViewMode = 'Day';

        // --- SITE LOGISTICS STATE (SESSION-BASED) ---
        this.siteInventory = {
            'Cement OPC': { qty: 25, unit: 'Bags' },
            'Diesel Fuel': { qty: 850, unit: 'Liters' },
            'Bitumen G-Grade': { qty: 0, unit: 'Drums' }
        };

        this.incomingLogistics = [
            { id: 'DS-201', sender: 'Equipment Coordinator', item: 'Bitumen G-Grade', qty: 20, unit: 'Drums', status: 'In Transit', eta: 'Today, 17:00' },
            { id: 'DS-205', sender: 'Equipment Coordinator', item: 'Yellow Roller (CAT)', type: 'Machinery', status: 'In Transit', eta: 'Tomorrow' }
        ];

        // Register module globally for template access
        window.app = window.app || {};
        window.app.fsModule = this;
    }

    render() {
        let contentHTML = '';
        
        switch(this.currentView) {
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

        return `
            <div class="page-header">
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">${current.title}</h1>
                    <div class="context-strip">
                      <span class="context-value">${current.context}</span>
                      <span style="color: var(--slate-400);">•</span>
                      <span style="color: var(--emerald); font-weight: 700;">14 Workers Present</span>
                    </div>
                  </div>
                  <div style="display:flex; gap:8px;">
                    <button class="btn btn-secondary" onclick="window.drawer.open('Request Resource', window.DrawerTemplates.requestResourceFS)">
                        <i class="fas fa-plus-circle"></i>
                        <span>Request Resource</span>
                    </button>
                    <button class="btn btn-action" onclick="window.drawer.open('Daily Progress', window.DrawerTemplates.dailyProgressLog)">
                        <i class="fas fa-camera"></i>
                        <span>Submit Progress</span>
                    </button>
                  </div>
                </div>
            </div>
        `;
    }

    getDashboardView() {
        const transitCount = this.incomingLogistics.length;
        const lowStock = Object.values(this.siteInventory).some(i => i.qty === 0);

        return `
            <div class="stats-grid">
               <div class="stat-card" style="cursor: pointer;" onclick="window.app.fsModule.switchView('logistics')">
                  <div class="stat-header"><span class="stat-label" style="color: var(--blue);">Logistics Intake</span><i class="fas fa-truck-ramp-box" style="color: var(--blue);"></i></div>
                  <div class="stat-value">${transitCount}</div>
                  <div class="stat-sub">Items In-Transit from Silo</div>
               </div>
               <div class="stat-card" style="cursor: pointer;" onclick="window.app.fsModule.switchView('logistics')">
                  <div class="stat-header"><span class="stat-label" style="color: ${lowStock ? 'var(--red)' : 'var(--emerald)'};">Site Stock</span><i class="fas fa-cubes" style="color: ${lowStock ? 'var(--red)' : 'var(--emerald)'};"></i></div>
                  <div class="stat-value" style="font-size: 16px;">${lowStock ? 'Stock Alert' : 'Healthy'}</div>
                  <div class="stat-sub">${lowStock ? 'Bitumen depleted' : 'All resources on hand'}</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Site Budget</span><i class="fas fa-wallet" style="color: var(--blue);"></i></div>
                  <div class="stat-value" style="font-size: 18px;">MWK 800K</div>
                  <div class="stat-sub">Remaining Petty Cash</div>
               </div>
               <div class="stat-card" style="border-color: var(--emerald-light); background: #f0fdf4;">
                  <div class="stat-header"><span class="stat-label" style="color: var(--emerald);">Safety Day</span><i class="fas fa-shield-heart" style="color: var(--emerald);"></i></div>
                  <div class="stat-value">124</div>
                  <div class="stat-sub">Days Zero-Incident</div>
               </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 24px;">
                <div class="data-card">
                    <div class="data-card-header"><div class="card-title">Live Site Activity</div></div>
                    <div style="padding: 24px;">
                        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                            <div style="flex: 1; padding: 16px; background: var(--slate-50); border-radius: 12px;">
                                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Current Workstation</div>
                                <div style="font-size: 14px; font-weight: 800; margin-top: 4px;">KM 12 + 500</div>
                            </div>
                            <div style="flex: 1; padding: 16px; background: var(--slate-50); border-radius: 12px;">
                                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Active Phase</div>
                                <div style="font-size: 14px; font-weight: 800; margin-top: 4px; color: var(--blue);">Phase 3: Sub-base</div>
                            </div>
                        </div>
                        <div style="height: 12px; background: var(--slate-100); border-radius: 6px; overflow: hidden; margin-bottom: 8px;">
                            <div style="width: 65%; background: var(--emerald); height: 100%;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: var(--slate-500);">
                            <span>Execution Progress</span>
                            <span>65% Complete</span>
                        </div>
                    </div>
                </div>

                <div class="data-card">
                    <div class="data-card-header"><div class="card-title">Quick Tasks</div></div>
                    <div style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
                        <button class="btn btn-secondary" onclick="window.drawer.open('Attendance', window.DrawerTemplates.attendanceLog)">Mark Site Attendance</button>
                        <button class="btn btn-secondary" onclick="window.drawer.open('Daily Log', window.DrawerTemplates.dailyReport)">Log Daily Site Burn</button>
                        <button class="btn btn-secondary" onclick="window.app.fsModule.switchView('tasks')">View Work Orders</button>
                    </div>
                </div>
            </div>
        `;
    }

    getLogisticsView() {
        return `
            <div class="data-card" style="margin-bottom: 24px; border: 1px solid var(--blue-border); background: #f8fafc;">
                <div class="data-card-header">
                    <div class="card-title" style="color: var(--blue);">Incoming Resources (In Transit)</div>
                </div>
                <table>
                    <thead>
                        <tr><th>Disp. ID</th><th>Resource</th><th>Quantity</th><th>Status</th><th style="text-align: right;">Action</th></tr>
                    </thead>
                    <tbody>
                        ${this.incomingLogistics.length === 0 ? `<tr><td colspan="5" style="text-align: center; color: var(--slate-400); padding: 20px;">No incoming logistics orders.</td></tr>` : 
                            this.incomingLogistics.map(item => `
                            <tr>
                                <td><span class="project-id">${item.id}</span></td>
                                <td style="font-weight: 700;">${item.item} ${item.type === 'Machinery' ? '<i class="fas fa-truck-monster" style="color:var(--slate-400); margin-left:4px;"></i>' : ''}</td>
                                <td>${item.qty ? `${item.qty} ${item.unit}` : '1 Unit'}</td>
                                <td><span class="status pending">${item.status}</span></td>
                                <td style="text-align: right;">
                                    <button class="btn btn-primary" onclick="window.app.fsModule.handleConfirmIntake('${item.id}')">Confirm Arrival</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Site Material Inventory</div>
                </div>
                <table>
                    <thead>
                        <tr><th>Material</th><th>On-Site Stock</th><th style="text-align: right;">Action</th></tr>
                    </thead>
                    <tbody>
                        ${Object.entries(this.siteInventory).map(([name, data]) => `
                            <tr>
                                <td style="font-weight: 700;">${name}</td>
                                <td style="font-family: 'JetBrains Mono'; font-weight: 800; font-size: 15px; color: ${data.qty === 0 ? 'var(--red)' : 'var(--slate-900)'};">${data.qty} ${data.unit}</td>
                                <td style="text-align: right;">
                                    <button class="btn btn-secondary" onclick="window.drawer.open('Log Burn', window.DrawerTemplates.logMaterialBurn(${JSON.stringify({name, ...data})}))" ${data.qty === 0 ? 'disabled' : ''}>Log Consumption</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // --- LOGISTICS HANDLERS ---

    switchView(view) {
        this.currentView = view;
        window.app.loadPage(this.currentView);
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
        const isMachinery = document.getElementById('fs_btn_machinery').classList.contains('active');
        const item = isMachinery ? document.getElementById('fs_req_asset').value : document.getElementById('fs_req_material').value;
        const qty = isMachinery ? 1 : document.getElementById('fs_req_qty').value;
        const section = document.getElementById('fs_req_section').value;
        const urgency = document.getElementById('fs_req_urgency').value;

        if (!section) {
            window.toast.show('Please specify the workstation (KM section).', 'warning');
            return;
        }

        window.toast.show('Transmitting request to Equipment Coordinator...', 'info');

        setTimeout(() => {
            window.drawer.close();
            window.toast.show(`Request for ${item} submitted with ${urgency} priority.`, 'success');
        }, 1200);
    }

    handleConfirmIntake(id) {
        const item = this.incomingLogistics.find(i => i.id === id);
        if (!item) return;

        window.toast.show(`Acknowledging receipt of ${item.item}...`, 'info');

        if (item.type !== 'Machinery' && this.siteInventory[item.item]) {
            this.siteInventory[item.item].qty += item.qty;
        }

        this.incomingLogistics = this.incomingLogistics.filter(i => i.id !== id);

        setTimeout(() => {
            window.app.loadPage(this.currentView);
            window.toast.show('Logistics intake complete. Inventory updated.', 'success');
        }, 800);
    }

    handleExecuteBurn(name) {
        const qty = Number(document.getElementById('burn_qty')?.value);
        const section = document.getElementById('burn_section')?.value;

        if (!qty || !section) {
            window.toast.show('Please specify quantity and stationing.', 'warning');
            return;
        }

        if (this.siteInventory[name].qty < qty) {
            window.toast.show('Insufficient site stock for this burn.', 'error');
            return;
        }

        this.siteInventory[name].qty -= qty;
        
        window.toast.show('Recording material consumption...', 'info');

        setTimeout(() => {
            window.drawer.close();
            window.app.loadPage(this.currentView);
            window.toast.show(`Consumed ${qty} units at ${section}. Stock updated.`, 'success');
        }, 800);
    }

    // --- EXISTING GANTT & OTHER VIEWS ---
    getTasksView() {
        return `
            <div class="data-card">
              <div class="data-card-header"><div class="card-title">Assigned Tasks</div></div>
              <table>
                <thead><tr><th>Task</th><th>Deadline</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                    <tr><td>Excavate Trench A</td><td>Today, 16:00</td><td><span class="status pending">In Progress</span></td><td><button class="btn btn-secondary" onclick="window.drawer.open('Update Task', window.DrawerTemplates.updateTask)">Update</button></td></tr>
                    <tr><td>Compact Soil</td><td>Tomorrow</td><td><span class="status">Scheduled</span></td><td></td></tr>
                </tbody>
              </table>
            </div>
        `;
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
                             <!-- Dynamic Budget Alert -->
                            <div id="gantt-budget-alert" style="font-size:11px; color:${(this.projectWallet.spent / this.projectWallet.total) > 0.8 ? 'var(--red)' : 'var(--slate-500)'}; font-weight:600;">
                                Budget Health: ${Math.round((this.projectWallet.spent / this.projectWallet.total) * 100)}% Spent ${(this.projectWallet.spent / this.projectWallet.total) > 0.8 ? '(Warning)' : ''}
                            </div>
                         </div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="window.app.fsModule.scrollToToday()">
                            <i class="fas fa-crosshairs"></i> Today
                        </button>
                        <select class="form-input" style="padding: 6px 12px; font-size: 12px; border-radius: 6px; min-width: 100px;" onchange="window.app.fsModule.changeGanttViewMode(this.value)">
                            ${viewModeOptions}
                        </select>
                         <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="window.drawer.open('Add Task', window.DrawerTemplates.updateTask)"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <div id="gantt-chart-container" style="overflow-x:auto; background: white; min-height: 400px; padding: 20px; border: 1px solid var(--slate-100); border-radius: 8px;">
                    <div id="gantt" style="position: relative; min-height: 350px;"></div>
                </div>
            </div>
        `;
    }

    renderGanttChart() {
        const now = new Date();
        const dateOffset = (days) => {
            const d = new Date();
            d.setDate(d.getDate() + days);
            return d.toISOString().split('T')[0];
        };
        
        const tasks = [
            { id: 'T1', name: 'Site Clearing', start: dateOffset(-5), end: dateOffset(-2), progress: 100, custom_class: 'gantt-item-done' },
            { id: 'T2', name: 'Excavation', start: dateOffset(-1), end: dateOffset(4), progress: 45, dependencies: 'T1', custom_class: 'gantt-item-active' }, 
            { id: 'T3', name: 'Foundation Pour', start: dateOffset(5), end: dateOffset(8), progress: 0, dependencies: 'T2', custom_class: 'gantt-item-locked' },
            { id: 'T4', name: 'Curing Period', start: dateOffset(9), end: dateOffset(14), progress: 0, dependencies: 'T3', custom_class: 'gantt-item-locked' },
            { id: 'T5', name: 'Backfilling', start: dateOffset(15), end: dateOffset(18), progress: 0, dependencies: 'T4', custom_class: 'gantt-item-locked' }
        ];

        try {
            const el = document.getElementById('gantt');
            if (!el) return;
            el.innerHTML = ''; 

            const GanttCls = window.Gantt || window.FrappeGantt;
            if (!GanttCls) {
                 el.innerHTML = '<div style="padding:20px;">Loading...</div>'; 
                 return; 
            }
            
            this.ganttInstance = new GanttCls("#gantt", tasks, {
                header_height: 50,
                column_width: 30,
                step: 24,
                view_modes: ['Day', 'Week', 'Month', 'Year'],
                bar_height: 25,
                bar_corner_radius: 4,
                arrow_curve: 5,
                padding: 18,
                view_mode: this.currentGanttViewMode,
                date_format: 'YYYY-MM-DD',
                custom_popup_html: function(task) {
                    let badgeHTML = '';
                    if (task.custom_class.includes('active')) {
                        badgeHTML = `<div style="background:#fefce8; color:#ca8a04; border:1px solid #fde047; padding:4px; font-size:10px; border-radius:4px; margin-bottom:8px; display:inline-block;">⚠️ Due in 2 Days</div>`;
                    }

                    return `
                        <div class="gantt-popup-card" style="padding: 12px; min-width: 200px; border-radius: 8px; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid var(--slate-200);">
                            ${badgeHTML}
                            <div style="font-weight:700; color:var(--slate-900); font-size:13px; margin-bottom:4px;">${task.name}</div>
                            <div style="font-size:11px; color:var(--slate-500); margin-bottom:8px;">${task.start} - ${task.end}</div>
                            ${task.custom_class.includes('active') ? 
                                `<div style="font-size:10px; color:var(--blue); font-weight:700; margin-top:8px;">Tap to Log Progress & Expenses <i class="fas fa-arrow-right"></i></div>` 
                                : ''}
                        </div>
                    `;
                },
                on_click: (task) => {
                    if (task.custom_class.includes('locked')) {
                        window.toast.show('This task is locked. Complete previous tasks first.', 'error');
                        return;
                    }
                    window.drawer.open('End of Day Log: ' + task.name, window.DrawerTemplates.dailyProgressLog);
                }
            });

        } catch (e) { console.error(e); }
    }

    getEquipmentView() {
        setTimeout(() => this.loadEquipmentFromAPI(), 0);
        
        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">On-Site Equipment</div>
                <button class="btn btn-primary" onclick="window.drawer.open('Request Equipment', window.DrawerTemplates.requestResourceFS)"><i class="fas fa-plus"></i> Request</button>
              </div>
              <div id="equipment-table-container">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400);">
                    <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                    <div>Loading equipment...</div>
                </div>
              </div>
            </div>
        `;
    }

    async loadEquipmentFromAPI() {
        const container = document.getElementById('equipment-table-container');
        if (!container) return;

        try {
            const token = localStorage.getItem('mcms_auth_token');
            const response = await fetch('/api/v1/assets', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to load equipment');

            const result = await response.json();
            const assets = result.data || result.items || result || [];

            if (assets.length === 0) {
                container.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400); text-align: center;">
                        <i class="fas fa-tools" style="font-size: 32px; margin-bottom: 12px;"></i>
                        <div style="font-weight: 600; color: var(--slate-600);">No equipment assigned</div>
                        <div style="font-size: 13px;">Request equipment to get started</div>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.renderEquipmentTable(assets);
        } catch (error) {
            console.error('Failed to load equipment:', error);
            container.innerHTML = `
                <div style="padding: 24px; text-align: center; color: var(--red);">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <div>Failed to load equipment: ${error.message}</div>
                    <button class="btn btn-secondary" style="margin-top: 16px;" onclick="window.app?.loadPage('equipment')">Retry</button>
                </div>
            `;
        }
    }

    renderEquipmentTable(assets) {
        const getStatusClass = (status) => {
            const map = { 'active': 'active', 'idle': '', 'in_transit': 'pending', 'maintenance': 'delayed' };
            return map[status?.toLowerCase()] || '';
        };
        const rows = assets.map(asset => `
            <tr>
                <td>${asset.name || asset.type}</td>
                <td>${asset.code || asset.id}</td>
                <td>${asset.operator?.name || asset.operatorName || '-'}</td>
                <td><span class="status ${getStatusClass(asset.status)}">${asset.status}</span></td>
                <td><button class="btn btn-secondary" style="padding:4px 8px; font-size:10px;">Log Usage</button></td>
            </tr>
        `).join('');

        return `
            <table>
                <thead><tr><th>Asset</th><th>ID</th><th>Operator</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    changeGanttViewMode(mode) {
        this.currentGanttViewMode = mode;
        if (this.ganttInstance) this.ganttInstance.change_view_mode(mode);
    }

    scrollToToday() {
        if (this.ganttInstance) this.ganttInstance.scroll_today ? this.ganttInstance.scroll_today() : this.renderGanttChart();
    }

    handleDailyLogSubmit(data) {
        if (data.expense) this.projectWallet.spent += parseInt(data.expense);
        window.toast.show('Daily Log Saved. Budget Updated.', 'success');
        this.render(); 
    }

    async handleRequestFunds() {
        // existing implementation
    }
}
