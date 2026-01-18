export class FieldSupervisorDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.projectWallet = { total: 5000000, spent: 4200000 };
        this.currentGanttViewMode = 'Day';
    }

    render() {
        let contentHTML = '';
        
        switch(this.currentView) {
            case 'dashboard': contentHTML = this.getDashboardView(); break;
            case 'tasks': contentHTML = this.getTasksView(); break;
            case 'gantt': contentHTML = this.getGanttView(); break;
            case 'equipment': contentHTML = this.getEquipmentView(); break;
            default: contentHTML = this.getDashboardView();
        }

        return `
            <div id="fs-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${contentHTML}
                </div>
            </div>
        `;
    }

    getHeaderHTML() {
        const titleMap = {
            'dashboard': 'Dashboard',
            'tasks': 'Daily Tasks',
            'gantt': 'Execution Schedule',
            'equipment': 'Site Equipment'
        };

        return `
            <div class="page-header">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div>
                    <h1 class="page-title">${titleMap[this.currentView] || 'Site Overview'}</h1>
                    <div class="context-strip">
                      <span>Sat, Jan 03</span>
                      <span style="color: var(--slate-400);">•</span>
                      <span><i class="fas fa-cloud-sun"></i> 28°C Sunny</span>
                      <span style="color: var(--slate-400);">•</span>
                      <span style="color: var(--emerald); font-weight: 600;">14 Workers Present</span>
                    </div>
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
               <div class="stat-card" style="border-color: var(--orange-light); background: #fffbf7; cursor: pointer;" onclick="window.drawer.open('Daily Site Report', window.DrawerTemplates.dailyReport)">
                  <div class="stat-header"><span class="stat-label" style="color: var(--orange);">Daily Log</span><i class="fas fa-plus-circle" style="color: var(--orange);"></i></div>
                  <div class="stat-value" style="font-size: 18px; color: var(--orange);">Submit Report</div>
                  <div class="stat-sub">Geotagging Active</div>
               </div>
               <div class="stat-card" style="cursor: pointer;" onclick="window.drawer.open('Worker Attendance', window.DrawerTemplates.attendanceLog)">
                  <div class="stat-header"><span class="stat-label">Workforce</span><i class="fas fa-users" style="color: var(--blue);"></i></div>
                  <div class="stat-value">14</div>
                  <div class="stat-sub">12 Gen / 2 Skilled</div>
               </div>
               <div class="stat-card" style="cursor: pointer;" onclick="window.drawer.open('Report Incident', window.DrawerTemplates.incidentReport)">
                  <div class="stat-header"><span class="stat-label">Incidents</span><i class="fas fa-triangle-exclamation" style="color: var(--emerald);"></i></div>
                  <div class="stat-value">0</div>
                  <div class="stat-sub" style="color: var(--emerald);">Safe Day</div>
               </div>
            </div>
        `;
    }

    getDataCardHTML() {
        return `
            <div class="data-card">
               <div class="data-card-header">
                  <div class="card-title">Today's Activity Log</div>
               </div>
               <table>
                  <thead>
                     <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Detail</th>
                        <th>GPS</th>
                        <th>Status</th>
                     </tr>
                  </thead>
                  <tbody>
                     <tr>
                        <td style="color: var(--slate-500);">12:15</td>
                        <td style="font-weight: 600;"><i class="fas fa-camera" style="color: var(--blue); margin-right: 6px;"></i> Progress</td>
                        <td>Foundation Trench (15m)</td>
                        <td><span class="gps-badge" style="display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.1); color: var(--emerald); padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.2); font-size: 9px; padding: 2px 4px;">-13.98, 33.78</span></td>
                        <td><span class="status active" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; background: #DCFCE7; color: #166534;">Synced</span></td>
                     </tr>
                  </tbody>
               </table>
            </div>
        `;
    }

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



    // ... (render and getHeaderHTML remain same)

    // --- 2. GANTT SCHEDULE ---
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
        
        // Define Tasks with explicit States
        // Logic: T2 is Active (Pulsing). T1 is Done. T3 is Locked.
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
                    // Logic to show "Due in X Days" badge
                    const isDueSoon = true; // Mocked for T2
                    
                    let badgeHTML = '';
                    if (task.custom_class.includes('active')) {
                        badgeHTML = `<div style="background:#fefce8; color:#ca8a04; border:1px solid #fde047; padding:4px; font-size:10px; border-radius:4px; margin-bottom:8px; display:inline-block;">⚠️ Due in 2 Days</div>`;
                    }

                    return `
                        <div class="gantt-popup-card" style="padding: 12px; min-width: 200px; border-radius: 8px; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid var(--slate-200);">
                            ${badgeHTML}
                            <div style="font-weight:700; color:var(--slate-900); font-size:13px; margin-bottom:4px;">${task.name}</div>
                            <div style="font-size:11px; color:var(--slate-500); margin-bottom:8px;">${task.start} - ${task.end}</div>
                            
                            <!-- Financial Context in Popup -->
                            ${task.custom_class.includes('active') ? 
                                `<div style="font-size:10px; color:var(--blue); font-weight:700; margin-top:8px;">Tap to Log Progress & Expenses <i class="fas fa-arrow-right"></i></div>` 
                                : ''}
                             ${task.custom_class.includes('locked') ? 
                                `<div style="font-size:10px; color:var(--slate-400); font-weight:600; margin-top:8px;"><i class="fas fa-lock"></i> Locked until previous task done</div>` 
                                : ''}
                        </div>
                    `;
                },
                on_click: (task) => {
                    if (task.custom_class.includes('locked')) {
                        window.toast.show('This task is locked. Complete previous tasks first.', 'error');
                        return;
                    }
                    if (task.custom_class.includes('done')) {
                        window.toast.show('This task is already completed.', 'info');
                        return;
                    }
                    // Open the Advanced Financial Drawer for Active Task
                    window.drawer.open('End of Day Log: ' + task.name, window.DrawerTemplates.dailyProgressLog);
                }
            });

        } catch (e) { console.error(e); }
    }

    changeGanttViewMode(mode) {
        this.currentGanttViewMode = mode;
        if (this.ganttInstance) {
            this.ganttInstance.change_view_mode(mode);
        }
    }

    scrollToToday() {
        if (this.ganttInstance) {
            if (typeof this.ganttInstance.scroll_today === 'function') {
                this.ganttInstance.scroll_today();
            } else {
                this.renderGanttChart();
            }
        }
    }

    handleDailyLogSubmit(data) {
        // 1. Finance Logic
        if (data.expense) {
            this.projectWallet.spent += parseInt(data.expense);
            console.log(`Expense Logged: MWK ${data.expense} | Category: ${data.category || 'N/A'} | Reason: ${data.details || 'N/A'}`);
        }

        // 2. SOS Logic
        if (data.sos) {
            window.toast.show('URGENT: Fund Request & Alert sent to Finance Director.', 'warning');
            // In real app, this would create a notification record
        } else {
             window.toast.show('Daily Log Saved. Budget Updated.', 'success');
        }

        // 3. Update UI (Re-render to show new budget health)
        this.render(); 
    }

    getEquipmentView() {
         return `
            <div class="data-card">
              <div class="data-card-header"><div class="card-title">On-Site Equipment</div></div>
              <table>
                <thead><tr><th>Asset</th><th>ID</th><th>Operator</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    <tr>
                        <td>Excavator CAT 320</td>
                        <td>EQ-001</td>
                        <td>J. Phiri</td>
                        <td><span class="status active">Active</span></td>
                        <td>
                             <button class="btn btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="window.drawer.open('Log Usage', window.DrawerTemplates.logEquipmentUsage)">Log Usage</button>
                             <button class="btn btn-secondary" style="padding:4px 8px; font-size:10px; color:var(--orange); border-color:var(--orange-light);" onclick="window.drawer.open('Return Asset', window.DrawerTemplates.returnEquipment)">Return</button>
                        </td>
                    </tr>
                    <tr>
                        <td>Concrete Mixer</td>
                        <td>EQ-012</td>
                        <td>-</td>
                        <td><span class="status">Idle</span></td>
                        <td>
                            <button class="btn btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="window.drawer.open('Assign Operator', window.DrawerTemplates.assignEquipment)">Assign</button>
                        </td>
                    </tr>
                     <tr>
                        <td>Generator 50kVA</td>
                        <td>EQ-088</td>
                        <td>-</td>
                        <td><span class="status pending">In Transit</span></td>
                        <td>
                            <button class="btn btn-primary" style="padding:4px 8px; font-size:10px;" onclick="window.drawer.open('Confirm Arrival', window.DrawerTemplates.confirmArrival)">Confirm Arrival</button>
                        </td>
                    </tr>
                </tbody>
              </table>
            </div>
        `;
    }
}
