import client from '../../../src/api/client.js';
import tasksApi from '../../../src/api/tasks.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import assets from '../../../src/api/assets.api.js';

export const FS_Tasks = {
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
,

    async _loadTasks() {
        const container = document.getElementById('fs-tasks-container');
        if (!container) return;

        try {
            const projectId = this.assignedProject?.id || 1;
            console.log('[FS] Loading tasks for project:', projectId);
            const result = await tasksApi.getByProject(projectId);
            console.log('[FS] Tasks API result:', result);
            const data = result.data || result;
            const taskList = Array.isArray(data) ? data : (data.tasks || []);
            console.log('[FS] Task list:', taskList);
            
            if (taskList.length > 0) {
                console.log('[FS] First task sample:', taskList[0]);
            }

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
,

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
,

    async renderGanttChart() {
        try {
            const el = document.getElementById('gantt');
            if (!el) return;

            const projectId = this.assignedProject?.id || 1;
            console.log('[FS Gantt] Fetching tasks for project:', projectId);
            const response = await tasksApi.getByProject(projectId);
            console.log('[FS Gantt] Response received:', response);
            const data = response.data || response;
            const tasksList = Array.isArray(data) ? data : (data.tasks || []);
            console.log('[FS Gantt] Task count:', tasksList.length);

            if (tasksList.length === 0) {
                el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--slate-400);">No tasks scheduled yet.</div>';
                return;
            }

            const mappedTasks = tasksList.map(task => {
                try {
                    return {
                        id: task.id.toString(),
                        name: task.name,
                        // Frappe Gantt expects YYYY-MM-DD format
                        start: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        end: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        progress: task.progress || 0,
                        dependencies: task.dependencyId ? task.dependencyId.toString() : ''
                    };
                } catch (err) {
                    console.error('[FS Gantt] Error mapping task:', task, err);
                    return null;
                }
            }).filter(t => t !== null);

            console.log('[FS Gantt] Mapped tasks:', mappedTasks);

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
,

    changeGanttViewMode(mode) {
        this.currentGanttViewMode = mode;
        if (this.ganttInstance) this.ganttInstance.change_view_mode(mode);
    }
,

    scrollToToday() {
        if (this.ganttInstance?.scroll_today) this.ganttInstance.scroll_today();
    }
,

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
                if (payloadOverride.taskId) payload.task_id = parseInt(payloadOverride.taskId);
                if (payloadOverride.progressIncrement) payload.progressIncrement = parseInt(payloadOverride.progressIncrement);
                if (payloadOverride.expenseItems) payload.expenseItems = payloadOverride.expenseItems;
                if (payloadOverride.sos) payload.isSos = true;
                
                // Active Sync Metadata
                if (payloadOverride.phaseId) {
                    const phase = this.taskConfig?.phases?.find(p => p.id === payloadOverride.phaseId);
                    payload.activePhase = phase ? phase.name : payloadOverride.phaseId;
                }
                if (payloadOverride.taskName) payload.activeTask = payloadOverride.taskName;
            }

            // --- HARDENING: Attach Evidence Photos ---
            const gallery = window.photoGalleries['dailyLog'] || [];
            payload.photos = gallery.map(p => ({
                dataUrl: p.dataUrl,
                location: p.location,
                timestamp: p.timestamp,
                name: p.name
            }));

            // --- ADDED: Extract Machine Usage ---
            const machineRows = document.querySelectorAll('.machine-usage-row');
            if (machineRows.length > 0) {
                payload.assetUsage = Array.from(machineRows).map(row => {
                    return {
                        assetId: parseInt(row.querySelector('.machine-select').value) || 0,
                        hoursUsed: parseFloat(row.querySelector('.machine-hours').value) || 0,
                        fuelConsumed: parseFloat(row.querySelector('.machine-fuel').value) || 0,
                        operator: row.querySelector('.machine-operator').value || ''
                    };
                }).filter(a => a.assetId > 0);
            }

            await dailyLogs.create(payload);
            
            // Clear gallery on success
            window.photoGalleries['dailyLog'] = [];
            if (typeof window.renderPhotoGallery === 'function') window.renderPhotoGallery('dailyLog');
            
            console.log('[FS] Daily progress logged successfully');
            window.drawer.close();
            this._loadDashboardStats(); // Refresh stats 
        } catch (error) {
            console.error('Log submission error:', error);
            let errorMsg = error.response?.data?.message || error.message || 'Failed to submit log';
            errorMsg = errorMsg.replace('ValidationError: ', '').replace('AppError: ', '');
            
            if (window.toast) {
                window.toast.show(errorMsg, 'error');
            } else {
                alert(errorMsg);
            }
        }
    },

    submitDailyProgressLog(btn) {
        if (window.validatePhotos && !window.validatePhotos('progressLog')) return;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying site coordinates...';
        btn.disabled = true;

        this.handleDailyLogSubmit({
            taskId: document.getElementById('daily-log-task-id')?.value,
            progressIncrement: document.getElementById('daily-progress-increment')?.value,
            narrative: document.getElementById('daily-narrative')?.value,
            phaseId: document.getElementById('log-project-phase')?.value,
            taskName: document.getElementById('log-project-task')?.value,
            sos: document.getElementById('sos-flag')?.checked
        }).finally(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    },

    addMachineUsageRow() {
        const container = document.getElementById('machine-usage-rows');
        if (!container) return;
        
        if (container.querySelector('div[style*="text-align: center"]')) {
            container.innerHTML = ''; // clear empty state
        }
        
        const row = document.createElement('div');
        row.className = 'machine-usage-row';
        row.style.cssText = 'background: white; border: 1px solid var(--slate-200); padding: 12px; border-radius: 6px; position: relative;';
        
        const siteAssets = this.siteAssets || [];
        const options = siteAssets.map(a => `<option value="${a.id}">${a.name} (${a.assetCode || a.id})</option>`).join('');

        row.innerHTML = `
            <i class="fas fa-times" style="position: absolute; top: 12px; right: 12px; color: var(--red); cursor: pointer;" onclick="this.parentElement.remove()"></i>
            <div style="margin-bottom: 8px;">
                <label style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Machine</label>
                <select class="form-input machine-select" style="padding: 6px; font-size: 12px; height: 30px;">
                    <option value="">Select equipment...</option>
                    ${options}
                </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                <div>
                    <label style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Hours Used</label>
                    <input type="number" class="form-input machine-hours" placeholder="e.g. 8" style="padding: 6px; font-size: 12px; height: 30px;">
                </div>
                <div>
                    <label style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Fuel (L)</label>
                    <input type="number" class="form-input machine-fuel" placeholder="e.g. 45" style="padding: 6px; font-size: 12px; height: 30px;">
                </div>
            </div>
            <div>
                <label style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Operator / Driver</label>
                <input type="text" class="form-input machine-operator" placeholder="Name..." style="padding: 6px; font-size: 12px; height: 30px;">
            </div>
        `;
        container.appendChild(row);
    },

    async initializePhaseDropdown() {
        const phaseSelect = document.getElementById('log-project-phase');
        if (!phaseSelect) return;

        try {
            console.log('[FS] Synchronizing project phases...');
            const config = await client.get('/tasks/config');
            this.taskConfig = config.data || config;
            
            phaseSelect.innerHTML = '<option value="">Select Phase...</option>';
            this.taskConfig.phases.forEach(phase => {
                const opt = document.createElement('option');
                opt.value = phase.id;
                opt.innerText = phase.name;
                phaseSelect.appendChild(opt);
            });
        } catch (error) {
            console.error('Failed to load tasks config:', error);
            phaseSelect.innerHTML = '<option value="">Error loading config</option>';
        }
    },

    handlePhaseChange(phaseId) {
        const taskSelect = document.getElementById('log-project-task');
        if (!taskSelect) return;

        if (!phaseId) {
            taskSelect.innerHTML = '<option value="">Select phase first...</option>';
            return;
        }

        const phase = this.taskConfig.phases.find(p => p.id === phaseId);
        if (phase) {
            taskSelect.innerHTML = '<option value="">Select Task...</option>';
            phase.tasks.forEach(task => {
                const opt = document.createElement('option');
                opt.value = task;
                opt.innerText = task;
                taskSelect.appendChild(opt);
            });
        }
    }
};
