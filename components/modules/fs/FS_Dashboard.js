import client from '../../../src/api/client.js';
import tasksApi from '../../../src/api/tasks.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import assets from '../../../src/api/assets.api.js';

export const FS_Dashboard = {
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
    },

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
    },

    async _loadAssignedProject() {
        try {
            const result = await client.get('/projects');
            const projects = Array.isArray(result) ? result : (result.data || []);
            // Get the first project assigned to this supervisor
            this.assignedProject = projects[0] || null;
        } catch (error) {
            console.error('[FS] Failed to load assigned project:', error);
        }
    },

    viewLogHistory() {
        window.drawer.open('Log History', window.DrawerTemplates.dailyProgressLogHistory());
    },

    async loadHistoricalLog(date) {
        const container = document.getElementById('history-content-area');
        if (!container) return;

        container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--slate-500);"><i class="fas fa-spinner fa-spin"></i> Fetching log...</div>';

        try {
            const logs = await client.get('/daily-logs', {
                projectId: this.assignedProject?.id,
                startDate: date,
                endDate: date
            });
            
            const logArray = Array.isArray(logs) ? logs : (logs.data || []);
            const log = logArray[0];

            if (!log) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: var(--slate-400);">
                        <i class="fas fa-search" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
                        <div>No log found for ${new Date(date).toLocaleDateString()}</div>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div style="background: var(--slate-50); padding: 16px; border-radius: 12px; border: 1px solid var(--slate-200);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Status</span>
                        <span class="badge ${log.status === 'approved' ? 'badge-success' : log.status === 'rejected' ? 'badge-danger' : 'badge-warning'}">${log.status.toUpperCase()}</span>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Narrative</div>
                        <div style="font-size: 13px; color: var(--slate-900); margin-top: 4px;">${log.narrative || 'No narrative provided'}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Headcount</div>
                            <div style="font-size: 14px; font-weight: 700;">${log.headcount || 0} Men</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Weather</div>
                            <div style="font-size: 14px; font-weight: 700;">${log.weather || 'Unknown'}</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('[FS] Failed to load historical log:', error);
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--red);">Error loading log details.</div>';
        }
    },

    async viewRejectedLogs() {
        try {
            const logs = await client.get('/daily-logs', {
                projectId: this.assignedProject?.id,
                status: 'rejected'
            });
            const logArray = Array.isArray(logs) ? logs : (logs.data || []);
            
            let content = `
                <div class="drawer-section" style="padding-top: 12px;">
                    <h3 style="margin: 0 0 20px; font-size: 16px; font-weight: 800;">Rejected Reviews</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
            `;

            if (logArray.length === 0) {
                content += `
                    <div style="text-align: center; padding: 40px 20px; color: var(--slate-400);">
                        <i class="fas fa-check-double" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
                        <div>No rejected logs found. You are all caught up!</div>
                    </div>
                `;
            } else {
                logArray.forEach(log => {
                    content += `
                        <div style="background: white; border: 1px solid var(--red-light); padding: 16px; border-radius: 12px; box-shadow: var(--shadow-sm);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="font-weight: 700; font-size: 13px;">${new Date(log.logDate).toLocaleDateString()}</span>
                                <span class="badge badge-danger">REJECTED</span>
                            </div>
                            <div style="font-size: 12px; color: var(--red); background: #FEF2F2; padding: 8px; border-radius: 6px; margin-bottom: 12px;">
                                <strong>Reason:</strong> ${log.rejectionReason || 'No reason specified'}
                            </div>
                            <button class="btn btn-secondary" style="width: 100%; justify-content: center; font-size: 12px; padding: 8px;" onclick="window.drawer.open('Daily Progress', window.DrawerTemplates.dailyProgressLog())">
                                <i class="fas fa-edit"></i> Edit & Resubmit
                            </button>
                        </div>
                    `;
                });
            }

            content += `
                    </div>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 24px;" onclick="window.drawer.close()">Close</button>
                </div>
            `;

            window.drawer.open('Rejected Reviews', content);
        } catch (error) {
            console.error('[FS] Failed to load rejected logs:', error);
            window.toast.show('Failed to load rejected logs', 'error');
        }
    }
};
