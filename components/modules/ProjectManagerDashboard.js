import { StatCard } from '../ui/StatCard.js';
import client from '../../src/api/client.js';
import users from '../../src/api/users.api.js';
import dailyLogs from '../../src/api/dailyLogs.api.js';
import requisitions from '../../src/api/requisitions.api.js';
import projects from '../../src/api/projects.api.js';
import audit from '../../src/api/audit.api.js';

export class ProjectManagerDashboard {
    constructor() {
        this.currentView = 'portfolio';
        this.selectedProjectId = 'CEN-01'; // Default project
        this.currentGanttViewMode = 'Day'; // Default view mode
    }

    render() {
        let contentHTML = '';
        
        switch(this.currentView) {
            case 'portfolio': 
            case 'dashboard': 
                contentHTML = this.getPortfolioView(); 
                break;
            case 'gantt': 
            case 'execution': 
                contentHTML = this.getGanttView(); 
                break;
            case 'budget': contentHTML = this.getBudgetView(); break;
            case 'teams': contentHTML = this.getTeamsView(); break;
            case 'contracts': contentHTML = this.getContractsView(); break;
            case 'reports': contentHTML = this.getReportsView(); break;
            case 'analytics': contentHTML = this.getAnalyticsView(); break;
            case 'reviews': contentHTML = this.getReviewsView(); break;
            case 'issues': contentHTML = this.getIssuesView(); break;
            case 'fleet': contentHTML = this.getFleetView(); break;
            case 'users': contentHTML = this.getUsersView(); break;
            case 'audit': contentHTML = this.getAuditView(); break;
            default: contentHTML = this.getPortfolioView();
        }

        return `
            <div id="pm-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${contentHTML}
                </div>
            </div>
        `;
    }

    getHeaderHTML() {
        const titleMap = {
            'portfolio': 'Dashboard',
            'dashboard': 'Dashboard',
            'gantt': 'Execution Schedule',
            'execution': 'Execution Schedule',
            'budget': 'Financial Control',
            'teams': 'Field Operations',
            'contracts': 'Contract Registry',
            'reports': 'Reports Center',
            'analytics': 'Performance Analytics',
            'reviews': 'Approvals & Reviews',
            'issues': 'Issues Resolution Center',
            'fleet': 'Asset Registry',
            'users': 'User Management',
            'audit': 'System Audit Logs'
        };

        return `
            <div class="page-header">
                <div class="breadcrumb">
                  <span>Workspace</span>
                  <i class="fas fa-chevron-right" style="font-size: 9px;"></i>
                  <span>${titleMap[this.currentView] || 'Dashboard'}</span>
                </div>
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">${titleMap[this.currentView] || 'Overview'}</h1>
                    ${this.getContextStrip()}
                  </div>
                  ${this.getActionButtons()}
                </div>
            </div>
        `;
    }

    getContextStrip() {
        if (this.currentView === 'budget') {
            return `
                <div class="context-strip">
                  <span class="context-value">MWK 450M</span> Total Budget
                  <div class="context-dot"></div>
                  <span style="color: var(--emerald); font-weight: 600;">85% Utilized</span>
                  <div class="context-dot"></div>
                  <span style="color: var(--orange);">2 Pending Approvals</span>
                </div>`;
        }
        return `
            <div class="context-strip">
              <span class="context-value" id="context-active-projects">4</span> Active Projects
              <div class="context-dot"></div>
              <span class="context-value" id="context-portfolio-value">MWK 1.2B</span> Portfolio Value
              <div class="context-dot"></div>
              <span style="color: var(--orange); font-weight: 600;"><span id="context-pending-logs">3</span> Pending Logs</span>
            </div>`;
    }

    getActionButtons() {
        if (this.currentView === 'portfolio' || this.currentView === 'dashboard') {
            return `
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-secondary" onclick="window.drawer.open('Log Complaint', window.DrawerTemplates.submitComplaint)">
                        <i class="fas fa-exclamation-triangle"></i> <span>Log Issue</span>
                    </button>
                    <button class="btn btn-action" onclick="window.app.pmModule.openNewProjectDrawer()">
                        <i class="fas fa-plus-circle"></i> <span>New Project</span>
                    </button>
                </div>`;
        }
        if (this.currentView === 'gantt' || this.currentView === 'execution') {
             return `
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-secondary"><i class="fas fa-sliders"></i> Filter</button>
                    <button class="btn btn-primary" onclick="window.drawer.open('Add Task', window.DrawerTemplates.addTask)"><i class="fas fa-calendar-plus"></i> Add Task</button>
                </div>`;
        }
        if (this.currentView === 'users') {
             return `
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-action" onclick="window.drawer.open('Add New User', window.DrawerTemplates.newUser); window.app.pmModule.initCreateUserForm();">
                        <i class="fas fa-user-plus"></i> <span>Add User</span>
                    </button>
                </div>`;
        }
        return '';
    }

    // --- 1. PORTFOLIO MODULE ---
    getPortfolioView() {
        // Trigger async load after render
        setTimeout(() => this.loadProjectsFromAPI(), 0);

        return `
            ${this.getStatsGridHTML()}
            <div class="data-card">
              <div class="data-card-header">
                <div class="tabs" style="margin-bottom: 0;">
                  <div class="tab active" data-status="active" onclick="this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active'); window.app?.pmModule?.filterProjectsByStatus('active')">Active Projects</div>
                  <div class="tab" data-status="planning" onclick="this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active'); window.app?.pmModule?.filterProjectsByStatus('planning')">Planning</div>
                  <div class="tab" data-status="hold" onclick="this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active'); window.app?.pmModule?.filterProjectsByStatus('on_hold')">On Hold</div>
                  <div class="tab" data-status="completed" onclick="this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active'); window.app?.pmModule?.filterProjectsByStatus('completed')">Completed</div>
                </div>
                <button class="btn btn-secondary"><i class="fas fa-filter"></i> Filter</button>
              </div>
              <div id="projects-table-container">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400);">
                    <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                    <div>Loading projects...</div>
                </div>
              </div>
            </div>
        `;
    }

    async loadProjectsFromAPI() {
        console.log('[DEBUG] loadProjectsFromAPI triggered');
        const container = document.getElementById('projects-table-container');
        if (!container) return;

        try {
            // Using authenticated client instead of raw fetch
            const result = await client.get('/projects');
            console.log('[DEBUG] Projects fetch successfully:', result);
            
            this.allProjects = Array.isArray(result) ? result : result.data || result.items || [];

            if (this.allProjects.length === 0) {
                container.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400); text-align: center;">
                        <i class="fas fa-folder-open" style="font-size: 32px; margin-bottom: 12px;"></i>
                        <div style="font-weight: 600; color: var(--slate-600);">No projects found</div>
                        <div style="font-size: 13px;">Create a new project to get started</div>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.renderProjectsTable(this.allProjects);
            this.updateHeaderStats();
        } catch (error) {
            console.error('[CRITICAL] Failed to load projects from API:', error);
            
            // Show detailed error if available from backend
            const errorMsg = error.data?.error?.message || error.message || 'Unknown error';
            
            container.innerHTML = `
                <div style="padding: 24px; text-align: center; color: var(--red); background: rgba(239, 68, 68, 0.05); border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.1);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 12px; opacity: 0.8;"></i>
                    <div style="font-weight: 700; margin-bottom: 4px;">Backend Error (500)</div>
                    <div style="font-size: 13px; margin-bottom: 16px;">${errorMsg}</div>
                    <button class="btn btn-secondary" style="margin: 0 auto;" onclick="window.app?.pmModule?.loadProjectsFromAPI()">
                        <i class="fas fa-sync-alt" style="margin-right: 8px;"></i> Retry Connection
                    </button>
                </div>
            `;
            
            if (window.toast) {
                window.toast.show(`Project fetch failed: ${errorMsg}`, 'error');
            }
        }
    }

    filterProjectsByStatus(status) {
        const filtered = status === 'active' 
            ? this.allProjects.filter(p => p.status === 'active' || p.status === 'in_progress')
            : this.allProjects.filter(p => p.status === status);
        const container = document.getElementById('projects-table-container');
        if (container) {
            container.innerHTML = filtered.length > 0 
                ? this.renderProjectsTable(filtered)
                : `<div style="padding: 40px; text-align: center; color: var(--slate-400);">No ${status} projects found</div>`;
        }
    }

    renderProjectsTable(projects) {
        const getStatusClass = (status) => {
            const map = { 'active': 'active', 'in_progress': 'active', 'completed': 'active', 'on_hold': 'pending', 'planning': 'pending', 'delayed': 'delayed' };
            return map[status] || 'pending';
        };
        const getStatusIcon = (status) => {
            const map = { 'active': 'fa-play-circle', 'in_progress': 'fa-play-circle', 'completed': 'fa-check-circle', 'on_hold': 'fa-pause-circle', 'planning': 'fa-clock', 'delayed': 'fa-exclamation-circle' };
            return map[status] || 'fa-circle';
        };
        const formatStatus = (s) => s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
        const calculateProgress = (p) => p.progress || 0; // Default to 0 instead of random

        const rows = projects.map(project => `
            <tr>
                <td onclick="window.drawer.open('Project Details', window.DrawerTemplates.projectDetails)"><span class="project-id">${project.code || project.id}</span></td>
                <td style="font-weight: 600;" onclick="window.drawer.open('Project Details', window.DrawerTemplates.projectDetails)">${project.name}</td>
                <td onclick="window.drawer.open('Project Details', window.DrawerTemplates.projectDetails)">${project.manager?.name || project.managerName || '-'}</td>
                <td onclick="window.drawer.open('Project Details', window.DrawerTemplates.projectDetails)">
                    <div class="progress-text"><span>${project.currentPhase || 'In Progress'}</span> <span>${calculateProgress(project)}%</span></div>
                    <div class="progress-container"><div class="progress-bar" style="width: ${calculateProgress(project)}%; background: ${calculateProgress(project) > 80 ? 'var(--emerald)' : calculateProgress(project) > 50 ? 'var(--orange)' : 'var(--red)'};"></div></div>
                </td>
                <td onclick="window.drawer.open('Project Details', window.DrawerTemplates.projectDetails)"><span class="status ${project.budgetUtilization > 100 ? 'delayed' : 'active'}" style="background:${project.budgetUtilization > 100 ? 'var(--red-light)' : 'var(--emerald-light)'}; color:${project.budgetUtilization > 100 ? 'var(--red-dark)' : 'var(--emerald-dark)'};">${project.budgetUtilization > 100 ? 'Overrun' : 'Good'} (${project.budgetUtilization || 85}%)</span></td>
                <td onclick="window.drawer.open('Project Details', window.DrawerTemplates.projectDetails)"><span class="status ${getStatusClass(project.status)}"><i class="fas ${getStatusIcon(project.status)}"></i> ${formatStatus(project.status)}</span></td>
                <td style="position: relative;">
                    <div class="dropdown" style="position: relative; display: inline-block;">
                        <button class="btn-icon" onclick="event.stopPropagation(); this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'block' ? 'none' : 'block';"><i class="fas fa-ellipsis-v"></i></button>
                        <div class="dropdown-content" style="display: none; position: absolute; right: 0; background-color: white; min-width: 160px; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); z-index: 1; border-radius: 4px; border: 1px solid var(--slate-200);">
                            <a href="#" onclick="event.preventDefault(); window.app.pmModule.openEditProjectDrawer('${project.id}');" style="color: black; padding: 12px 16px; text-decoration: none; display: block; font-size: 13px;"><i class="fas fa-edit" style="width: 20px;"></i> Edit</a>
                            <a href="#" onclick="event.preventDefault(); window.app.pmModule.openSuspendProjectDrawer('${project.id}');" style="color: black; padding: 12px 16px; text-decoration: none; display: block; font-size: 13px;"><i class="fas fa-pause" style="width: 20px;"></i> Suspend</a>
                            <a href="#" onclick="event.preventDefault(); window.app.pmModule.handleDeleteProject('${project.id}');" style="color: var(--red); padding: 12px 16px; text-decoration: none; display: block; font-size: 13px;"><i class="fas fa-trash" style="width: 20px;"></i> Delete</a>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Project ID</th>
                        <th>Project Name</th>
                        <th>Manager</th>
                        <th>Progress</th>
                        <th>Budget Health</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            <script>
                // Close dropdowns when clicking outside
                window.onclick = function(event) {
                    if (!event.target.matches('.btn-icon') && !event.target.matches('.fa-ellipsis-v')) {
                        var dropdowns = document.getElementsByClassName("dropdown-content");
                        for (var i = 0; i < dropdowns.length; i++) {
                            var openDropdown = dropdowns[i];
                            if (openDropdown.style.display === 'block') {
                                openDropdown.style.display = 'none';
                            }
                        }
                    }
                }
            </script>
        `;
    }

    getStatsGridHTML() {
        return `
            <div class="stats-grid">
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Budget Health</span><i class="fas fa-wallet" style="color: var(--emerald);"></i></div>
                  <div class="stat-value" id="stat-budget-health">85%</div>
                  <div class="stat-sub"><i class="fas fa-arrow-up"></i> Utilized (Aggregate)</div>
               </div>
               <div class="stat-card" style="border-color: var(--orange-light); background: #fffbf7;" onclick="window.toast.show('Filtering for pending reviews...', 'info')">
                  <div class="stat-header"><span class="stat-label" style="color: var(--orange);">Pending Reviews</span><i class="fas fa-clipboard-check" style="color: var(--orange);"></i></div>
                  <div class="stat-value" style="color: var(--orange);" id="stat-pending-reviews">0</div>
                  <div class="stat-sub">Field logs awaiting approval</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Portfolio Value</span><i class="fas fa-chart-line" style="color: var(--blue);"></i></div>
                  <div class="stat-value" id="stat-portfolio-value">MWK 0</div>
                  <div class="stat-sub">Across all projects</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Active Projects</span><i class="fas fa-project-diagram" style="color: var(--slate-600);"></i></div>
                  <div class="stat-value" id="stat-active-projects">0</div>
                  <div class="stat-sub">Managed currently</div>
               </div>
            </div>
        `;
    }

    // --- 2.1 GANTT SCHEDULE (EXECUTION) ---
    getGanttView() {
        // Initialize Gantt after a short delay to ensure DOM is ready
        setTimeout(() => this.renderGanttChart(), 100);

        const projects = [
            { id: 'CEN-01', name: 'CEN-01 Unilia Library' },
            { id: 'MZ-05', name: 'MZ-05 Clinic Extension' },
            { id: 'LIL-02', name: 'LIL-02 Mall Access' }
        ];

        const viewModes = ['Day', 'Week', 'Month', 'Year'];

        const projectOptions = projects.map(p => 
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
                            <div style="font-size:11px; color:var(--slate-500);">Interactive Gantt Chart • ${this.selectedProjectId}</div>
                         </div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
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
                <div id="gantt-chart-container" style="overflow-x:auto; background: white; min-height: 500px; padding: 20px; border: 1px solid var(--slate-100); border-radius: 8px;">
                    <div id="gantt" style="position: relative; min-height: 450px;"></div>
                </div>
            </div>
        `;
    }

    changeProjectSchedule(projectId) {
        this.selectedProjectId = projectId;
        const content = this.render();
        window.app.layout.injectContent(content);
        window.toast.show(`Loading schedule for ${projectId}`, 'info');
    }

    changeGanttViewMode(mode) {
        this.currentGanttViewMode = mode;
        if (this.ganttInstance) {
            this.ganttInstance.change_view_mode(mode);
        }
    }

    scrollToToday() {
        if (this.ganttInstance) {
            this.ganttInstance.scroll_today();
        }
    }

    renderGanttChart() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        // Helper to get ISO date strings for near-future tasks
        const dateOffset = (days) => {
            const d = new Date();
            d.setDate(d.getDate() + days);
            return d.toISOString().split('T')[0];
        };
        
        const projectData = {
            'CEN-01': [
                { id: 'T1', name: 'Site Clearing & Survey', start: dateOffset(-10), end: dateOffset(-3), progress: 100, custom_class: 'gantt-item-emerald' },
                { id: 'T2', name: 'Excavation & Trenching', start: dateOffset(-2), end: dateOffset(5), progress: 45, dependencies: 'T1', custom_class: 'gantt-item-emerald' },
                { id: 'T3', name: 'Foundation Poured', start: dateOffset(6), end: dateOffset(12), progress: 0, dependencies: 'T2', custom_class: 'gantt-item-orange' },
                { id: 'T4', name: 'Structural Steel Framing', start: dateOffset(13), end: dateOffset(25), progress: 0, dependencies: 'T3' },
                { id: 'T5', name: 'MEP First Fix', start: dateOffset(20), end: dateOffset(35), progress: 0 },
                { id: 'T6', name: 'Brickwork & Walling', start: dateOffset(25), end: dateOffset(45), progress: 0 },
                { id: 'T7', name: 'Roofing Installation', start: dateOffset(40), end: dateOffset(55), progress: 0 },
                { id: 'T8', name: 'Interior Plastering', start: dateOffset(50), end: dateOffset(65), progress: 0 },
                { id: 'T9', name: 'Exterior Landscaping', start: dateOffset(60), end: dateOffset(75), progress: 0 },
                { id: 'T10', name: 'Handover & Inspections', start: dateOffset(80), end: dateOffset(90), progress: 0 }
            ],
            'MZ-05': [
                { id: 'M1', name: 'Patient Ward Demolition', start: dateOffset(-5), end: dateOffset(2), progress: 100, custom_class: 'gantt-item-emerald' },
                { id: 'M2', name: 'Debris Removal', start: dateOffset(-3), end: dateOffset(4), progress: 100, custom_class: 'gantt-item-emerald' },
                { id: 'M3', name: 'New Slab Pouring', start: dateOffset(3), end: dateOffset(10), progress: 40, dependencies: 'M1', custom_class: 'gantt-item-orange' },
                { id: 'M4', name: 'Column Reinforcement', start: dateOffset(11), end: dateOffset(20), progress: 10, dependencies: 'M3' },
                { id: 'M5', name: 'Wall Plate Installation', start: dateOffset(21), end: dateOffset(30), progress: 0, dependencies: 'M3' },
                { id: 'M6', name: 'Roof Truss Fab', start: dateOffset(25), end: dateOffset(35), progress: 0, dependencies: 'M5' },
                { id: 'M7', name: 'Electrical Rough-in', start: dateOffset(30), end: dateOffset(45), progress: 0, dependencies: 'M5' },
                { id: 'M8', name: 'Plumbing Integration', start: dateOffset(40), end: dateOffset(55), progress: 0, dependencies: 'M7' },
                { id: 'M9', name: 'Floor Tiling', start: dateOffset(50), end: dateOffset(70), progress: 0, dependencies: 'M8' },
                { id: 'M10', name: 'Final Painting', start: dateOffset(75), end: dateOffset(85), progress: 0, dependencies: 'M9' }
            ],
            'LIL-02': [
                { id: 'L1', name: 'Access Road Grading', start: dateOffset(-8), end: dateOffset(2), progress: 100, custom_class: 'gantt-item-emerald' },
                { id: 'L2', name: 'Drainage Excavation', start: dateOffset(-2), end: dateOffset(8), progress: 90, dependencies: 'L1', custom_class: 'gantt-item-emerald' },
                { id: 'L3', name: 'Culvert Installation', start: dateOffset(5), end: dateOffset(15), progress: 60, dependencies: 'L1', custom_class: 'gantt-item-orange' },
                { id: 'L4', name: 'Compaction & Rolling', start: dateOffset(16), end: dateOffset(25), progress: 20, dependencies: 'L3' },
                { id: 'L5', name: 'Pavement Sub-base', start: dateOffset(26), end: dateOffset(40), progress: 0, dependencies: 'L3' },
                { id: 'L6', name: 'Kerb & Gutter Install', start: dateOffset(41), end: dateOffset(55), progress: 0, dependencies: 'L5' },
                { id: 'L7', name: 'Street Light Poles', start: dateOffset(50), end: dateOffset(65), progress: 0, dependencies: 'L5' },
                { id: 'L8', name: 'Asphalt Paving', start: dateOffset(66), end: dateOffset(80), progress: 0, dependencies: 'L6' },
                { id: 'L9', name: 'Road Marking', start: dateOffset(81), end: dateOffset(88), progress: 0, dependencies: 'L8' },
                { id: 'L10', name: 'Landscaping Buffer', start: dateOffset(90), end: dateOffset(105), progress: 0, dependencies: 'L9' }
            ]
        };

        // Create a deep copy of tasks to prevent external modification issues
        const tasks = JSON.parse(JSON.stringify(projectData[this.selectedProjectId] || projectData['CEN-01']));

        try {
            console.log("[Gantt] Starting render for project:", this.selectedProjectId);
            const el = document.getElementById('gantt');
            if (!el) {
                console.error("[Gantt] Target container #gantt not found");
                return;
            }
            
            // Clear and ensure dimensions
            el.innerHTML = '<div style="padding: 20px; color: var(--slate-400); font-style: italic;">Drawing schedule...</div>';
            el.style.minHeight = '450px';
            el.style.position = 'relative';

            // Add CSS Overrides to fix conflict with style.css .bar class
            if (!document.getElementById('gantt-overrides')) {
                const style = document.createElement('style');
                style.id = 'gantt-overrides';
                style.innerHTML = `
                    .gantt .bar { fill: #a3a3a3; }
                    .gantt .bar-progress { fill: var(--orange-500) !important; }
                    .gantt-item-emerald .bar-progress { fill: #10b981 !important; }
                    .gantt-item-orange .bar-progress { fill: #f59e0b !important; }
                    .gantt-item-red .bar-progress { fill: #ef4444 !important; }
                    .gantt .grid-header { font-family: 'Inter', sans-serif !important; }
                    .gantt .grid-row { fill: #ffffff !important; }
                    .gantt .row-line { stroke: #f1f5f9 !important; }
                    .gantt .holiday-highlight { fill: #f8fafc !important; } /* Fix "black columns" */
                    .gantt-container .side-header { display: none !important; } /* Hide redundant side controls */
                    .gantt-container { 
                        border-radius: 8px; 
                        border: 1px solid var(--slate-200); 
                        min-height: 450px !important; 
                        height: auto !important;
                    }
                    .gantt .today-button { display: none !important; } /* Hide library internal button */
                `;
                document.head.appendChild(style);
            }

            const GanttCls = window.Gantt || window.FrappeGantt;
            if (!GanttCls) {
                el.innerHTML = '<div style="padding:40px; text-align:center; color:#666;"><i class="fas fa-exclamation-circle"></i> Gantt library not loaded</div>';
                return;
            }

            this.ganttInstance = new GanttCls("#gantt", tasks, {
                header_height: 50,
                column_width: 32,
                step: 24,
                view_modes: ['Day', 'Week', 'Month', 'Year'],
                bar_height: 28,
                bar_corner_radius: 6,
                arrow_curve: 5,
                padding: 20,
                view_mode: this.currentGanttViewMode,
                date_format: 'YYYY-MM-DD',
                custom_popup_html: function(task) {
                    const startStr = window.moment ? moment(task._start).format('MMM D') : task.start;
                    const endStr = window.moment ? moment(task._end).format('MMM D') : task.end;
                    const days = window.moment ? moment(task._end).diff(moment(task._start), 'days') || 1 : 1;

                    return `
                        <div class="gantt-popup-card" style="padding: 16px; min-width: 220px; border-radius: 12px; background: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid var(--slate-200);">
                            <div style="font-weight:800; color:var(--slate-900); font-size:14px; margin-bottom:8px;">${task.name}</div>
                            <div style="font-size:12px; color:var(--slate-600); margin-bottom:12px;">${startStr} - ${endStr} (${days} Days)</div>
                            <div style="height:6px; background:var(--slate-100); border-radius:3px; overflow:hidden;">
                                <div style="width:${task.progress}%; height:100%; background:var(--orange-500);"></div>
                            </div>
                            <div style="font-size:11px; margin-top:4px;">Progress: ${task.progress}%</div>
                        </div>
                    `;
                }
            });

            console.log("[Gantt] Render successful:", this.ganttInstance);
            el.querySelector('div')?.remove(); // Remove "Drawing..." text

            // Auto-scroll to current period
            setTimeout(() => {
                const container = el.querySelector('.gantt-container') || document.querySelector('.gantt-container');
                if (container) {
                    const svg = container.querySelector('svg');
                    if (!svg || svg.childNodes.length === 0) {
                        console.warn("Gantt SVG is empty - force refreshing");
                        this.ganttInstance.refresh(tasks);
                    }
                    this.scrollToToday();
                }
            }, 500);

        } catch (e) {
            console.error("Gantt Error:", e);
        }
    }

    // --- 2.2 BUDGET CONTROL (EXECUTION) ---
    getBudgetView() {
        return `
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Transaction Ledger</div>
                        <button class="btn btn-action" onclick="window.drawer.open('New Transaction', window.DrawerTemplates.transactionEntry)"><i class="fas fa-plus"></i> New Entry</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Ref</th>
                                <th>Category</th>
                                <th>Vendor</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="project-id">TRX-099</td>
                                <td>Materials</td>
                                <td>Malawi Cement</td>
                                <td style="font-family:'JetBrains Mono'">MWK 4.5M</td>
                                <td><span class="status pending">Level 1 Appr.</span></td>
                            </tr>
                            <tr>
                                <td class="project-id">TRX-098</td>
                                <td>Labor</td>
                                <td>Payroll Run</td>
                                <td style="font-family:'JetBrains Mono'">MWK 12.2M</td>
                                <td><span class="status active">Paid</span></td>
                            </tr>
                             <tr>
                                <td class="project-id">TRX-097</td>
                                <td>Equipment</td>
                                <td>CAT Rentals</td>
                                <td style="font-family:'JetBrains Mono'">MWK 1.1M</td>
                                <td><span class="status active">Paid</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div class="stat-card" style="background:var(--slate-800); color:white; border:none;">
                        <div class="stat-label" style="color:var(--slate-400);">Total Spend (Active)</div>
                        <div class="stat-value" style="color:white; font-size:28px;">MWK 382.5M</div>
                        <div class="stat-sub" style="color:var(--emerald);">Within 5% Variance</div>
                    </div>

                    <div class="fraud-alert-card" style="background:#FEF2F2; border:1px solid #FECACA; padding:16px; border-radius:8px;">
                         <div style="display:flex; gap:10px; margin-bottom:8px;">
                            <i class="fas fa-exclamation-triangle" style="color:var(--red);"></i>
                            <div style="font-weight:700; color:var(--red-dark); font-size:13px;">Budget Alert</div>
                         </div>
                         <div style="font-size:12px; color:var(--red-dark); line-height:1.4;">
                            <strong>CEN-01 Materials</strong> category has reached <strong>92%</strong> utilization. Level 2 approval required for next PO.
                         </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- 2.3 FIELD TEAMS (EXECUTION) ---
    getTeamsView() {
        return `
            <div class="data-card">
                 <div class="data-card-header">
                    <div class="card-title">Live Site Status</div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px; padding:20px;">
                    <!-- Site Card 1 -->
                    <div style="border:1px solid var(--slate-200); border-radius:8px; padding:16px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                            <div style="font-weight:700;">CEN-01 Unilia</div>
                            <span class="status active"><i class="fas fa-satellite-dish"></i> Live</span>
                        </div>
                        <div style="display:flex; gap:12px; margin-bottom:16px;">
                            <div class="profile-avatar" style="width:32px; height:32px; font-size:12px;">JB</div>
                            <div>
                                <div style="font-size:12px; font-weight:600;">John Banda</div>
                                <div style="font-size:11px; color:var(--slate-500);">Supervisor</div>
                            </div>
                        </div>
                        <div style="background:var(--slate-50); padding:10px; border-radius:6px; font-size:11px; margin-bottom:12px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span>Attendance</span>
                                <strong>14/15 Present</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Last Report</span>
                                <strong>14:00 Today</strong>
                            </div>
                        </div>
                        <button class="btn btn-secondary" style="width:100%; font-size:11px;" onclick="window.drawer.open('Site Log Verification', window.DrawerTemplates.siteLogVerification)">View Daily Logs</button>
                    </div>

                    <!-- Site Card 2 -->
                    <div style="border:1px solid var(--slate-200); border-radius:8px; padding:16px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                            <div style="font-weight:700;">MZ-05 Clinic</div>
                            <span class="status pending"><i class="fas fa-ellipsis-h"></i> Offline</span>
                        </div>
                        <div style="display:flex; gap:12px; margin-bottom:16px;">
                            <div class="profile-avatar" style="width:32px; height:32px; font-size:12px; background:var(--orange);">PP</div>
                            <div>
                                <div style="font-size:12px; font-weight:600;">Peter Phiri</div>
                                <div style="font-size:11px; color:var(--slate-500);">Supervisor</div>
                            </div>
                        </div>
                         <div style="background:var(--slate-50); padding:10px; border-radius:6px; font-size:11px; margin-bottom:12px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span>Attendance</span>
                                <strong>--</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Last Report</span>
                                <strong>Yesterday</strong>
                            </div>
                        </div>
                        <button class="btn btn-secondary" style="width:100%; font-size:11px;" onclick="window.drawer.open('Site Log Verification', window.DrawerTemplates.siteLogVerification)">View Daily Logs</button>
                    </div>
                </div>
            </div>
        `;
    }

    // --- 5. CONTRACTS (DOCUMENTS) ---
    getContractsView() {
         return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Contract Repository</div>
                <button class="btn btn-primary" onclick="window.drawer.open('New Contract', window.DrawerTemplates.newContract)"><i class="fas fa-upload"></i> Upload</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Contract ID</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Version</th>
                    <th>Expiry in</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span class="project-id">CTR-2024-001</span></td>
                    <td style="font-weight:600;">Unilia Main Works</td>
                    <td>Construction</td>
                    <td><span style="background:var(--blue-light); color:var(--blue-dark); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">v3.0</span></td>
                    <td style="color:var(--orange);">18 Months</td>
                    <td><button class="btn btn-secondary" style="padding:4px 8px;"><i class="fas fa-download"></i></button></td>
                  </tr>
                  <tr>
                     <td><span class="project-id">CTR-SUB-05</span></td>
                    <td style="font-weight:600;">Plumbing Subcontract</td>
                    <td>Specialist</td>
                    <td><span style="background:var(--slate-200); color:var(--slate-600); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">v1.0</span></td>
                    <td style="color:var(--red);">7 Days</td>
                    <td><button class="btn btn-secondary" style="padding:4px 8px;"><i class="fas fa-download"></i></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
        `;
    }

    // --- 6. REPORTS (REPORTS) ---
    getReportsView() {
        return `
            <div class="reports-container animate-fade-in">
                <!-- Filters Bar -->
                <div class="data-card" style="margin-bottom: 24px; background: var(--slate-50); border: 1px solid var(--slate-200);">
                    <div style="padding: 16px; display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end;">
                        <div style="flex: 1; min-width: 200px;">
                            <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 6px;">Search Reports</label>
                            <div style="position: relative;">
                                <i class="fas fa-search" style="position: absolute; left: 12px; top: 10px; color: var(--slate-400);"></i>
                                <input type="text" class="form-input" placeholder="Keyword, report ID..." style="padding-left: 36px; width: 100%;">
                            </div>
                        </div>
                        <div style="width: 180px;">
                            <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 6px;">Project</label>
                            <select class="form-input" style="width: 100%;">
                                <option>All Projects</option>
                                <option>CEN-01 Unilia</option>
                                <option>MZ-05 Clinic</option>
                                <option>LIL-02 Mall</option>
                            </select>
                        </div>
                        <div style="width: 180px;">
                            <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 6px;">Category</label>
                            <select class="form-input" style="width: 100%;">
                                <option>All Categories</option>
                                <option>Financial</option>
                                <option>Operational</option>
                                <option>Legal/Contracts</option>
                                <option>Safety</option>
                            </select>
                        </div>
                        <div style="width: 180px;">
                            <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 6px;">Period</label>
                            <select class="form-input" style="width: 100%;">
                                <option>Last 30 Days</option>
                                <option>This Quarter</option>
                                <option>Financial Year</option>
                                <option>Custom Range</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" style="height: 38px;"><i class="fas fa-filter"></i> Apply</button>
                    </div>
                </div>

                <!-- Reports Grid -->
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:24px;">
                    <!-- Report 1 -->
                    <div class="data-card" style="padding:0; display: flex; flex-direction: column;">
                        <div style="padding: 24px; text-align:center; border-bottom: 1px solid var(--slate-100); flex: 1;">
                            <div style="width: 56px; height: 56px; background: var(--blue-light); color: var(--blue); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px;">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div style="font-weight:700; font-size: 16px; margin-bottom:8px; color: var(--slate-900);">Project Status Summary</div>
                            <p style="font-size:12px; color:var(--slate-500); line-height: 1.5;">Comprehensive timeline adherence, milestone tracking, and critical risk assessment.</p>
                        </div>
                        <div style="padding: 12px; background: var(--slate-50); display: flex; gap: 8px; justify-content: center;">
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;" title="Download PDF"><i class="fas fa-file-pdf" style="color: #ef4444;"></i> PDF</button>
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;" title="Download Excel"><i class="fas fa-file-excel" style="color: #10b981;"></i> XLSX</button>
                        </div>
                    </div>

                    <!-- Report 2 -->
                    <div class="data-card" style="padding:0; display: flex; flex-direction: column;">
                        <div style="padding: 24px; text-align:center; border-bottom: 1px solid var(--slate-100); flex: 1;">
                            <div style="width: 56px; height: 56px; background: var(--emerald-light); color: var(--emerald); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px;">
                                <i class="fas fa-coins"></i>
                            </div>
                            <div style="font-weight:700; font-size: 16px; margin-bottom:8px; color: var(--slate-900);">Financial Expenditure</div>
                            <p style="font-size:12px; color:var(--slate-500); line-height: 1.5;">Real-time budget consumption by vendor, category, and labor cost variance.</p>
                        </div>
                        <div style="padding: 12px; background: var(--slate-50); display: flex; gap: 8px; justify-content: center;">
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;"><i class="fas fa-file-pdf" style="color: #ef4444;"></i> PDF</button>
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;"><i class="fas fa-file-excel" style="color: #10b981;"></i> XLSX</button>
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;"><i class="fas fa-file-csv" style="color: var(--blue);"></i> CSV</button>
                        </div>
                    </div>

                    <!-- Report 3 -->
                    <div class="data-card" style="padding:0; display: flex; flex-direction: column;">
                        <div style="padding: 24px; text-align:center; border-bottom: 1px solid var(--slate-100); flex: 1;">
                            <div style="width: 56px; height: 56px; background: var(--orange-light); color: var(--orange); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px;">
                                <i class="fas fa-hard-hat"></i>
                            </div>
                            <div style="font-weight:700; font-size: 16px; margin-bottom:8px; color: var(--slate-900);">Site Activity Log</div>
                            <p style="font-size:12px; color:var(--slate-500); line-height: 1.5;">Consolidated daily field reports, site attendance, and equipment usage logs.</p>
                        </div>
                        <div style="padding: 12px; background: var(--slate-50); display: flex; gap: 8px; justify-content: center;">
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;"><i class="fas fa-file-pdf" style="color: #ef4444;"></i> PDF</button>
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;"><i class="fas fa-file-csv" style="color: var(--blue);"></i> CSV</button>
                        </div>
                    </div>

                    <!-- Report 4 (New) -->
                    <div class="data-card" style="padding:0; display: flex; flex-direction: column;">
                        <div style="padding: 24px; text-align:center; border-bottom: 1px solid var(--slate-100); flex: 1;">
                            <div style="width: 56px; height: 56px; background: #EEF2FF; color: #4F46E5; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px;">
                                <i class="fas fa-truck-loading"></i>
                            </div>
                            <div style="font-weight:700; font-size: 16px; margin-bottom:8px; color: var(--slate-900);">Procurement Tracker</div>
                            <p style="font-size:12px; color:var(--slate-500); line-height: 1.5;">Material requisition status, supplier delivery performance, and stock levels.</p>
                        </div>
                        <div style="padding: 12px; background: var(--slate-50); display: flex; gap: 8px; justify-content: center;">
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;"><i class="fas fa-file-pdf" style="color: #ef4444;"></i> PDF</button>
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;"><i class="fas fa-file-excel" style="color: #10b981;"></i> XLSX</button>
                        </div>
                    </div>

                    <!-- Report 5 (New) -->
                    <div class="data-card" style="padding:0; display: flex; flex-direction: column;">
                        <div style="padding: 24px; text-align:center; border-bottom: 1px solid var(--slate-100); flex: 1;">
                            <div style="width: 56px; height: 56px; background: #FFF1F2; color: #E11D48; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px;">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div style="font-weight:700; font-size: 16px; margin-bottom:8px; color: var(--slate-900);">HSE & Incident Audit</div>
                            <p style="font-size:12px; color:var(--slate-500); line-height: 1.5;">Health, Safety, and Environment incident summary and compliance audit history.</p>
                        </div>
                        <div style="padding: 12px; background: var(--slate-50); display: flex; gap: 8px; justify-content: center;">
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;"><i class="fas fa-file-pdf" style="color: #ef4444;"></i> PDF</button>
                        </div>
                    </div>

                    <!-- Report 6 (New) -->
                    <div class="data-card" style="padding:0; display: flex; flex-direction: column;">
                        <div style="padding: 24px; text-align:center; border-bottom: 1px solid var(--slate-100); flex: 1;">
                            <div style="width: 56px; height: 56px; background: #F5F3FF; color: #7C3AED; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px;">
                                <i class="fas fa-users-cog"></i>
                            </div>
                            <div style="font-weight:700; font-size: 16px; margin-bottom:8px; color: var(--slate-900);">Labor Productivity</div>
                            <p style="font-size:12px; color:var(--slate-500); line-height: 1.5;">Man-hour analysis, productivity trends, and labor cost per project phase.</p>
                        </div>
                        <div style="padding: 12px; background: var(--slate-50); display: flex; gap: 8px; justify-content: center;">
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;"><i class="fas fa-file-pdf" style="color: #ef4444;"></i> PDF</button>
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;"><i class="fas fa-file-excel" style="color: #10b981;"></i> XLSX</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getAnalyticsView() {
        return `
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
                <!-- Chart 1: Project Budget Breakdown -->
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Budget Utilization by Project</div>
                        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export</button>
                    </div>
                    <div style="padding:24px;">
                        <div class="chart-container">
                            <div class="bar-group">
                                <div class="bar" style="height: 85%; background: var(--emerald);"></div>
                                <div class="bar-label">CEN-01</div>
                            </div>
                             <div class="bar-group">
                                <div class="bar" style="height: 92%; background: var(--orange);"></div>
                                <div class="bar-label">MZ-05</div>
                            </div>
                             <div class="bar-group">
                                <div class="bar" style="height: 105%; background: var(--red);"></div>
                                <div class="bar-label">LIL-02</div>
                            </div>
                             <div class="bar-group">
                                <div class="bar" style="height: 40%; background: var(--blue);"></div>
                                <div class="bar-label">BLK-09</div>
                            </div>
                             <div class="bar-group">
                                <div class="bar" style="height: 10%; background: var(--slate-300);"></div>
                                <div class="bar-label">KAR-11</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chart 2: Expense Categories Donut -->
                <div class="data-card">
                     <div class="data-card-header">
                        <div class="card-title">Expense Categories</div>
                    </div>
                    <div style="padding:24px; display:flex; flex-direction:column; align-items:center;">
                        <div class="donut-chart" style="background: conic-gradient(var(--blue) 0% 45%, var(--emerald) 45% 75%, var(--orange) 75% 90%, var(--slate-300) 90% 100%);">
                            <div class="donut-hole">
                                <div style="font-weight:700; font-size:24px;">100%</div>
                                <div style="font-size:11px; color:var(--slate-500);">Total Spend</div>
                            </div>
                        </div>
                        <div style="margin-top:24px; width:100%;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
                                <span style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:var(--blue); border-radius:2px;"></div> Materials</span>
                                <strong>45%</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
                                <span style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:var(--emerald); border-radius:2px;"></div> Labor</span>
                                <strong>30%</strong>
                            </div>
                             <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
                                <span style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:var(--orange); border-radius:2px;"></div> Logistics</span>
                                <strong>15%</strong>
                            </div>
                             <div style="display:flex; justify-content:space-between; font-size:12px;">
                                <span style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; background:var(--slate-300); border-radius:2px;"></div> Other</span>
                                <strong>10%</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- 8. REVIEWS (LOGS) ---
    getReviewsView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Pending For Review</div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-secondary" onclick="window.toast.show('All items approved', 'success')"><i class="fas fa-check-double"></i> Approve All</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Log ID</th>
                            <th>Project</th>
                            <th>Submitted By</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr onclick="window.drawer.open('Review Daily Log', window.DrawerTemplates.siteLogVerification)">
                            <td><span class="project-id">LOG-2024-889</span></td>
                            <td>CEN-01 Unilia</td>
                            <td>John Banda</td>
                            <td>Oct 24, 2024</td>
                            <td><span style="background:var(--blue-light); color:var(--blue-dark); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">Site Daily</span></td>
                            <td><span class="status pending">Pending</span></td>
                            <td><button class="btn btn-secondary" style="padding:4px 8px;">Review</button></td>
                        </tr>
                        <tr>
                            <td><span class="project-id">INC-2024-002</span></td>
                            <td>MZ-05 Clinic</td>
                            <td>Peter Phiri</td>
                            <td>Oct 23, 2024</td>
                            <td><span style="background:var(--red-light); color:var(--red-dark); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">Incident</span></td>
                            <td><span class="status pending">Escalated</span></td>
                            <td><button class="btn btn-secondary" style="padding:4px 8px;" onclick="window.drawer.open('Incident Report', window.DrawerTemplates.incidentReport)">Review</button></td>
                        </tr>
                        <tr>
                            <td><span class="project-id">REQ-2024-112</span></td>
                            <td>LIL-02 Mall</td>
                            <td>Davi Moyo</td>
                            <td>Oct 22, 2024</td>
                            <td><span style="background:var(--orange-light); color:var(--orange-dark); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">Material</span></td>
                            <td><span class="status pending">Pending</span></td>
                            <td><button class="btn btn-secondary" style="padding:4px 8px;" onclick="window.drawer.open('Requisition Review', window.DrawerTemplates.requisitionReview)">Review</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    initializeProjectMap(retryCount = 0) {
        // Wait for drawer animation and DOM rendering
        setTimeout(() => {
            const mapContainer = document.getElementById('project-map');
            if (!mapContainer) return;

            // Use the isolated Leaflet engine
            const LeafletEngine = window.MKAKA_L || window.L;

            if (!LeafletEngine || typeof LeafletEngine.map !== 'function') {
                if (retryCount < 5) {
                    console.log(`[Map] Leaflet engine (MKAKA_L) not ready (Attempt ${retryCount + 1}), retrying...`);
                    return this.initializeProjectMap(retryCount + 1);
                }
                console.error("Leaflet engine failure.", { 
                    MKAKA_L: !!window.MKAKA_L, 
                    L: !!window.L,
                    hasMap: LeafletEngine ? typeof LeafletEngine.map : 'engine missing'
                });
                mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--red);">Error: Map engine collision or load failure. Please reload.</div>';
                return;
            }

            console.log("[Map] Using isolated Leaflet engine:", LeafletEngine.version);
            // Clear loading state
            mapContainer.innerHTML = '';

            // Default center (Lilongwe, Malawi)
            const defaultCoords = [-13.9626, 33.7741];
            
            try {
                // Initialize map using isolated engine
                const map = LeafletEngine.map('project-map').setView(defaultCoords, 13);

                // Add OpenStreetMap tiles
                LeafletEngine.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(map);

                // Add initial marker
                let marker = LeafletEngine.marker(defaultCoords, {
                    draggable: true
                }).addTo(map);

                // Add Circle for Geofence/Radius
                let circle = LeafletEngine.circle(defaultCoords, {
                    color: 'var(--orange)',
                    fillColor: 'var(--orange)',
                    fillOpacity: 0.15,
                    radius: 500
                }).addTo(map);

                // Add Search Control (Geocoder)
                const geocoder = LeafletEngine.Control.geocoder({
                    defaultMarkGeocode: false,
                    placeholder: "Search for a location...",
                    errorMessage: "Location not found."
                })
                .on('markgeocode', function(e) {
                    const latlng = e.geocode.center;
                    map.setView(latlng, 16);
                    marker.setLatLng(latlng);
                    circle.setLatLng(latlng);
                    this.updateCoords(latlng.lat, latlng.lng);
                }.bind(this))
                .addTo(map);

                // Expose circle and update functions to the instance for radius changes
                this.projectMap = map;
                this.geofenceCircle = circle;
                this.locationMarker = marker;

                // Add CSS overrides for Geocoder within the map container
                const geocoderStyle = document.createElement('style');
                geocoderStyle.innerHTML = `
                    .leaflet-control-geocoder { 
                        box-shadow: var(--shadow-sm) !important; 
                        border-radius: 6px !important; 
                        border: 1px solid var(--slate-200) !important;
                    }
                    .leaflet-control-geocoder-form input { 
                        font-size: 12px !important; 
                        padding: 6px !important; 
                        outline: none !important;
                    }
                    .leaflet-control-geocoder-icon { 
                        width: 30px !important; 
                        height: 30px !important; 
                    }
                `;
                mapContainer.appendChild(geocoderStyle);

                // Handle map click
                map.on('click', (e) => {
                    const { lat, lng } = e.latlng;
                    marker.setLatLng(e.latlng);
                    circle.setLatLng(e.latlng);
                    this.updateCoords(lat, lng);
                });

                // Handle marker drag
                marker.on('dragend', (e) => {
                    const { lat, lng } = marker.getLatLng();
                    circle.setLatLng(marker.getLatLng());
                    this.updateCoords(lat, lng);
                });

                // Force layout recalculation after various delays to ensure visibility
                map.invalidateSize();
                setTimeout(() => map.invalidateSize(), 100);
                setTimeout(() => map.invalidateSize(), 500);
            } catch (e) {
                console.error("Map Init Error:", e);
                mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--red);">Failed to initialize map.</div>';
            }
        }, 500);
    }

    openNewProjectDrawer() {
        window.drawer.open('Initialize New Project', window.DrawerTemplates.newProject);
        this.initializeProjectMap();
        this.fetchSupervisors();
    }

    async fetchSupervisors() {
        console.log('[DEBUG] ProjectManagerDashboard.fetchSupervisors() triggered - v2.1');
        const select = document.getElementById('proj_supervisor');
        if (!select) return;

        try {
            const result = await users.getByRole('Field_Supervisor');
            console.log('[DEBUG] fetchSupervisors result:', result);
            const supervisors = Array.isArray(result) ? result : result.data || [];

            select.innerHTML = '<option value="">Select Supervisor</option>' + 
                supervisors.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            
        } catch (error) {
            console.error('[DEBUG] Error fetching supervisors:', error);
            select.innerHTML = '<option value="">Error loading supervisors</option>';
        }
    }

    updateCoords(lat, lng) {
        const latEl = document.getElementById('proj_lat');
        const lngEl = document.getElementById('proj_lng');
        if (latEl) latEl.textContent = lat.toFixed(6);
        if (lngEl) lngEl.textContent = lng.toFixed(6);
    }

    validateProjectForm() {
        let isValid = true;
        const fields = [
            { id: 'proj_name', label: 'Project Name' },
            { id: 'proj_client', label: 'Client Name' },
            { id: 'proj_type', label: 'Project Type' },
            { id: 'proj_budget', label: 'Budget' },
            { id: 'proj_start', label: 'Start Date' },
            { id: 'proj_end', label: 'End Date' },
            { id: 'proj_supervisor', label: 'Supervisor' }
        ];

        // Reset errors
        fields.forEach(f => {
            const errEl = document.getElementById(`error-${f.id}`);
            if (errEl) {
                errEl.style.display = 'none';
                errEl.textContent = '';
            }
        });
        const globalErr = document.getElementById('project-form-error');
        if (globalErr) globalErr.style.display = 'none';

        // Check required
        fields.forEach(f => {
            const el = document.getElementById(f.id);
            if (!el || !el.value) {
                const errEl = document.getElementById(`error-${f.id}`);
                if (errEl) {
                    errEl.style.display = 'block';
                    errEl.textContent = `${f.label} is required`;
                }
                isValid = false;
            }
        });

        // Date validation
        const start = document.getElementById('proj_start')?.value;
        const end = document.getElementById('proj_end')?.value;
        const today = new Date().toISOString().split('T')[0];

        if (start && start < today) {
            const errEl = document.getElementById('error-proj_start');
            if (errEl) {
                errEl.style.display = 'block';
                errEl.textContent = 'Start date cannot be in the past';
            }
            isValid = false;
        }

        if (start && end && end <= start) {
            const errEl = document.getElementById('error-proj_end');
            if (errEl) {
                errEl.style.display = 'block';
                errEl.textContent = 'End date must be after start date';
            }
            isValid = false;
        }

        return isValid;
    }

    async handleCreateProject() {
        if (!this.validateProjectForm()) return;

        const btn = document.getElementById('btn-create-project');
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing...';

        const data = {
            name: document.getElementById('proj_name').value,
            client: document.getElementById('proj_client').value,
            projectType: document.getElementById('proj_type').value,
            budgetTotal: parseFloat(document.getElementById('proj_budget').value),
            startDate: new Date(document.getElementById('proj_start').value).toISOString(),
            endDate: new Date(document.getElementById('proj_end').value).toISOString(),
            managerId: parseInt(document.getElementById('proj_supervisor').value),
            lat: parseFloat(document.getElementById('proj_lat').textContent),
            lng: parseFloat(document.getElementById('proj_lng').textContent),
            radius: parseInt(document.getElementById('proj_radius_input').value),
            status: 'planning',
            code: 'PROJ-' + Math.random().toString(36).substr(2, 6).toUpperCase()
        };

        try {
            const response = await client.post('/projects', data);

            window.toast.show('Project initialized successfully', 'success');
            window.drawer.close();
            this.loadProjectsFromAPI(); // Refresh the list
            
        } catch (error) {
            console.error('Project creation error:', error);
            const globalErr = document.getElementById('project-form-error');
            if (globalErr) {
                globalErr.style.display = 'block';
                globalErr.textContent = error.message;
            }
            window.toast.show(error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }

    updateMapRadius(radius) {
        if (this.geofenceCircle) {
            this.geofenceCircle.setRadius(parseFloat(radius) || 0);
        }
    }

    // --- 9. ISSUES CENTER ---
    getIssuesView() {
        return `
            <div class="view-content" style="padding: 24px;">
                <div class="data-card shadow-sm" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--slate-200);">
                    <div style="padding: 20px; border-bottom: 1px solid var(--slate-100); display: flex; justify-content: space-between; align-items: center; background: var(--slate-50);">
                        <div>
                            <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--slate-900);">Project Issues & Governance Alerts</h3>
                            <p style="margin: 4px 0 0; font-size: 12px; color: var(--slate-500);">Track reported safety hazards and accountability flags.</p>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary btn-sm"><i class="fas fa-filter"></i> Filter</button>
                            <button class="btn btn-action btn-sm" onclick="window.drawer.open('Log Safety Incident', window.DrawerTemplates.safetyIncident)"><i class="fas fa-plus"></i> Manual Log</button>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Project</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="font-weight: 700;">HSE-004</td>
                                    <td><span class="badge" style="background: var(--orange-light); color: var(--orange-hover); font-size: 10px; padding: 2px 8px; border-radius: 4px;">Safety</span></td>
                                    <td title="Unsafe scaffolding on Block B North face." style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Unsafe scaffolding on Block B North face.</td>
                                    <td>CEN-01 Unilia</td>
                                    <td><span class="status red" style="background: #FEE2E2; color: #991B1B;">High</span></td>
                                    <td><span class="status pending">Open</span></td>
                                    <td><button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Issue Details', window.DrawerTemplates.complaintDetails)">Respond</button></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: 700;">WBS-012</td>
                                    <td><span class="badge" style="background: var(--red-light); color: var(--red); font-size: 10px; padding: 2px 8px; border-radius: 4px;">Governance</span></td>
                                    <td title="Possible material diversion at storage site." style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Possible material diversion at storage site.</td>
                                    <td>Global</td>
                                    <td><span class="status red" style="background: #FEE2E2; color: #991B1B;">Critical</span></td>
                                    <td><span class="status pending" style="background: #FEF3C7; color: #92400E;">Investigating</span></td>
                                    <td><button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Investigation Detail', window.DrawerTemplates.investigation)">Respond</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    getFleetView() {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header"><span class="stat-label">Total Assets</span><i class="fas fa-truck-pickup" style="color: var(--blue);"></i></div>
                    <div class="stat-value">45</div>
                    <div class="stat-sub">Across all sites</div>
                </div>
                <div class="stat-card" style="border-color: var(--orange-light); background: #fffbf7;">
                    <div class="stat-header"><span class="stat-label" style="color: var(--orange);">Pending Requests</span><i class="fas fa-clock" style="color: var(--orange);"></i></div>
                    <div class="stat-value" style="color: var(--orange);">2</div>
                    <div class="stat-sub">Awaiting PM Review</div>
                </div>
            </div>

            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Asset Registry & Procurement</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Add New Asset', window.DrawerTemplates.addNewVehicle)">
                        <i class="fas fa-plus"></i> Manual Add
                    </button>
                </div>
                <div style="padding:0 20px;">
                    <div class="tabs">
                        <div class="tab active">Full Registry</div>
                        <div class="tab">Pending Approvals</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Asset ID</th>
                            <th>Equipment Name</th>
                            <th>Status</th>
                            <th>Current Project</th>
                            <th>Utilization</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="mono-val">EQP-045</span></td>
                            <td><strong>Caterpillar 320D Excavator</strong></td>
                            <td><span class="status active">Active</span></td>
                            <td>CEN-01 Unilia</td>
                            <td>92%</td>
                            <td><button class="btn btn-secondary" onclick="window.drawer.open('Asset Details', window.DrawerTemplates.assetDetails)"><i class="fas fa-eye"></i></button></td>
                        </tr>
                        <tr style="background:var(--blue)05;">
                            <td><span class="status pending" style="background:var(--blue-light); color:var(--blue);">PROC-882</span></td>
                            <td><strong>Toyota Hilux 4x4</strong></td>
                            <td><span class="status pending">PM REVIEW</span></td>
                            <td>-</td>
                            <td>-</td>
                            <td><button class="btn btn-action" onclick="window.drawer.open('Review Request', window.DrawerTemplates.reviewVehicleRequest)">Review</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    calculateDashboardStats(projects) {
        const stats = {
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'active' || p.status === 'planning').length,
            portfolioValue: projects.reduce((sum, p) => sum + (parseFloat(p.contractValue) || 0), 0),
            totalBudget: projects.reduce((sum, p) => sum + (parseFloat(p.budgetTotal) || 0), 0),
            totalSpent: projects.reduce((sum, p) => sum + (parseFloat(p.budgetSpent) || 0), 0),
        };
        
        stats.budgetUtilization = stats.totalBudget > 0 ? (stats.totalSpent / stats.totalBudget) * 100 : 0;
        
        return stats;
    }

    async updateHeaderStats() {
        if (!this.allProjects) return;
        
        const stats = this.calculateDashboardStats(this.allProjects);
        
        // Update Context Strip
        const activeProjectsContext = document.getElementById('context-active-projects');
        if (activeProjectsContext) activeProjectsContext.textContent = stats.activeProjects;
        
        const portfolioValueContext = document.getElementById('context-portfolio-value');
        if (portfolioValueContext) {
            portfolioValueContext.textContent = 'MWK ' + (stats.portfolioValue >= 1000000000 
                ? (stats.portfolioValue / 1000000000).toFixed(1) + 'B' 
                : (stats.portfolioValue / 1000000).toFixed(1) + 'M');
        }

        // Update Stats Grid
        const activeProjectsEl = document.getElementById('stat-active-projects');
        if (activeProjectsEl) activeProjectsEl.textContent = stats.activeProjects;
        
        const portfolioValueEl = document.getElementById('stat-portfolio-value');
        if (portfolioValueEl) {
            portfolioValueEl.textContent = 'MWK ' + (stats.portfolioValue >= 1000000000 
                ? (stats.portfolioValue / 1000000000).toFixed(1) + 'B' 
                : (stats.portfolioValue / 1000000).toFixed(1) + 'M');
        }
        
        const budgetHealthEl = document.getElementById('stat-budget-health');
        if (budgetHealthEl) budgetHealthEl.textContent = stats.budgetUtilization.toFixed(1) + '%';

        // Fetch pending counts
        try {
            const [logsResponse, reqsResponse] = await Promise.all([
                dailyLogs.getAll(),
                requisitions.getPending()
            ]);

            const logs = Array.isArray(logsResponse) ? logsResponse : (logsResponse.data || []);
            const reqs = Array.isArray(reqsResponse) ? reqsResponse : (reqsResponse.data || []);

            const pendingLogsCount = logs.filter(l => l.status === 'pending').length;
            const pendingReqsCount = reqs.length;

            const pendingLogsEl = document.getElementById('context-pending-logs');
            if (pendingLogsEl) pendingLogsEl.textContent = pendingLogsCount;

            // If there's a stat card for pending, update it too
            const pendingReviewsEl = document.getElementById('stat-pending-reviews');
            if (pendingReviewsEl) pendingReviewsEl.textContent = pendingLogsCount + pendingReqsCount;

        } catch (e) {
            console.error('[Dashboard] Error updating pending counts:', e);
        }
    }

    // --- SYSTEM ALIGNMENT HELPERS ---
    renderLoadingState() {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: var(--slate-400);">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 32px; color: var(--orange); margin-bottom: 16px;"></i>
                <div style="font-weight: 600; color: var(--slate-600);">Loading system data...</div>
            </div>
        `;
    }

    renderEmptyState(message = 'No records found') {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: var(--slate-400); text-align: center;">
                <div style="width: 64px; height: 64px; background: var(--slate-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <i class="fas fa-search" style="font-size: 24px; color: var(--slate-400);"></i>
                </div>
                <div style="font-weight: 600; color: var(--slate-700); margin-bottom: 8px;">${message}</div>
                <div style="font-size: 13px; max-width: 300px;">Try adjusting your filters or search terms to find what you're looking for.</div>
                <button class="btn btn-secondary" style="margin-top: 24px;" onclick="window.app.pmModule.currentView='dashboard'; window.app.pmModule.render();">Return to Overview</button>
            </div>
        `;
    }

    initCreateUserForm() {
        setTimeout(() => {
            const form = document.getElementById('newUserForm');
            if (form) {
                const generateBtn = form.querySelector('.btn-generate-pass');
                if (generateBtn) {
                    generateBtn.onclick = () => {
                        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
                        let pass = '';
                        for (let i = 0; i < 12; i++) {
                            pass += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        if (!/[A-Z]/.test(pass)) pass += 'A';
                        if (!/[0-9]/.test(pass)) pass += '1';
                        
                        const passInput = form.querySelector('input[name="password"]');
                        if (passInput) {
                            passInput.value = pass;
                            passInput.type = 'text'; 
                            passInput.dispatchEvent(new Event('input'));
                        }
                    };
                }
            }
        }, 100);
    }

    initEditUserForm(user) {
        setTimeout(() => {
            const form = document.getElementById('editUserForm');
            if (form && user) {
                form.querySelector('[name="id"]').value = user.id;
                form.querySelector('[name="name"]').value = user.name;
                form.querySelector('[name="email"]').value = user.email;
                form.querySelector('[name="role"]').value = user.role.replace(' ', '_');
                if (form.querySelector('[name="phone"]')) form.querySelector('[name="phone"]').value = user.phone || '';
                
                const lockBtn = document.getElementById('btn-deactivate-user');
                const unlockBtn = document.getElementById('btn-unlock-user');
                
                if (lockBtn && unlockBtn) {
                    if (user.isLocked || !user.active) {
                        lockBtn.style.display = 'none';
                        unlockBtn.style.display = 'flex';
                    } else {
                        lockBtn.style.display = 'flex';
                        unlockBtn.style.display = 'none';
                    }
                }
            }
        }, 100);
    }

    // --- USERS MODULE ---
    getUsersView() {
        setTimeout(() => this.loadUsers(), 0);
        
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">User Registry & Permissions</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Add New User', window.DrawerTemplates.newUser); window.app.pmModule.initCreateUserForm();" data-tooltip="Create a new system user"><i class="fas fa-plus"></i> New User</button>
                </div>
                <div id="users-table-container">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }

    async loadUsers() {
        const container = document.getElementById('users-table-container');
        if (!container) return;

        try {
            const response = await users.getAll({ limit: 100 });
            const data = response.data || response; 
            const usersList = Array.isArray(data) ? data : data.users || [];
            
            if (usersList.length === 0) {
                container.innerHTML = this.renderEmptyState('No users found in the system.');
                return;
            }

            container.innerHTML = this.renderUsersTable(usersList);
        } catch (error) {
            console.error('Failed to load users:', error);
            container.innerHTML = `
                <div style="padding: 24px; text-align: center; color: var(--red);">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <div>Failed to load users: ${error.message}</div>
                    <button class="btn btn-secondary" style="margin-top: 16px;" onclick="window.app.pmModule.loadUsers()">Retry</button>
                </div>
            `;
        }
    }

    renderUsersTable(usersList) {
        const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();
        const formatRole = (role) => role.replace(/_/g, ' ');
        
        const rows = usersList.map(user => {
            const isLocked = user.isLocked || !user.active;
            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${isLocked ? 'var(--red-light)' : 'var(--slate-800)'}; color: ${isLocked ? 'var(--red)' : 'white'}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${getInitials(user.name)}</div>
                            <div style="font-weight: 600; ${isLocked ? 'color: var(--slate-400);' : ''}">${user.name}</div>
                        </div>
                    </td>
                    <td>${formatRole(user.role)}</td>
                    <td>${user.email}</td>
                    <td>${user.phone || '-'}</td>
                    <td><span class="status ${isLocked ? 'inactive' : 'active'}">${isLocked ? 'Locked' : 'Active'}</span></td>
                    <td>
                        <div style="display: flex; gap: 4px;">
                            <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; font-weight: 600;" onclick="window.drawer.open('Edit User Details', window.DrawerTemplates.editUser); window.app.pmModule.initEditUserForm(${JSON.stringify(user).replace(/"/g, '&quot;')})" data-tooltip="Manage account details and status">Edit User</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <table>
                <thead>
                    <tr><th>User</th><th>Role</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    // --- AUDIT MODULE ---
    getAuditView() {
        setTimeout(() => this.loadAuditLogs(), 0);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Immutable Audit & Security Log</div>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" class="form-input" placeholder="Search logs..." style="width: 200px; padding: 6px 12px; font-size: 13px;">
                        <button class="btn btn-secondary" data-tooltip="Filter logs by criteria"><i class="fas fa-filter"></i> Filter</button>
                        <button class="btn btn-secondary" onclick="window.app.pmModule.loadAuditLogs()" data-tooltip="Refresh local logs"><i class="fas fa-sync"></i></button>
                    </div>
                </div>
                <div id="audit-table-container">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }

    async loadAuditLogs() {
        const container = document.getElementById('audit-table-container');
        if (!container) return;

        try {
            const response = await audit.getAll({ limit: 50 });
            const data = response.data || response;
            const logs = Array.isArray(data) ? data : data.logs || [];
            
            if (logs.length === 0) {
                container.innerHTML = this.renderEmptyState('No audit logs found matching your criteria.');
                return;
            }

            container.innerHTML = this.renderAuditTable(logs);
        } catch (error) {
             console.error('Failed to load audit logs:', error);
             container.innerHTML = `
                <div style="padding: 24px; text-align: center; color: var(--red);">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <div>Failed to load logs: ${error.message}</div>
                    <button class="btn btn-secondary" style="margin-top: 16px;" onclick="window.app.pmModule.loadAuditLogs()">Retry</button>
                </div>
            `;
        }
    }

    renderAuditTable(logs) {
        const rows = logs.map(log => {
            const severity = log.severity || 'info';
            const sevIcon = severity === 'critical' || severity === 'error' ? 
                '<i class="fas fa-circle-exclamation" style="color: var(--red);" title="Critical"></i>' :
                '<i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i>';
            const statusClass = log.status === 'success' || !log.status ? 'active' : 'rejected';
            
            return `
                <tr>
                    <td style="text-align: center;">${sevIcon}</td>
                    <td style="font-family: 'JetBrains Mono'; font-size: 12px;">${new Date(log.timestamp).toLocaleString()}</td>
                    <td style="font-weight: 600;">${log.userName || 'System'}</td>
                    <td>${log.action}</td>
                    <td>${log.targetType || '-'}${log.targetCode ? ` (${log.targetCode})` : ''}</td>
                    <td style="font-family: 'JetBrains Mono'; font-size: 12px;">${log.ipAddress || 'internal'}</td>
                    <td><span class="status ${statusClass}">${log.status || 'Success'}</span></td>
                </tr>
            `;
        }).join('');

        return `
            <table class="audit-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">Sev.</th>
                        <th>Timestamp</th>
                        <th>User / Actor</th>
                        <th>Event Action</th>
                        <th>Target Resource</th>
                        <th>IP Address</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody style="font-size: 13px;">${rows}</tbody>
            </table>
        `;
    }

    // --- HANDLERS ---
    
    openUserDrawer(userId = null) {
        window.drawer.open(userId ? 'Edit User' : 'Add New User', window.DrawerTemplates.userForm);
        if (userId) {
             users.getById(userId).then(response => {
                 const user = response.data || response;
                 document.getElementById('user_form_id').value = user.id;
                 document.getElementById('user_form_name').value = user.name;
                 document.getElementById('user_form_email').value = user.email;
                 document.getElementById('user_form_role').value = user.role;
             });
        }
    }

    async handleCreateUser(formData) {
        const data = Object.fromEntries(formData.entries());
        try {
            await users.create(data);
            window.toast.show('User account created successfully', 'success');
            window.drawer.close();
            this.loadUsers();
        } catch (error) {
            console.error('Create user error:', error);
            const errEl = document.getElementById('create-user-error');
            if (errEl) {
                errEl.innerText = error.message;
                errEl.style.display = 'block';
            } else {
                window.toast.show(error.message, 'error');
            }
        }
    }

    async handleUpdateUser(formData) {
        const id = formData.get('id');
        const data = Object.fromEntries(formData.entries());
        delete data.id;

        try {
            await users.update(id, data);
            window.toast.show('User details updated', 'success');
            window.drawer.close();
            this.loadUsers();
        } catch (error) {
            console.error('Update user error:', error);
            const errEl = document.getElementById('edit-user-error');
            if (errEl) {
                errEl.innerText = error.message;
                errEl.style.display = 'block';
            } else {
                window.toast.show(error.message, 'error');
            }
        }
    }

    async lockUser(id) {
        const reason = prompt("Reason for account deactivation:");
        if (reason === null) return;
        if (!reason.trim()) {
            window.toast.show("A reason is required to deactivate an account", "error");
            return;
        }

        try {
            await users.lock(id, { reason });
            window.toast.show('User account locked', 'warning');
            window.drawer.close();
            this.loadUsers();
        } catch (error) {
            window.toast.show(error.message, 'error');
        }
    }

    async unlockUser(id) {
        try {
            await users.unlock(id);
            window.toast.show('User account reactivated', 'success');
            window.drawer.close();
            this.loadUsers();
        } catch (error) {
            window.toast.show(error.message, 'error');
        }
    }

    async deleteUser(id) {
        if (!confirm('CRITICAL: This will permanently delete this user account. All audit logs will remain but the user will be purged. Proceed?')) return;
        
        const confirmation = prompt("Type 'PURGE' to confirm permanent deletion:");
        if (confirmation !== 'PURGE') return;

        try {
            await users.remove(id);
            window.toast.show('User purged from system', 'error');
            window.drawer.close();
            this.loadUsers();
        } catch (error) {
            window.toast.show(error.message, 'error');
        }
    }

    // ... Project Handlers ...
    openEditProjectDrawer(id) {
        if(!id) return;
        window.drawer.open('Edit Project', window.DrawerTemplates.editProject);
         projects.getById(id).then(response => {
             const project = response.data || response;
             document.getElementById('edit_proj_id').value = project.id;
             document.getElementById('edit_proj_name').value = project.name;
             document.getElementById('edit_proj_client').value = project.client;
             document.getElementById('edit_proj_status').value = project.status;
             document.getElementById('edit_proj_budget').value = project.budget;
             document.getElementById('edit_proj_start').value = project.startDate ? project.startDate.split('T')[0] : '';
             document.getElementById('edit_proj_end').value = project.endDate ? project.endDate.split('T')[0] : '';
         });
    }

    async handleUpdateProject() {
        const id = document.getElementById('edit_proj_id').value;
        const data = {
             name: document.getElementById('edit_proj_name').value,
             client: document.getElementById('edit_proj_client').value,
             status: document.getElementById('edit_proj_status').value,
             budget: parseFloat(document.getElementById('edit_proj_budget').value),
             startDate: document.getElementById('edit_proj_start').value ? new Date(document.getElementById('edit_proj_start').value) : undefined,
             endDate: document.getElementById('edit_proj_end').value ? new Date(document.getElementById('edit_proj_end').value) : undefined,
        };
        
        try {
            await projects.update(id, data);
            window.toast.show('Project updated', 'success');
            window.drawer.close();
            this.loadProjectsFromAPI(); // Refresh list
        } catch (error) {
             window.toast.show(error.message, 'error');
        }
    }

    openSuspendProjectDrawer(id) {
         window.drawer.open('Suspend Project', window.DrawerTemplates.suspendProject);
         projects.getById(id).then(response => {
              const p = response.data || response;
              document.getElementById('suspend_project_id').value = p.id;
              document.getElementById('suspend_project_name').value = p.name;
         });
    }

    async handleSuspendProject() {
         const id = document.getElementById('suspend_project_id').value;
         const reason = document.getElementById('suspend_project_reason').value;
         
         if (!reason) {
             window.toast.show('Please provide a reason', 'error');
             return;
         }

         try {
             await projects.update(id, { status: 'suspended', suspensionReason: reason });
             window.toast.show('Project suspended', 'warning');
             window.drawer.close();
             this.loadProjectsFromAPI();
         } catch (error) {
             window.toast.show(error.message, 'error');
         }
    }

    async handleDeleteProject(id) {
         const reason = prompt("Enter reason for deletion (This will be logged):");
         if (!reason) return;

         try {
             await projects.remove(id, reason);
             window.toast.show('Project deleted', 'success');
             this.loadProjectsFromAPI();
         } catch (error) {
             window.toast.show(error.message, 'error');
         }
    }
}
