import client from '../../../src/api/client.js';
import tasksApi from '../../../src/api/tasks.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import assets from '../../../src/api/assets.api.js';

const escapeHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[m]);
};

export const FS_Tasks = {
    getTasksView() {
        // Reset flags if switching back to tasks to ensure a fresh load if it failed before
        if (this.currentView === 'tasks') {
            setTimeout(() => this._loadTasks(), 50);
        }
        
        return `
            <div class="data-card">
              <div class="data-card-header"><div class="card-title">Assigned Tasks</div></div>
              <div id="fs-tasks-container">
                <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                    <i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i>
                    <div>Loading tasks…</div>
                </div>
              </div>
            </div>
        `;
    }
,

    async _loadTasks(retryCount = 0) {
        const container = document.getElementById('fs-tasks-container');
        if (!container) {
            if (retryCount < 10) {
                setTimeout(() => this._loadTasks(retryCount + 1), 100);
            }
            return;
        }

        try {
            if (!this.cachedTasks) {
                const projectId = this.assignedProject?.id || 1;
                console.log('[FS] Loading tasks for project:', projectId);
                const result = await tasksApi.getByProject(projectId);
                const data = result.data || result;
                this.cachedTasks = Array.isArray(data) ? data : (data.tasks || []);
            }
            
            const taskList = this.cachedTasks;
            
            if (taskList.length === 0) {
                container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--slate-400);">No tasks assigned yet.</div>';
                return;
            }

            // Pagination Logic
            this.tasksPage = this.tasksPage || 1;
            const perPage = 10;
            const totalPages = Math.ceil(taskList.length / perPage);
            const startIdx = (this.tasksPage - 1) * perPage;
            const paginatedTasks = taskList.slice(startIdx, startIdx + perPage);

            let tableHTML = `
                <table>
                    <thead><tr><th>Task</th><th>Phase</th><th>Start</th><th>End</th><th>Progress</th><th>Action</th></tr></thead>
                    <tbody>
                        ${paginatedTasks.map(t => `
                            <tr>
                                <td style="font-weight: 700;">${t.name}</td>
                                <td style="font-size: 11px; color: var(--slate-500);">Phase ${t.phaseNumber || t.phaseId || '--'}</td>
                                <td>${t.startDate ? new Date(t.startDate).toLocaleDateString() : '--'}</td>
                                <td>${t.endDate ? new Date(t.endDate).toLocaleDateString() : '--'}</td>
                                <td>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <div style="flex:1; height:6px; background:var(--slate-100); border-radius:3px;"><div style="width:${t.progress || 0}%; height:100%; background:var(--orange); border-radius:3px;"></div></div>
                                        <span style="font-size:11px; font-weight:700;">${t.progress || 0}%</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" onclick="window.app.fsModule.openScheduleDrawer('${t.id}')">
                                        <i class="fas fa-calendar-alt"></i> View Schedule
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            // Pagination Controls
            if (totalPages > 1) {
                tableHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid var(--slate-200); background: var(--slate-50); border-radius: 0 0 8px 8px;">
                        <span style="font-size: 12px; color: var(--slate-500);">Page ${this.tasksPage} of ${totalPages}</span>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary btn-sm" onclick="window.app.fsModule.changeTasksPage(${this.tasksPage - 1})" ${this.tasksPage === 1 ? 'disabled' : ''}>Previous</button>
                            <button class="btn btn-secondary btn-sm" onclick="window.app.fsModule.changeTasksPage(${this.tasksPage + 1})" ${this.tasksPage === totalPages ? 'disabled' : ''}>Next</button>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = tableHTML;
        } catch (error) {
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">Failed to load tasks: ${error.message}</div>`;
        }
    },

    changeTasksPage(page) {
        this.tasksPage = page;
        this._loadTasks();
    },

    openScheduleDrawer(taskId) {
        const task = this.cachedTasks?.find(t => String(t.id) === String(taskId));
        if (!task) return;

        window.drawer.open('Schedule & Progress', `
            <div style="padding: 24px;">
                <div style="margin-bottom: 24px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: var(--slate-900); line-height: 1.2;">${task.name}</h3>
                    <div style="font-size: 13px; color: var(--slate-500); margin-top: 6px; font-weight: 500;">Phase ${task.phaseNumber || task.phaseId || '--'}</div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
                    <div style="padding: 14px; background: var(--slate-50); border-radius: 10px; border: 1px solid var(--slate-100);">
                        <div style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.5px;">Start Date</div>
                        <div style="font-size: 14px; font-weight: 700; color: var(--slate-700); margin-top: 6px;">
                            ${task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Pending'}
                        </div>
                    </div>
                    <div style="padding: 14px; background: var(--slate-50); border-radius: 10px; border: 1px solid var(--slate-100);">
                        <div style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.5px;">End Date</div>
                        <div style="font-size: 14px; font-weight: 700; color: var(--slate-700); margin-top: 6px;">
                            ${task.endDate ? new Date(task.endDate).toLocaleDateString() : 'Pending'}
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 40px; padding: 20px; background: var(--white); border: 1px solid var(--slate-200); border-radius: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
                        <span style="font-size: 13px; font-weight: 700; color: var(--slate-600);">Current Progress</span>
                        <span style="font-size: 16px; font-weight: 800; color: var(--orange);">${task.progress || 0}%</span>
                    </div>
                    <div style="width: 100%; height: 10px; background: var(--slate-100); border-radius: 5px; overflow: hidden; border: 1px solid var(--slate-200);">
                        <div style="width: ${task.progress || 0}%; height: 100%; background: var(--orange); border-radius: 5px;"></div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn btn-primary" style="width: 100%; justify-content: center; height: 44px; border-radius: 8px;" onclick="window.drawer.close()">
                        Return to Tasks
                    </button>
                    <p style="text-align: center; font-size: 11px; color: var(--slate-400); margin: 0;">Progress updates are logged in Daily Reports.</p>
                </div>
            </div>
        `);
    }
,

    getGanttView() {
        if (!this._fetchingGantt && !this.ganttLoaded) {
            this._fetchingGantt = true;
            setTimeout(() => {
                this.renderGanttChart().finally(() => { 
                    this._fetchingGantt = false; 
                    this.ganttLoaded = true;
                });
            }, 100);
        } else if (this.ganttLoaded && this.cachedMappedGanttTasks) {
            // Instantly restore Gantt if already cached
            setTimeout(() => {
                this._restoreGanttFromCache();
            }, 50);
        }

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

            // Only fetch if not cached
            if (!this.cachedMappedGanttTasks) {
                const projectId = this.assignedProject?.id || 1;
                console.log('[FS Gantt] Fetching tasks for project:', projectId);
                const response = await tasksApi.getByProject(projectId);
                const data = response.data || response;
                const tasksList = Array.isArray(data) ? data : (data.tasks || []);

                if (tasksList.length === 0) {
                    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--slate-400);">No tasks scheduled yet.</div>';
                    return;
                }

                this.cachedMappedGanttTasks = tasksList.map(task => {
                    try {
                        return {
                            id: task.id.toString(),
                            name: task.name,
                            start: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            end: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            progress: task.progress || 0,
                            dependencies: task.dependencyId ? task.dependencyId.toString() : ''
                        };
                    } catch (err) {
                        return null;
                    }
                }).filter(t => t !== null);
            }

            this._restoreGanttFromCache();

        } catch (e) {
            console.error('[FS Gantt] Error:', e);
            const el = document.getElementById('gantt');
            if (el) el.innerHTML = `<div style="padding:20px; color:var(--red);">Gantt Error: ${e.message}</div>`;
        }
    },

    _restoreGanttFromCache() {
        const el = document.getElementById('gantt');
        if (!el || !this.cachedMappedGanttTasks) return;

        el.innerHTML = '';

        const GanttCls = window.Gantt || window.FrappeGantt;
        if (!GanttCls) {
            el.innerHTML = '<div style="padding:20px; text-align:center; color:var(--slate-400);">Gantt library loading…</div>';
            return;
        }

        // Avoid creating multiple instances if one is still bound
        this.ganttInstance = new GanttCls("#gantt", this.cachedMappedGanttTasks, {
            header_height: 50,
            column_width: 30,
            bar_height: 25,
            bar_corner_radius: 4,
            view_mode: this.currentGanttViewMode || 'Day',
            date_format: 'YYYY-MM-DD',
            on_click: (task) => {
                window.app.fsModule.openScheduleDrawer(task.id); // Updated click action
            }
        });
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
            console.log('[FS] Initiating secure site log submission...');
            
            // 1. Get Location (Prefer cached bestPosition from dashboard sync)
            let pos = this.bestPosition;
            
            // 2. Fallback: If no sync, try one-shot (less accurate but required for flow)
            if (!pos && navigator.geolocation) {
                console.log('[FS] No cached sync found. Attempting quick location capture...');
                pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 30000 // allow 30s old cache for speed
                    });
                });
            }

            if (!pos) {
                throw new Error('Location verification required. Please click "Sync Location" on the dashboard first.');
            }

            const { latitude, longitude, accuracy } = pos.coords;
            const capturedAt = pos.timestamp || Date.now();

            // 3. Temporal Validation (Anti-Spoofing)
            const ageMs = Date.now() - capturedAt;
            if (ageMs > 120000) { // 2 minutes
                throw new Error('Location data is too old. Please re-sync your location on the dashboard.');
            }

            // 4. Adaptive Thresholds & Geofence Logic
            const project = this.assignedProject;
            if (!project) throw new Error('Project context missing.');

            const distToSite = this.calculateDistance(latitude, longitude, parseFloat(project.lat), parseFloat(project.lng));
            const effectiveDist = distToSite - accuracy; // User's possible closest point to site
            
            // Desktop Leniency: Add a 250m "Hardware Buffer" for PC users who lack GPS
            const isDesktop = !/Android|iPhone|iPad/i.test(navigator.userAgent);
            const hardwareBuffer = isDesktop ? 250 : 0;
            const allowedRadius = (project.radius || 500) + hardwareBuffer;

            console.log(`[FS GPS] Device: ${isDesktop ? 'Desktop' : 'Mobile'}, Distance: ${Math.round(distToSite)}m, Accuracy: ±${Math.round(accuracy)}m, Effective: ${Math.round(effectiveDist)}m, Allowed: ${allowedRadius}m`);

            // Policy Rejection
            if (accuracy > 500) {
                throw new Error('Likely IP-based location detected. Please enable Wi-Fi or move near a window to improve precision (±500m required).');
            }

            let outsideFence = false;
            let overage = 0;
            if (effectiveDist > allowedRadius) {
                outsideFence = true;
                overage = Math.round(effectiveDist - allowedRadius);
                console.warn(`[FS GPS] Submission outside geofence: ${overage}m overage.`);
            }

            // 5. Build Payload with Metadata
            const progressValue = payloadOverride?.progressCompletion || payloadOverride?.progressIncrement || document.getElementById('daily-progress-completion')?.value || 0;
            const payload = {
                projectId: project.id,
                logDate: new Date().toISOString().split('T')[0],
                narrative: payloadOverride?.narrative || document.getElementById('daily-narrative')?.value || 'Daily Progress',
                status: 'submitted',
                progressCompletion: parseInt(progressValue),
                phaseId: payloadOverride?.phaseId || document.getElementById('daily-log-phase-id')?.value || null,
                
                // Location Metadata
                submissionLat: latitude,
                submissionLng: longitude,
                submissionAccuracy: Math.round(accuracy),
                locationSource: accuracy < 75 ? 'GPS/WiFi' : 'Triangulated',
                deviceType: isDesktop ? 'desktop' : 'mobile',
                locationCapturedAt: new Date(capturedAt).toISOString(),
                locationFlagged: outsideFence || accuracy > 150
            };

            // Materials consumed
            if (payloadOverride?.materialsConsumed) {
                payload.materialsConsumed = payloadOverride.materialsConsumed;
            }

            // ... (rest of payload logic)
            if (payloadOverride) {
                if (payloadOverride.taskId) payload.task_id = parseInt(payloadOverride.taskId);
                if (payloadOverride.expenseItems) payload.expenseItems = payloadOverride.expenseItems;
                if (payloadOverride.sos) payload.isSos = true;
            }

            // --- HARDENING: Attach Evidence Photos ---
            const gallery = window.photoGalleries['dailyLog'] || [];
            payload.photos = gallery.map(p => ({
                dataUrl: p.dataUrl,
                location: p.location,
                timestamp: p.timestamp,
                name: p.name
            }));

            // --- Extract Machine Usage ---
            if (payloadOverride?.assetUsage && payloadOverride.assetUsage.length > 0) {
                payload.assetUsages = payloadOverride.assetUsage.map(a => ({
                    assetId: a.assetId,
                    hoursOperated: a.hoursUsed,
                    operatorName: a.operator,
                    roleInPhase: payload.phaseId
                }));
            } else {
                const machineRows = document.querySelectorAll('.machine-usage-row');
                if (machineRows.length > 0) {
                    payload.assetUsages = Array.from(machineRows).map(row => {
                        return {
                            assetId: parseInt(row.querySelector('.machine-select').value) || 0,
                            hoursOperated: parseFloat(row.querySelector('.machine-hours').value) || 0,
                            operatorName: row.querySelector('.machine-operator').value || '',
                            roleInPhase: payload.phaseId
                        };
                    }).filter(a => a.assetId > 0);
                }
            }

            const response = await dailyLogs.create(payload);
            
            // 6. Post-Submission: Audit Logs
            const currentUser = window.app.currentUser || { name: 'Field Supervisor' };
            
            // Audit Log: Progress Submission
            await client.post('/audit-logs', {
                action: 'DAILY_LOG_SUBMITTED',
                userId: currentUser.id,
                details: `Progress Report: ${payload.progressCompletion}% complete. Narrative: ${payload.narrative.substring(0, 50)}...`,
                severity: 'INFO',
                projectId: project.id
            });

            // Audit Log: Geofence Violation (if applicable)
            if (outsideFence) {
                await client.post('/audit-logs', {
                    action: 'GEOFENCE_VIOLATION',
                    userId: currentUser.id,
                    details: `Daily Log submitted from outside work zone. Distance: ${Math.round(distToSite)}m (Overage: ${overage}m). Lat: ${latitude}, Lng: ${longitude}`,
                    severity: 'WARNING',
                    projectId: project.id
                });
            }

            // Clear gallery on success
            window.photoGalleries['dailyLog'] = [];
            if (typeof window.renderPhotoGallery === 'function') window.renderPhotoGallery('dailyLog');
            
            window.toast?.show(`Daily log submitted successfully ${outsideFence ? '(Flagged: Outside Geofence)' : ''}`, outsideFence ? 'warning' : 'success');
            window.drawer.close();
            this._loadDashboardStats(); 
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

    openDailyLogDrawer() {
        if (!this.assignedProject) {
            window.toast?.show('Project data still loading. Please wait.', 'warning');
            return;
        }
        // Load tasks config for phase info
        const tasksConfig = this.taskConfig || { phases: [] };
        
        window.drawer.open('Daily Progress', window.DrawerTemplates.dailyProgressLog({
            project: this.assignedProject,
            inventory: this.siteInventory || {},
            siteAssets: this.siteAssets || [],
            tasksConfig: tasksConfig
        }));

        // Initialize phase dropdown if needed
        if (!this.taskConfig) {
            this.initializePhaseDropdown();
        }
    },

    submitDailyProgressLog(btn) {
        // Validate narrative
        const narrative = document.getElementById('daily-narrative')?.value;
        if (!narrative || narrative.trim().length < 10) {
            window.toast?.show('Please write a detailed narrative (at least 10 characters).', 'warning');
            return;
        }

        // Validate photos
        if (window.validatePhotos && !window.validatePhotos('dailyLog')) return;

        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying site coordinates...';
        btn.disabled = true;

        // Collect materials consumed
        const materialRows = document.querySelectorAll('.material-usage-row');
        const materialsConsumed = Array.from(materialRows).map(row => {
            return {
                materialName: row.querySelector('.material-select')?.value || '',
                quantity: parseFloat(row.querySelector('.material-qty')?.value) || 0
            };
        }).filter(m => m.materialName && m.quantity > 0);

        // Collect machine usage
        const machineRows = document.querySelectorAll('.machine-usage-row');
        const assetUsage = Array.from(machineRows).map(row => {
            return {
                assetId: parseInt(row.querySelector('.machine-select')?.value) || 0,
                hoursUsed: parseFloat(row.querySelector('.machine-hours')?.value) || 0,
                operator: row.querySelector('.machine-operator')?.value || ''
            };
        }).filter(a => a.assetId > 0);

        this.handleDailyLogSubmit({
            phaseId: document.getElementById('daily-log-phase-id')?.value,
            progressCompletion: document.getElementById('daily-progress-completion')?.value,
            narrative: narrative,
            materialsConsumed: materialsConsumed,
            assetUsage: assetUsage,
            sos: document.getElementById('sos-toggle')?.checked
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
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                    <label style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Hours Used</label>
                    <input type="number" class="form-input machine-hours" placeholder="e.g. 8" style="padding: 6px; font-size: 12px; height: 30px;">
                </div>
                <div>
                    <label style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Operator / Driver</label>
                    <input type="text" class="form-input machine-operator" placeholder="Name..." style="padding: 6px; font-size: 12px; height: 30px;">
                </div>
            </div>
        `;
        container.appendChild(row);
    },

    addMaterialUsageRow() {
        const container = document.getElementById('material-usage-rows');
        if (!container) return;
        
        if (container.querySelector('div[style*="text-align: center"]')) {
            container.innerHTML = ''; // clear empty state
        }
        
        const row = document.createElement('div');
        row.className = 'material-usage-row';
        row.style.cssText = 'background: white; border: 1px solid #FED7AA; padding: 12px; border-radius: 6px; position: relative;';
        
        // Build options from site inventory
        const inventory = this.siteInventory || {};
        const options = Object.entries(inventory).map(([name, data]) => {
            return `<option value="${name}" data-unit="${data.unit}" data-stock="${data.qty}">${name} (Stock: ${data.qty} ${data.unit})</option>`;
        }).join('');

        row.innerHTML = `
            <i class="fas fa-times" style="position: absolute; top: 12px; right: 12px; color: var(--red); cursor: pointer;" onclick="this.parentElement.remove()"></i>
            <div style="margin-bottom: 8px;">
                <label style="font-size: 10px; font-weight: 700; color: #9A3412; text-transform: uppercase;">Material</label>
                <select class="form-input material-select" style="padding: 6px; font-size: 12px; height: 30px;">
                    <option value="">Select material...</option>
                    ${options}
                </select>
            </div>
            <div>
                <label style="font-size: 10px; font-weight: 700; color: #9A3412; text-transform: uppercase;">Quantity Used</label>
                <input type="number" class="form-input material-qty" placeholder="e.g. 500" step="0.1" style="padding: 6px; font-size: 12px; height: 30px;">
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
