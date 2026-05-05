import client from '../../../src/api/client.js';
import projects from '../../../src/api/projects.api.js';
import users from '../../../src/api/users.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import requisitions from '../../../src/api/requisitions.api.js';
import audit from '../../../src/api/audit.api.js';
import procurement from '../../../src/api/procurement.api.js';
import assets from '../../../src/api/assets.api.js';
import issues from '../../../src/api/issues.api.js';
import tasks from '../../../src/api/tasks.api.js';
import contracts from '../../../src/api/contracts.api.js';

export const PM_Gantt = {
    getGanttView() {
        // Ensure projects are loaded for the dropdown
        if (this.errorFetchingProjects) {
            return `<div style="padding: 100px; text-align: center; color: var(--red);">
                <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 12px;"></i>
                <p>Failed to sync project schedules.</p>
                <button class="btn btn-secondary" onclick="window.app.pmModule.isFetchingProjectsForGantt=false; window.app.pmModule.errorFetchingProjects=false; window.app.loadPage('gantt')">Retry Sync</button>
            </div>`;
        }

        if (!this.allProjects || this.allProjects.length === 0) {
            if (!this.isFetchingProjectsForGantt) {
                this.isFetchingProjectsForGantt = true;
                this.errorFetchingProjects = false;
                projects.getAll().then(res => {
                    this.allProjects = Array.isArray(res) ? res : (res.data || res.items || []);
                    this.isFetchingProjectsForGantt = false;
                    if (window.app && window.app.loadPage) window.app.loadPage('gantt');
                }).catch(err => {
                    console.error("[Gantt] Failed to load projects:", err);
                    this.isFetchingProjectsForGantt = false;
                    this.errorFetchingProjects = true;
                    if (window.app && window.app.loadPage) window.app.loadPage('gantt');
                });
            }
            return `<div style="padding: 100px; text-align: center; color: var(--slate-500);">
                <div class="animate-spin" style="font-size: 24px; margin-bottom: 12px;"><i class="fas fa-circle-notch"></i></div>
                <p>Synchronizing project schedules...</p>
            </div>`;
        }

        // Auto-select first project if none selected
        if (!this.selectedProjectId && this.allProjects.length > 0) {
            this.selectedProjectId = this.allProjects[0].id;
        }

        // Initialize Gantt after a short delay to ensure DOM is ready
        setTimeout(() => this.renderGanttChart(), 200);

        const projectsList = this.allProjects || [];
        const projectOptions = projectsList.map(p =>
            `<option value="${p.id}" ${this.selectedProjectId == p.id ? 'selected' : ''}>${p.code} - ${p.name}</option>`
        ).join('');

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
                            <div id="gantt-health-status" style="font-size:11px; color:var(--slate-500);">
                                <i class="fas fa-spinner fa-spin"></i> Initializing chart for Project #${this.selectedProjectId}...
                            </div>
                         </div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <button class="btn btn-action" style="padding: 6px 12px; font-size: 12px;" onclick="window.app.pmModule.openPhaseEditor()">
                            <i class="fas fa-edit"></i> Edit Phases
                        </button>
                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="window.app.pmModule.scrollToToday()">
                            <i class="fas fa-crosshairs"></i> Today
                        </button>
                        <select class="form-input" style="padding: 6px 12px; font-size: 12px; border-radius: 6px; min-width: 100px;" onchange="window.app.pmModule.changeGanttViewMode(this.value)">
                            ${viewModeOptions}
                        </select>
                        <div style="width: 1px; height: 24px; background: var(--slate-200);"></div>
                        <select class="form-input" style="padding: 6px 12px; font-size: 12px; border-radius: 6px; min-width: 180px;" onchange="window.app.pmModule.changeProjectSchedule(this.value)">
                            ${projectOptions}
                        </select>
                    </div>
                </div>
                <div id="gantt-chart-container" style="overflow:auto; background: white; max-height: 75vh; padding: 0; border: 1px solid var(--slate-100); border-radius: 8px;">
                    <div id="gantt" style="position: relative; width: 100%;"></div>
                </div>
            </div>
        `;
    }
    ,

    changeProjectSchedule(projectId) {
        // Handle potential string/int conversion
        this.selectedProjectId = isNaN(projectId) ? projectId : parseInt(projectId);

        console.log("[Gantt] Switching to project:", this.selectedProjectId);

        // Refresh the whole view to update headers and dropdown state
        if (window.app && window.app.loadPage) {
            window.app.loadPage('gantt');
        } else {
            const content = this.getGanttView();
            window.app.layout.injectContent(content);
        }

        window.toast.show(`Loading schedule for project ID: ${this.selectedProjectId}`, 'info');
    },

    async renderGanttChart(retryCount = 0) {
        if (this.isRenderingGantt) return;
        this.isRenderingGantt = true;

        try {
            console.log("[Gantt] Starting render for project:", this.selectedProjectId, "Retry:", retryCount);

            let el = document.getElementById('gantt');

            if (!el && retryCount < 5) {
                console.warn("[Gantt] #gantt not in DOM yet, retrying...", retryCount + 1);
                this.isRenderingGantt = false;
                setTimeout(() => this.renderGanttChart(retryCount + 1), 500);
                return;
            }
            if (!el) { this.isRenderingGantt = false; return; }

            const containerParent = document.getElementById('gantt-chart-container');
            if (!containerParent) { this.isRenderingGantt = false; return; }

            if (!this.selectedProjectId) { this.isRenderingGantt = false; return; }

            const response = await tasks.getByProject(this.selectedProjectId);
            const data = response.data || response;
            let tasksList = Array.isArray(data) ? data : data.tasks || [];

            const healthEl = document.getElementById('gantt-health-status');

            if (tasksList.length === 0) {
                if (healthEl) healthEl.innerHTML = `<span style="color:var(--orange);"><i class="fas fa-info-circle"></i> No phases scheduled for this project.</span>`;
                el.innerHTML = this.renderEmptyState('No tasks scheduled for this project yet. Use "Edit Phases" to generate them.');
                this.isRenderingGantt = false;
                return;
            }

            if (healthEl) healthEl.innerHTML = `<i class="fas fa-check-circle" style="color:var(--emerald-500);"></i> Connected: ${tasksList.length} Phases Found`;

            const mappedTasks = tasksList.map(t => {
                const startDate = t.startDate ? t.startDate.split('T')[0] : new Date().toISOString().split('T')[0];
                let endDate = t.endDate ? t.endDate.split('T')[0] : startDate;
                if (startDate === endDate) {
                    const nextDay = new Date(startDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    endDate = nextDay.toISOString().split('T')[0];
                }

                let deps = '', depName = 'None';
                if (t.dependencies && Array.isArray(t.dependencies)) {
                    deps = t.dependencies.map(d => typeof d === 'object' ? String(d.id || d.code) : String(d)).join(', ');
                    depName = deps;
                } else if (t.dependencyId) {
                    deps = String(t.dependencyId);
                    depName = t.dependency?.name || deps;
                }

                return {
                    id: String(t.id || t.code),
                    name: t.name || 'Unnamed Phase',
                    start: startDate,
                    end: endDate,
                    progress: Number(t.progress) || 0,
                    dependencies: deps,
                    custom_dependency_name: depName
                };
            });

            console.log("[Gantt] Mapped tasks:", mappedTasks);

            // === CONSTANTS — change these in ONE place only ===
            const BAR_HEIGHT = 42;
            const BAR_PADDING = 18;  // must match `padding` passed to GanttCls
            const HEADER_H = 65;  // must match `header_height`
            const ROW_H = BAR_HEIGHT + BAR_PADDING;

            el.innerHTML = '';
            el.style.cssText = 'width:100%; position:relative; display:block; background:white; border-radius:8px; min-height:300px;';

            let styleEl = document.getElementById('gantt-overrides');
            if (styleEl) styleEl.remove();
            const style = document.createElement('style');
            style.id = 'gantt-overrides';
            style.innerHTML = `
                #gantt { display:block !important; width:100%; overflow-x:auto; }
                #gantt-chart-container { display:block !important; width:100% !important; overflow:auto !important; position:relative; max-height:calc(100vh - 250px); }
                .gantt-container { display:block !important; width:max-content !important; min-width:100%; overflow:visible !important; padding-right:150px; }
                .gantt { -webkit-font-smoothing:antialiased; overflow:visible !important; width:auto !important; }
                .gantt .grid-background { fill:transparent !important; }
                .gantt .grid-header { font-family:system-ui,sans-serif !important; font-size:13px !important; fill:#0f172a !important; font-weight:700 !important; }
                .gantt .grid-row { fill:transparent !important; transition:fill 0.1s; }
                .gantt .grid-row.hover { fill:#f1f5f9 !important; }
                .gantt .row-line { stroke:#e2e8f0 !important; stroke-width:1px !important; pointer-events:none !important; }
                .gantt .tick, .gantt .grid-line { pointer-events:none !important; }
                .gantt .today-highlight { fill:rgba(59,130,246,0.08) !important; pointer-events:none !important; }
                #gantt * { -webkit-user-select:none !important; user-select:none !important; }
                #gantt text, #gantt tspan { fill:#0f172a !important; font-weight:600 !important; }
                .gantt .lower-text { font-size:12px !important; fill:#334155 !important; }
                .gantt .upper-text { font-size:11px !important; fill:#64748b !important; text-transform:uppercase; letter-spacing:0.05em; }
                .gantt .bar { fill:#dbeafe !important; stroke:#60a5fa !important; stroke-width:1 !important; pointer-events: all !important; }
                .gantt .bar-progress { fill:#3b82f6 !important; pointer-events: none !important; }
                .gantt .bar-wrapper { cursor:pointer; pointer-events: all !important; }
                .gantt .bar-wrapper:hover .bar { fill:#bfdbfe !important; }
                .gantt .bar-wrapper.selected .bar { fill:#93c5fd !important; stroke:#2563eb !important; stroke-width:2 !important; }
                .gantt .bar-label {
                    fill:#0f172a !important; font-weight:700 !important; font-size:12px !important;
                    paint-order:stroke !important; stroke:white !important;
                    stroke-width:3px !important; stroke-linejoin:round !important;
                    pointer-events: none !important;
                }
                .gantt .handle-group { display:none !important; }
                .gantt .arrow { stroke:#94a3b8 !important; stroke-width:1.5 !important; pointer-events:none; }
                
                /* Reset Native Popup Styling to match our custom design */
                .gantt .popup-wrapper { filter: drop-shadow(0 8px 24px rgba(0,0,0,0.13)); }
                .gantt .popup-wrapper .title, .gantt .popup-wrapper .subtitle, .gantt .popup-wrapper .pointer { display: none !important; }
            `;
            document.head.appendChild(style);

            const GanttCls = window.Gantt || window.FrappeGantt;
            if (!GanttCls) {
                el.innerHTML = '<div style="padding:40px;text-align:center;color:red;">Gantt library not loaded.</div>';
                this.isRenderingGantt = false;
                return;
            }

            el.style.display = 'block';
            void el.offsetWidth;

            try {
                this.ganttInstance = new GanttCls("#gantt", mappedTasks, {
                    header_height: HEADER_H,
                    column_width: 45,
                    step: 24,
                    view_modes: ['Day', 'Week', 'Month', 'Year'],
                    bar_height: BAR_HEIGHT,
                    bar_corner_radius: 4,
                    arrow_curve: 5,
                    padding: BAR_PADDING,
                    view_mode: this.currentGanttViewMode || 'Month',
                    date_format: 'YYYY-MM-DD',
                    custom_popup_html: function(task) {
                        const pct = task.progress;
                        const color = pct >= 75 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
                        const bg = pct >= 75 ? '#f0fdf4' : pct >= 40 ? '#fffbeb' : '#fef2f2';
                        const border = pct >= 75 ? '#bbf7d0' : pct >= 40 ? '#fde68a' : '#fecaca';

                        return `
                            <div style="padding:16px; background:white; border-radius:10px; border:1px solid #e2e8f0; font-family:system-ui,sans-serif; min-width: 260px; pointer-events:none;">
                                <div style="font-weight:700; font-size:14px; color:#0f172a; margin-bottom:10px; line-height:1.3;">${task.name}</div>
                                <div style="display:flex; align-items:center; gap:6px; background:#eff6ff; padding:8px; border-radius:6px; border:1px solid #bfdbfe; margin-bottom:12px; font-size:12px; color:#3b82f6; font-weight:600;">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>${task.start} → ${task.end}</span>
                                </div>
                                <div style="margin-bottom:${task.dependencies ? '10px' : '0'};">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                                        <span style="font-size:11px; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:0.05em;">Completion</span>
                                        <span style="font-size:13px; font-weight:800; color:${color};">${pct}%</span>
                                    </div>
                                    <div style="background:#f1f5f9; border-radius:99px; height:8px; overflow:hidden;">
                                        <div style="width:${pct}%; height:100%; background:${color}; border-radius:99px;"></div>
                                    </div>
                                </div>
                                ${task.dependencies ? `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:${bg}; padding:8px; border-radius:6px; border:1px solid ${border}; margin-top:10px;">
                                    <span style="font-size:11px; font-weight:600; color:#475569;">Depends On</span>
                                    <span style="font-size:12px; font-weight:700; color:#0f172a; max-width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${task.custom_dependency_name}">${task.custom_dependency_name}</span>
                                </div>` : ''}
                            </div>
                        `;
                    }
                });

                if (healthEl) healthEl.innerHTML = `<i class="fas fa-check-circle" style="color:var(--emerald-500);"></i> Rendered ${tasksList.length} Phases`;
            } catch (ganttErr) {
                console.error("[Gantt] Init failed:", ganttErr);
                el.innerHTML = `<div style="padding:40px;text-align:center;color:red;">Gantt Error: ${ganttErr.message}</div>`;
                this.isRenderingGantt = false;
                return;
            }

            // ── Post-render wiring ──────────────────────────────────────────
            setTimeout(() => {
                const svg = el.querySelector('svg');
                if (!svg) { this.isRenderingGantt = false; return; }

                // Fix SVG width and height to fit all rows and long labels
                const currentWidth = parseFloat(svg.getAttribute('width') || 0);
                if (currentWidth > 0) {
                    svg.setAttribute('width', (currentWidth + 250).toString()); // Add buffer for long task names
                }
                const neededH = HEADER_H + mappedTasks.length * ROW_H + 100;
                svg.setAttribute('height', Math.max(neededH, 400).toString());

                // ── Row hover (Y-tracking on SVG) ──
                let lastRow = null;
                svg.addEventListener('mousemove', (e) => {
                    const y = e.clientY - svg.getBoundingClientRect().top;
                    const rowIndex = Math.floor((y - HEADER_H) / ROW_H);
                    const allRows = svg.querySelectorAll('.grid-row');
                    if (lastRow !== null && allRows[lastRow]) allRows[lastRow].classList.remove('hover');
                    if (rowIndex >= 0 && rowIndex < allRows.length) {
                        allRows[rowIndex].classList.add('hover');
                        lastRow = rowIndex;
                    } else {
                        lastRow = null;
                    }
                });
                svg.addEventListener('mouseleave', () => {
                    svg.querySelectorAll('.grid-row').forEach(r => r.classList.remove('hover'));
                    lastRow = null;
                });

                // ── Bar selection highlight ──
                svg.addEventListener('click', (e) => {
                    svg.querySelectorAll('.bar-wrapper').forEach(w => w.classList.remove('selected'));
                    const wrapper = e.target.closest('.bar-wrapper');
                    if (wrapper) wrapper.classList.add('selected');
                });

                // Force all bars visible
                svg.querySelectorAll('.bar-wrapper').forEach(b => b.setAttribute('visibility', 'visible'));

                this.scrollToToday();
                this.isRenderingGantt = false;
            }, 300);

        } catch (e) {
            console.error("[Gantt] Error:", e);
            const el = document.getElementById('gantt');
            if (el) el.innerHTML = `<div style="padding:20px; color:red; font-weight:bold;">Gantt Error: ${e.message}</div>`;
            this.isRenderingGantt = false;
        }
    }
    ,

    async openPhaseEditor() {
        if (!this.selectedProjectId) {
            window.toast?.show('Select a project first', 'error');
            return;
        }

        window.drawer.open('Edit Construction Phases', window.DrawerTemplates.ganttPhaseEditor);

        try {

            const response = await tasks.getByProject(this.selectedProjectId);
            const data = response.data || response;
            const tasksList = Array.isArray(data) ? data : data.tasks || [];

            const listEl = document.getElementById('phase-editor-list');
            const loadingEl = document.getElementById('phase-editor-loading');
            const contentEl = document.getElementById('phase-editor-content');

            if (!listEl || !loadingEl || !contentEl) return;

            loadingEl.style.display = 'none';
            contentEl.style.display = 'block';

            if (tasksList.length === 0) {
                listEl.innerHTML = '<div style="color:var(--slate-500);text-align:center;padding:20px;">No phases generated for this project yet.</div>';
                return;
            }

            // Save state
            this.ganttPhaseEditorTasks = tasksList;

            const todayStr = new Date().toISOString().split('T')[0];
            listEl.innerHTML = tasksList.map((t, idx) => `
                <div class="form-group" style="margin-bottom: 16px; background: white; padding: 12px; border: 1px solid var(--slate-200); border-radius: 6px;">
                    <div style="font-weight: 700; color: var(--slate-800); font-size: 13px; margin-bottom: 8px;">Phase ${idx + 1}: ${this.escapeHTML(t.name)}</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size:10px; color:var(--slate-500); text-transform:uppercase;">Start Date</label>
                            <input type="date" id="phase-start-${t.id}" class="form-input phase-editor-date" data-task-id="${t.id}" data-type="start" data-idx="${idx}" min="${todayStr}" style="width: 100%; padding: 6px; font-size: 12px;" value="${t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : ''}">
                        </div>
                        <div>
                            <label style="font-size:10px; color:var(--slate-500); text-transform:uppercase;">End Date</label>
                            <input type="date" id="phase-end-${t.id}" class="form-input phase-editor-date" data-task-id="${t.id}" data-type="end" data-idx="${idx}" min="${todayStr}" style="width: 100%; padding: 6px; font-size: 12px;" value="${t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : ''}">
                        </div>
                    </div>
                </div>
            `).join('');

            // Wire up cascading listeners
            listEl.querySelectorAll('.phase-editor-date').forEach(input => {
                input.addEventListener('change', (e) => this.handlePhaseDateChange(e));
            });

        } catch (error) {
            console.error('Failed to load tasks for editor', error);
            window.toast?.show('Failed to load tasks', 'error');
        }
    }
    ,

    changeGanttViewMode(mode) {
        this.currentGanttViewMode = mode;
        if (this.ganttInstance) {
            this.ganttInstance.change_view_mode(mode);
        }
    }
    ,

    scrollToToday() {
        setTimeout(() => {
            const container = document.getElementById('gantt-chart-container');
            const todayLine = document.querySelector('.gantt .today-highlight');

            if (container && todayLine) {
                const todayX = parseFloat(todayLine.getAttribute('x'));
                if (!isNaN(todayX)) {
                    // Center the today line in the viewport
                    const scrollPos = Math.max(0, todayX - (container.clientWidth / 2));
                    container.scrollTo({ left: scrollPos, behavior: 'smooth' });
                }
            } else if (this.ganttInstance && typeof this.ganttInstance.scroll_today === 'function') {
                this.ganttInstance.scroll_today();
            }
        }, 100);
    },

    handlePhaseDateChange(e) {
        const input = e.target;
        const taskIdx = parseInt(input.dataset.idx);
        const type = input.dataset.type;
        const tasks = this.ganttPhaseEditorTasks;
        if (!tasks || taskIdx === -1) return;

        const currentTask = tasks[taskIdx];

        // Use current input values as reference for the shift calculation
        const startInput = document.getElementById(`phase-start-${currentTask.id}`);
        const endInput = document.getElementById(`phase-end-${currentTask.id}`);

        if (!startInput || !endInput) return;

        const isCascadeEnabled = document.getElementById('phase-cascade-toggle')?.checked;

        if (type === 'start') {
            const oldS = new Date(currentTask.startDate);
            const newS = new Date(startInput.value);
            const shiftMs = newS.getTime() - oldS.getTime();
            if (shiftMs === 0) return;

            const currentE = new Date(endInput.value);
            const newE = new Date(currentE.getTime() + shiftMs);
            endInput.value = newE.toISOString().split('T')[0];

            if (isCascadeEnabled) {
                if (shiftMs < 0) {
                    if (!confirm("Start date moved back. Pull forward all subsequent phases?")) return;
                }
                this.applyCascadeShift(taskIdx, shiftMs);
            }
        } else if (type === 'end') {
            const oldE = new Date(currentTask.endDate);
            const newE = new Date(endInput.value);
            const shiftMs = newE.getTime() - oldE.getTime();
            if (shiftMs === 0) return;

            if (isCascadeEnabled) {
                if (shiftMs < 0) {
                    if (!confirm("Phase duration reduced. Pull forward all subsequent phases?")) return;
                }
                this.applyCascadeShift(taskIdx, shiftMs);
            }
        }
    },

    applyCascadeShift(fromIdx, shiftMs) {
        if (shiftMs === 0) return;
        const tasks = this.ganttPhaseEditorTasks;

        // We shift every task after fromIdx
        for (let i = fromIdx + 1; i < tasks.length; i++) {
            const t = tasks[i];
            const sIn = document.getElementById(`phase-start-${t.id}`);
            const eIn = document.getElementById(`phase-end-${t.id}`);

            if (sIn && eIn) {
                const s = new Date(sIn.value);
                const e = new Date(eIn.value);

                const newS = new Date(s.getTime() + shiftMs);
                const newE = new Date(e.getTime() + shiftMs);

                sIn.value = newS.toISOString().split('T')[0];
                eIn.value = newE.toISOString().split('T')[0];

                // Add a visual cue
                sIn.style.backgroundColor = '#FFFBEB';
                eIn.style.backgroundColor = '#FFFBEB';
                setTimeout(() => {
                    sIn.style.backgroundColor = '';
                    eIn.style.backgroundColor = '';
                }, 1000);
            }
        }
    },

    escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[m];
        });
    }
};
            }[m];
        });
    }
};
