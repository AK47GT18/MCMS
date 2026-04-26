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
        // Initialize Gantt after a short delay to ensure DOM is ready
        setTimeout(() => this.renderGanttChart(), 300);

        const projectsList = this.allProjects || [];

        const viewModes = ['Day', 'Week', 'Month', 'Year'];

        const projectOptions = projectsList.map(p => 
            `<option value="${p.id}" ${this.selectedProjectId === p.id ? 'selected' : ''}>${p.name}</option>`
        ).join('');

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
                            <div style="font-size:11px; color:var(--slate-500);">Interactive Gantt Chart - ${this.selectedProjectId}</div>
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
                <div id="gantt-chart-container" style="overflow-x:auto; overflow-y:visible; background: white; min-height: 550px; padding: 0; border: 1px solid var(--slate-100); border-radius: 8px;">
                    <div id="gantt" style="position: relative; min-height: 500px; width: 100%;"></div>
                </div>
            </div>
        `;
    },

    changeProjectSchedule(projectId) {
        this.selectedProjectId = projectId;
        const content = this.render();
        window.app.layout.injectContent(content);
        window.toast.show(`Loading schedule for ${projectId}`, 'info');
    },

    async renderGanttChart() {
        let tasksList = [];
        
        try {
            console.log("[Gantt] Starting render for project:", this.selectedProjectId);
            
            const el = document.getElementById('gantt');
            if (!el) {
                console.error("[Gantt] Container #gantt not found");
                return;
            }
            
            // Check container is in DOM and visible
            const containerParent = document.getElementById('gantt-chart-container');
            if (!containerParent) {
                console.error("[Gantt] Parent container not found");
                return;
            }
            
            console.log("[Gantt] Container dimensions:", {
                width: el.offsetWidth,
                height: el.offsetHeight,
                display: window.getComputedStyle(el).display
            });

            // Fetch actual tasks for this project
            if (!this.selectedProjectId) return;
            const response = await tasks.getByProject(this.selectedProjectId);
            const data = response.data || response;
            tasksList = Array.isArray(data) ? data : data.tasks || [];

            console.log("[Gantt] Fetched tasks:", tasksList.length, tasksList);

            if (tasksList.length === 0) {
                console.warn("[Gantt] No tasks found, showing empty state");
                el.innerHTML = this.renderEmptyState('No tasks scheduled for this project yet.');
                return;
            }

            // Map API tasks to Frappe Gantt format
            const mappedTasks = tasksList.map(t => {
                const startDate = t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                const endDate = t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                return {
                    id: (t.id || t.code).toString(),
                    name: t.name,
                    start: startDate,
                    end: endDate,
                    progress: t.progress || 0,
                    dependencies: t.dependencies || ''
                };
            });

            console.log("[Gantt] Mapped tasks for Gantt:", mappedTasks);

            // Clear container with proper styling
            el.innerHTML = '';
            el.style.minHeight = '500px';
            el.style.width = '100%';
            el.style.position = 'relative';
            el.style.display = 'block';
            el.style.background = 'white';
            el.style.borderRadius = '8px';

            // Add comprehensive CSS overrides
            if (!document.getElementById('gantt-overrides')) {
                const style = document.createElement('style');
                style.id = 'gantt-overrides';
                style.innerHTML = `
                    #gantt { display: block !important; width: 100% !important; min-height: 500px !important; }
                    #gantt svg { display: block !important; width: 100% !important; height: auto !important; min-height: 500px !important; }
                    #gantt-chart-container { display: block !important; width: 100% !important; overflow-x: auto !important; overflow-y: visible !important; }
                    .gantt-container { display: block !important; width: 100% !important; min-height: 500px !important; height: auto !important; }
                    .gantt { display: block !important; width: 100% !important; }
                    .gantt .bar { fill: #a3a3a3; }
                    .gantt .bar-progress { fill: var(--orange-500) !important; }
                    .gantt-item-emerald .bar-progress { fill: #10b981 !important; }
                    .gantt .grid-header { font-family: 'Inter', sans-serif !important; }
                    .gantt .grid-row { fill: #ffffff !important; }
                    .gantt .row-line { stroke: #f1f5f9 !important; }
                    .gantt .holiday-highlight { fill: #f8fafc !important; }
                `;
                document.head.appendChild(style);
            }

            const GanttCls = window.Gantt || window.FrappeGantt;
            if (!GanttCls) {
                console.error("[Gantt] Gantt library not found");
                el.innerHTML = '<div style="padding:40px; text-align:center; color:red;"><i class="fas fa-exclamation-circle"></i> Gantt library not loaded. Reload page.</div>';
                return;
            }

            console.log("[Gantt] Creating instance with FrappeGantt");
            this.ganttInstance = new GanttCls("#gantt", mappedTasks, {
                header_height: 50,
                column_width: 32,
                step: 24,
                view_modes: ['Day', 'Week', 'Month', 'Year'],
                bar_height: 28,
                bar_corner_radius: 6,
                arrow_curve: 5,
                padding: 20,
                view_mode: this.currentGanttViewMode || 'Month',
                date_format: 'YYYY-MM-DD'
            });

            console.log("[Gantt] Instance created successfully");

            // Verify SVG was created
            setTimeout(() => {
                const svg = el.querySelector('svg');
                if (svg) {
                    console.log("[Gantt] SVG found, dimensions:", svg.getBoundingClientRect());
                    svg.style.display = 'block';
                    svg.style.width = '100%';
                    console.log("[Gantt] Chart should be visible now");
                    this.scrollToToday();
                } else {
                    console.warn("[Gantt] SVG element not created");
                    console.log("[Gantt] El contents:", el.innerHTML);
                }
            }, 200);

        } catch (e) {
            console.error("[Gantt] Error:", e);
            const el = document.getElementById('gantt');
            if (el) {
                el.innerHTML = `<div style="padding:20px; color:red; font-weight:bold;">Gantt Error: ${e.message}</div>`;
            }
        }
    },

    async openPhaseEditor() {
        if (!this.selectedProjectId) {
            window.toast?.show('Select a project first', 'error');
            return;
        }

        window.drawer.open('Edit Construction Phases', window.DrawerTemplates.ganttPhaseEditor);
        
        try {
            const tasksApi = await import('../../src/api/tasks.api.js');
            const response = await tasksApi.default.getByProject(this.selectedProjectId);
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

            listEl.innerHTML = tasksList.map((t, idx) => `
                <div class="form-group" style="margin-bottom: 16px; background: white; padding: 12px; border: 1px solid var(--slate-200); border-radius: 6px;">
                    <div style="font-weight: 700; color: var(--slate-800); font-size: 13px; margin-bottom: 8px;">Phase ${idx + 1}: ${this.escapeHTML(t.name)}</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size:10px; color:var(--slate-500); text-transform:uppercase;">Start Date</label>
                            <input type="date" id="phase-start-${t.id}" class="form-input" style="width: 100%; padding: 6px; font-size: 12px;" value="${t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : ''}">
                        </div>
                        <div>
                            <label style="font-size:10px; color:var(--slate-500); text-transform:uppercase;">End Date</label>
                            <input type="date" id="phase-end-${t.id}" class="form-input" style="width: 100%; padding: 6px; font-size: 12px;" value="${t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : ''}">
                        </div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Failed to load tasks for editor', error);
            window.toast?.show('Failed to load tasks', 'error');
        }
    },

    changeGanttViewMode(mode) {
        this.currentGanttViewMode = mode;
        if (this.ganttInstance) {
            this.ganttInstance.change_view_mode(mode);
        }
    },

    scrollToToday() {
        if (this.ganttInstance) {
            this.ganttInstance.scroll_today();
        }
    }
};
