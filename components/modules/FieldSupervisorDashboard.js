export class FieldSupervisorDashboard {
    constructor() {
        this.currentView = 'dashboard';
    }

    render() {
        let contentHTML = '';
        
        switch(this.currentView) {
            case 'dashboard': contentHTML = this.getDashboardView(); break;
            case 'tasks': contentHTML = this.getTasksView(); break;
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
               <div class="stat-card" style="cursor: pointer;" onclick="window.drawer.open('Material Log', window.DrawerTemplates.materialLog)">
                  <div class="stat-header"><span class="stat-label">Materials</span><i class="fas fa-cubes" style="color: var(--emerald);"></i></div>
                  <div class="stat-value">15 Bags</div>
                  <div class="stat-sub">Cement Delivered</div>
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
                        <td style="color: var(--slate-500);">14:30</td>
                        <td style="font-weight: 600;"><i class="fas fa-truck" style="color: var(--emerald); margin-right: 6px;"></i> Delivery</td>
                        <td>15 Bags Cement</td>
                        <td><span class="gps-badge" style="display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.1); color: var(--emerald); padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.2); font-size: 9px; padding: 2px 4px;">-13.98, 33.78</span></td>
                        <td><span class="status active" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; background: #DCFCE7; color: #166534;">Synced</span></td>
                     </tr>
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
                    <tr><td>Excavate Trench A</td><td>Today, 16:00</td><td><span class="status pending">In Progress</span></td><td><button class="btn btn-secondary">Update</button></td></tr>
                    <tr><td>Compact Soil</td><td>Tomorrow</td><td><span class="status">Scheduled</span></td><td></td></tr>
                </tbody>
              </table>
            </div>
        `;
    }

    getEquipmentView() {
         return `
            <div class="data-card">
              <div class="data-card-header"><div class="card-title">On-Site Equipment</div></div>
              <table>
                <thead><tr><th>Asset</th><th>ID</th><th>Operator</th><th>Status</th></tr></thead>
                <tbody>
                    <tr><td>Excavator CAT 320</td><td>EQ-001</td><td>J. Phir</td><td><span class="status active">Active</span></td></tr>
                    <tr><td>Concrete Mixer</td><td>EQ-012</td><td>-</td><td><span class="status">Idle</span></td></tr>
                </tbody>
              </table>
            </div>
        `;
    }
}
