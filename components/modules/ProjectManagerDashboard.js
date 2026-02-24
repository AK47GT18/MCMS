import { StatCard } from '../ui/StatCard.js';
import client from '../../src/api/client.js';
import users from '../../src/api/users.api.js';
import dailyLogs from '../../src/api/dailyLogs.api.js';
import requisitions from '../../src/api/requisitions.api.js';
import projects from '../../src/api/projects.api.js';
import audit from '../../src/api/audit.api.js';
import procurement from '../../src/api/procurement.api.js';
import assets from '../../src/api/assets.api.js';
import issues from '../../src/api/issues.api.js';
import tasks from '../../src/api/tasks.api.js';
import contracts from '../../src/api/contracts.api.js';

export class ProjectManagerDashboard {
    constructor() {
        this.currentView = 'portfolio';
        this.selectedProjectId = null; 
        this.currentGanttViewMode = 'Day'; 
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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
        const stats = this.allProjects ? this.calculateDashboardStats(this.allProjects) : null;
        
        if (this.currentView === 'budget') {
            return `
                <div class="context-strip">
                  <span class="context-value">MWK ${stats ? (stats.totalBudget / 1000000).toFixed(1) + 'M' : '0.0M'}</span> Total Budget
                  <div class="context-dot"></div>
                  <span style="color: ${stats && stats.budgetUtilization > 100 ? 'var(--red)' : 'var(--emerald)'}; font-weight: 600;">${stats ? stats.budgetUtilization.toFixed(1) : '0.0'}% Utilized</span>
                  <div class="context-dot"></div>
                  <span style="color: var(--orange);" id="context-pending-logs">0</span> Pending Logs
                </div>
            `;
        }

        if (this.currentView === 'portfolio' || this.currentView === 'dashboard') {
            return `
                <div class="context-strip">
                  <span class="context-value" id="context-active-projects">${stats ? stats.activeProjects : 0}</span> Active Projects
                  <div class="context-dot"></div>
                  <span class="context-value" id="context-portfolio-value">MWK ${stats ? (stats.portfolioValue / 1000000000).toFixed(1) + 'B' : '0.0B'}</span> Portfolio Value
                  <div class="context-dot"></div>
                  <span style="color: var(--orange); font-weight: 600;"><span id="context-pending-logs">3</span> Pending Logs</span>
                </div>
            `;
        }
        return ''; // Default return if no specific view matches
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
                <div class="filter-group">
                    <select class="form-select" onchange="window.app.pmModule.filterProjectsByStatus(this.value)" style="padding: 8px 12px; border-radius: 6px; border: 1px solid var(--slate-200); background: white; font-size: 14px; cursor: pointer;">
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                        <option value="suspended">Suspended</option>
                        <option value="delayed">Delayed</option>
                    </select>
                </div>
              </div>
            			  <div id="projects-table-container">
				${this.renderLoadingState()}
			  </div>
			</div>`;
	}



    async loadProjectsFromAPI() {
        if (this.isLoadingProjects) return; // Prevent multiple calls
        this.isLoadingProjects = true;

        console.log('[DEBUG] loadProjectsFromAPI triggered');
        const container = document.getElementById('projects-table-container');
        if (!container) {
            this.isLoadingProjects = false;
            return;
        }

        container.innerHTML = this.renderLoadingState(); // Show loading state immediately

        try {
            // Using authenticated client instead of raw fetch
            const result = await client.get('/projects');
            console.log('[DEBUG] Projects fetch successfully:', result);
            
            this.allProjects = Array.isArray(result) ? result : result.data || result.items || [];

            if (this.allProjects.length === 0) {
                container.innerHTML = this.renderEmptyState('No projects found. Create a new project to get started.');
                this.isLoadingProjects = false;
                return;
            }

            // Respect the currently active tab or dropdown filter
            const activeTab = document.querySelector('.tabs .tab.active');
            const activeStatus = activeTab ? activeTab.getAttribute('data-status') : 'active';
            
            const filtered = activeStatus === 'active' 
                ? this.allProjects.filter(p => p.status === 'active' || p.status === 'in_progress')
                : (activeStatus === 'all' ? this.allProjects : this.allProjects.filter(p => p.status === activeStatus));

            container.innerHTML = this.renderProjectsTable(filtered);

            // Set default project for Gantt and context if none selected
            if (!this.selectedProjectId && this.allProjects.length > 0) {
                this.selectedProjectId = this.allProjects[0].id || this.allProjects[0].code;
            }

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
        } finally {
            this.isLoadingProjects = false;
        }
    }

    filterProjectsByStatus(status) {
        if (this.isLoadingProjects) {
            window.toast.show('Please wait, projects are still loading.', 'info');
            return;
        }

        const container = document.getElementById('projects-table-container');
        if (!container) return;

        container.innerHTML = this.renderLoadingState(); // Show loading state while filtering

        // Simulate a slight delay for better UX
        setTimeout(() => {
            const filtered = status === 'all' 
                ? this.allProjects 
                : (status === 'active' 
                    ? this.allProjects.filter(p => p.status === 'active' || p.status === 'in_progress')
                    : this.allProjects.filter(p => p.status === status));
            
            if (filtered.length > 0) {
                container.innerHTML = this.renderProjectsTable(filtered);
            } else {
                container.innerHTML = this.renderEmptyState(`No ${status.replace(/_/g, ' ')} projects found.`);
            }

            // Sync with tabs UI if status exists in tabs
            const tabs = document.querySelectorAll('.tabs .tab');
            tabs.forEach(t => {
                if (t.getAttribute('data-status') === status) {
                    t.parentElement.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                    t.classList.add('active');
                } else if (status === 'all') {
                    // If 'all', we might want to deactivate all tabs or handle it differently
                    t.parentElement.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                }
            });
        }, 100);
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
                <td onclick="window.app.pmModule.openProjectDetailsDrawer('${project.id}')">
                    <span class="mono-val" style="font-weight: 700;">${this.escapeHTML(project.code || 'PRJ-' + project.id)}</span>
                </td>
                <td onclick="window.app.pmModule.openProjectDetailsDrawer('${project.id}')">
                    <div style="font-weight:700; color:var(--slate-800);">${this.escapeHTML(project.name)}</div>
                    <div style="font-size:11px; color:var(--slate-500); margin-top:2px;">${this.escapeHTML(project.client || 'Government of Malawi')}</div>
                </td>
                <td onclick="window.app.pmModule.openProjectDetailsDrawer('${project.id}')">${this.escapeHTML(project.manager?.name || project.managerName || 'Unassigned')}</td>
                <td onclick="window.app.pmModule.openProjectDetailsDrawer('${project.id}')">
                    <div style="width:100%; height:6px; background:var(--slate-100); border-radius:3px; margin-bottom:4px;">
                        <div style="width:${project.progress || 0}%; height:100%; background:var(--orange); border-radius:3px;"></div>
                    </div>
                    <div style="font-size:10px; color:var(--slate-500); font-weight:600;">${project.progress || 0}% Complete</div>
                </td>
                <td onclick="window.app.pmModule.openProjectDetailsDrawer('${project.id}')">
                    <span class="status ${project.budgetUtilization > 100 ? 'delayed' : 'active'}" style="background:${project.budgetUtilization > 100 ? 'var(--red-light)' : 'var(--emerald-light)'}; color:${project.budgetUtilization > 100 ? 'var(--red-dark)' : 'var(--emerald-dark)'};">
                        ${project.budgetUtilization > 100 ? 'Overrun' : 'Good'} (${project.budgetUtilization ?? 0}%)
                    </span>
                </td>
                <td onclick="window.app.pmModule.openProjectDetailsDrawer('${project.id}')"><span class="status ${getStatusClass(project.status)}"><i class="fas ${getStatusIcon(project.status)}"></i> ${formatStatus(project.status)}</span></td>
                <td style="position: relative;">
                    <div class="dropdown" style="position: relative; display: inline-block;">
                        <button class="btn-icon dropdown-trigger" onclick="event.stopPropagation(); window.app.pmModule.toggleDropdown(this)"><i class="fas fa-ellipsis-v"></i></button>
                        <div class="dropdown-content" style="display: none; position: absolute; right: 0; background-color: white; min-width: 160px; box-shadow: var(--shadow-md); z-index: 100; border-radius: 4px; border: 1px solid var(--slate-200);">
                            <a href="#" onclick="event.preventDefault(); window.app.pmModule.openEditProjectDrawer('${project.id}');" style="color: var(--slate-700); padding: 12px 16px; text-decoration: none; display: block; font-size: 13px;"><i class="fas fa-edit" style="width: 20px;"></i> Edit Details</a>
                            <a href="#" onclick="event.preventDefault(); window.app.pmModule.openSuspendProjectDrawer('${project.id}');" style="color: var(--slate-700); padding: 12px 16px; text-decoration: none; display: block; font-size: 13px;"><i class="fas fa-pause-circle" style="width: 20px;"></i> Suspend Project</a>
                            <div style="border-top: 1px solid var(--slate-100); margin: 4px 0;"></div>
                            <a href="#" onclick="event.preventDefault(); window.app.pmModule.handleDeleteProject('${project.id}');" style="color: var(--red); padding: 12px 16px; text-decoration: none; display: block; font-size: 13px;"><i class="fas fa-trash-alt" style="width: 20px;"></i> Delete</a>
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
						<th>Name</th>
						<th>Manager</th>
						<th>Progress</th>
						<th>Budget Health</th>
						<th>Status</th>
						<th style="width: 50px;"></th>
					</tr>
				</thead>
				<tbody>
					${rows}
				</tbody>
			</table>`;
	}

	toggleDropdown(button) {
		const content = button.nextElementSibling;
		const isVisible = content.style.display === 'block';
		
		// Close all first
		document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
		
		if (!isVisible) {
			content.style.display = 'block';
			
			// Handle click outside
			const closeDropdown = (e) => {
				if (!button.contains(e.target) && !content.contains(e.target)) {
					content.style.display = 'none';
					document.removeEventListener('click', closeDropdown);
				}
			};
			
			setTimeout(() => {
				document.addEventListener('click', closeDropdown);
			}, 0);
		}
	}



    openNewProjectDrawer() {
        window.drawer.open('New Project', window.DrawerTemplates.newProject);
    }

    // Consolidated Project Action Handlers
    openProjectDetailsDrawer(id) {
        if(!id) return;
        window.toast.show('Loading project details...', 'info');
        projects.getById(id).then(response => {
            const project = response.data || response;
            window.drawer.open('Project Details', window.DrawerTemplates.projectDetails(project));
        }).catch(err => {
            window.toast.show('Failed to load project details', 'error');
        });
    }

    // openEditProjectDrawer consolidated below in its enhanced version

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

    async renderGanttChart() {
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
        
        // Removed hardcoded projectData mapping

        // Create a basic tasks list for fallback
        let tasksList = [];
        
        try {
            console.log("[Gantt] Starting live render for project:", this.selectedProjectId);
            const el = document.getElementById('gantt');
            if (!el) return;

            // Fetch actual tasks for this project
            const response = await tasks.getByProject(this.selectedProjectId);
            const data = response.data || response;
            tasksList = Array.isArray(data) ? data : data.tasks || [];

            if (tasksList.length === 0) {
                // Fallback to some basic milestones if none found, or show empty
                console.warn("[Gantt] No tasks found for project, using empty state");
                el.innerHTML = this.renderEmptyState('No tasks scheduled for this project yet.');
                return;
            }

            // Map API tasks to Frappe Gantt format
            const mappedTasks = tasksList.map(t => ({
                id: (t.id || t.code).toString(),
                name: t.name,
                start: t.startDate || t.start_date,
                end: t.endDate || t.end_date,
                progress: t.progress || 0,
                dependencies: t.dependencies || ''
            }));

            // Clear and ensure dimensions
            el.innerHTML = '';
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
                    .gantt .grid-header { font-family: 'Inter', sans-serif !important; }
                    .gantt .grid-row { fill: #ffffff !important; }
                    .gantt .row-line { stroke: #f1f5f9 !important; }
                    .gantt .holiday-highlight { fill: #f8fafc !important; }
                    .gantt-container { 
                        border-radius: 8px; 
                        border: 1px solid var(--slate-200); 
                        min-height: 450px !important; 
                        height: auto !important;
                    }
                `;
                document.head.appendChild(style);
            }

            const GanttCls = window.Gantt || window.FrappeGantt;
            if (!GanttCls) {
                el.innerHTML = '<div style="padding:40px; text-align:center; color:#666;"><i class="fas fa-exclamation-circle"></i> Gantt library not loaded</div>';
                return;
            }

            this.ganttInstance = new GanttCls("#gantt", mappedTasks, {
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
                            <div style="font-weight:800; color:var(--slate-900); font-size:14px; margin-bottom:8px;">${this.escapeHTML(task.name)}</div>
                            <div style="font-size:12px; color:var(--slate-600); margin-bottom:12px;">${this.escapeHTML(startStr)} - ${this.escapeHTML(endStr)} (${days} Days)</div>
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
        setTimeout(() => this.loadTransactionsFromAPI(), 0);
        return `
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Transaction Ledger</div>
                        <button class="btn btn-action" onclick="window.drawer.open('New Transaction', window.DrawerTemplates.transactionEntry)"><i class="fas fa-plus"></i> New Entry</button>
                    </div>
                    <div id="transactions-table-container">
                        ${this.renderLoadingState()}
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div class="stat-card" style="background:var(--slate-800); color:white; border:none;">
                        <div class="stat-label" style="color:var(--slate-400);">Total Spend (Active)</div>
                        <div class="stat-value" id="budget-total-spend" style="color:white; font-size:28px;">MWK 0.0M</div>
                        <div class="stat-sub" style="color:var(--emerald);">Project Variance Tracking</div>
                    </div>

                    <div class="fraud-alert-card" style="background:#FEF2F2; border:1px solid #FECACA; padding:16px; border-radius:8px;">
                         <div style="display:flex; gap:10px; margin-bottom:8px;">
                            <i class="fas fa-exclamation-triangle" style="color:var(--red);"></i>
                            <div style="font-weight:700; color:var(--red-dark); font-size:13px;">Budget Alert</div>
                         </div>
                         <div id="budget-alerts-container" style="font-size:12px; color:var(--red-dark); line-height:1.4;">
                            Monitoring material utilization across all sectors.
                         </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadTransactionsFromAPI() {
        const container = document.getElementById('transactions-table-container');
        if (!container) return;

        try {
            const response = await procurement.getAll({ limit: 50 });
            const data = response.data || response;
            const transactions = Array.isArray(data) ? data : data.procurements || [];

            if (transactions.length === 0) {
                container.innerHTML = this.renderEmptyState('No transactions found for this period.');
                return;
            }

            container.innerHTML = this.renderTransactionsTable(transactions);
            this.updateBudgetSummary(transactions);
        } catch (error) {
            console.error('Failed to load transactions:', error);
            container.innerHTML = this.renderEmptyState('Failed to load financial records.');
        }
    }

    renderTransactionsTable(transactions) {
        const rows = transactions.map(trx => `
            <tr>
                <td class="project-id">PROC-${this.escapeHTML(trx.id)}</td>
                <td>${this.escapeHTML(trx.category || 'Materials')}</td>
                <td>${this.escapeHTML(trx.contractorName || trx.contractor?.name || 'Various Contractors')}</td>
                <td style="font-family:'JetBrains Mono'">MWK ${(trx.amount || 0).toLocaleString()}</td>
                <td><span class="status ${trx.status === 'approved' ? 'active' : 'pending'}">${this.escapeHTML(trx.status?.toUpperCase() || 'PENDING')}</span></td>
            </tr>
        `).join('');

        return `
            <table>
                <thead>
                    <tr><th>Ref</th><th>Category</th><th>Contractor</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    updateBudgetSummary(transactions) {
        const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const el = document.getElementById('budget-total-spend');
        if (el) el.textContent = `MWK ${(total / 1000000).toFixed(1)}M`;
    }

    // --- 2.3 FIELD TEAMS (EXECUTION) ---
    getTeamsView() {
        setTimeout(() => this.loadSiteActivityFromAPI(), 0);
        return `
            <div class="data-card">
                 <div class="data-card-header">
                    <div class="card-title">Live Site Activity & Supervisor Status</div>
                    <button class="btn btn-secondary btn-sm" onclick="window.app.pmModule.loadSiteActivityFromAPI()"><i class="fas fa-sync"></i> Refresh Site Data</button>
                </div>
                <div id="site-activity-container" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px; padding:20px;">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }

    async loadSiteActivityFromAPI() {
        const container = document.getElementById('site-activity-container');
        if (!container) return;

        try {
            // Get all projects and their latest logs
            const [projectsResponse, logsResponse] = await Promise.all([
                projects.getAll(),
                dailyLogs.getAll({ limit: 100 })
            ]);

            const projectsList = Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse.data || []);
            const logsList = Array.isArray(logsResponse) ? logsResponse : (logsResponse.data || []);

            if (projectsList.length === 0) {
                container.innerHTML = this.renderEmptyState('No active project sites found.');
                return;
            }

            container.innerHTML = projectsList.map(project => {
                const projectLogs = logsList.filter(l => l.projectId === project.id || l.project_id === project.id);
                const latestLog = projectLogs[0]; // Assuming sorted by date descending from API
                const attendance = latestLog ? (latestLog.attendanceCount || latestLog.attendance || '0') : '--';
                const statusIcon = latestLog ? 'fa-satellite-dish' : 'fa-ellipsis-h';
                const statusClass = latestLog ? 'active' : 'pending';
                const statusLabel = latestLog ? 'Live' : 'Offline';

                return `
                    <div style="border:1px solid var(--slate-200); border-radius:8px; padding:16px; background: white;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                            <div style="font-weight:700;">${this.escapeHTML(project.name)}</div>
                            <span class="status ${statusClass}"><i class="fas ${statusIcon}"></i> ${this.escapeHTML(statusLabel)}</span>
                        </div>
                        <div style="display:flex; gap:12px; margin-bottom:16px;">
                            <div class="profile-avatar" style="width:32px; height:32px; font-size:12px;">${this.escapeHTML((project.manager?.name || 'U').substring(0, 2).toUpperCase())}</div>
                            <div>
                                <div style="font-size:12px; font-weight:600;">${this.escapeHTML(project.manager?.name || 'Unassigned')}</div>
                                <div style="font-size:11px; color:var(--slate-500);">Site Supervisor</div>
                            </div>
                        </div>
                        <div style="background:var(--slate-50); padding:10px; border-radius:6px; font-size:11px; margin-bottom:12px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span>Worker Attendance</span>
                                <strong>${this.escapeHTML(attendance)} Present</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Last Sync</span>
                                <strong>${latestLog ? new Date(latestLog.createdAt || latestLog.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No recent logs'}</strong>
                            </div>
                        </div>
                        <button class="btn btn-secondary" style="width:100%; font-size:11px;" onclick="window.drawer.open('Site Log History', window.DrawerTemplates.siteLogVerification(${JSON.stringify(project).replace(/"/g, '&quot;')}, ${latestLog ? JSON.stringify(latestLog).replace(/"/g, '&quot;') : 'null'}))">View Site Details</button>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Failed to load site activity:', error);
            container.innerHTML = this.renderEmptyState('Failed to connect to field sites.');
        }
    }

    // --- 5. CONTRACTS (DOCUMENTS) ---
    getContractsView() {
        setTimeout(() => this.loadContractsFromAPI(), 0);
        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Contract Registry & Legal Repository</div>
                <button class="btn btn-primary" onclick="window.drawer.open('New Contract', window.DrawerTemplates.newContract)"><i class="fas fa-upload"></i> Upload</button>
              </div>
              <div id="contracts-table-container">
                ${this.renderLoadingState()}
              </div>
            </div>
        `;
    }

    async loadContractsFromAPI() {
        const container = document.getElementById('contracts-table-container');
        if (!container) return;

        try {
            const response = await contracts.getAll({ limit: 50 });
            const data = response.data || response;
            const contractsList = Array.isArray(data) ? data : data.contracts || [];

            if (contractsList.length === 0) {
                container.innerHTML = this.renderEmptyState('No contracts found in the repository.');
                return;
            }

            container.innerHTML = this.renderContractsTable(contractsList);
        } catch (error) {
            console.error('Failed to load contracts:', error);
            container.innerHTML = this.renderEmptyState('Failed to load contract registry.');
        }
    }

    renderContractsTable(contractsList) {
        const rows = contractsList.map(item => `
            <tr>
                <td><span class="project-id">${this.escapeHTML(item.code || 'CNT-' + item.id)}</span></td>
                <td style="font-weight:600;">${this.escapeHTML(item.title)}</td>
                <td><span class="status active" style="background:var(--slate-100); color:var(--slate-600);">${this.escapeHTML((item.type || 'Service').replace(/_/g, ' '))}</span></td>
                <td>v${this.escapeHTML(item.version || '1.0')}</td>
                <td>${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Contract Viewer', 'Loading document viewer...')"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `).join('');

        return `
            <table>
                <thead>
                    <tr><th>Contract ID</th><th>Title</th><th>Type</th><th>Version</th><th>Expiry Date</th><th>Action</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    // --- 7. REPORTS ---
    getReportsView() {
        setTimeout(() => this.loadReportsData(), 0);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Project Reporting Center</div>
                    <div style="display: flex; gap: 12px;">
                        <div style="width: 240px;">
                            <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 6px;">Filter by Project</label>
                            <select id="report-project-filter" class="form-input" style="width: 100%;" onchange="window.app.pmModule.loadReportsData()">
                                <option value="all">All Projects</option>
                                ${this.allProjects ? this.allProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('') : ''}
                            </select>
                        </div>
                        <button class="btn btn-primary" style="height: 38px;" onclick="window.app.pmModule.loadReportsData()"><i class="fas fa-sync"></i> Refresh</button>
                    </div>
                </div>

                <div id="reports-grid-container" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:24px;">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }

    async loadReportsData() {
        const container = document.getElementById('reports-grid-container');
        if (!container) return;

        try {
            // Simulated report categories for now as per design requirements
            const reportTypes = [
                { id: 'status', title: 'Project Status Summary', icon: 'fa-chart-line', bg: 'var(--blue-light)', color: 'var(--blue)', desc: 'Comprehensive timeline adherence, milestone tracking, and risk assessment.' },
                { id: 'finance', title: 'Financial Expenditure', icon: 'fa-coins', bg: 'var(--emerald-light)', color: 'var(--emerald)', desc: 'Real-time budget consumption by contractor, category, and labor cost variance.' },
                { id: 'activity', title: 'Site Activity Log', icon: 'fa-hard-hat', bg: 'var(--orange-light)', color: 'var(--orange)', desc: 'Consolidated daily field reports, site attendance, and equipment usage logs.' },
                { id: 'procurement', title: 'Procurement Tracker', icon: 'fa-truck-loading', bg: '#EEF2FF', color: '#4F46E5', desc: 'Material requisition status, supplier delivery performance, and stock levels.' },
                { id: 'hse', title: 'HSE & Incident Audit', icon: 'fa-shield-alt', bg: '#FFF1F2', color: '#E11D48', desc: 'Health, Safety, and Environment incident summary and compliance audit history.' },
                { id: 'labor', title: 'Labor Productivity', icon: 'fa-users-cog', bg: '#F5F3FF', color: '#7C3AED', desc: 'Man-hour analysis, productivity trends, and labor cost per project phase.' }
            ];

            container.innerHTML = reportTypes.map(report => `
                <div class="data-card" style="padding:0; display: flex; flex-direction: column;">
                    <div style="padding: 24px; text-align:center; border-bottom: 1px solid var(--slate-100); flex: 1;">
                        <div style="width: 56px; height: 56px; background: ${report.bg}; color: ${report.color}; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px;">
                            <i class="fas ${report.icon}"></i>
                        </div>
                        <div style="font-weight:700; font-size: 16px; margin-bottom:8px; color: var(--slate-900);">${report.title}</div>
                        <p style="font-size:12px; color:var(--slate-500); line-height: 1.5;">${report.desc}</p>
                    </div>
                    <div style="padding: 12px; background: var(--slate-50); display: flex; gap: 8px; justify-content: center;">
                        <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;" onclick="window.toast.show('Generating PDF...', 'info')"><i class="fas fa-file-pdf" style="color: #ef4444;"></i> PDF</button>
                        <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;" onclick="window.toast.show('Generating Excel...', 'info')"><i class="fas fa-file-excel" style="color: #10b981;"></i> XLSX</button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load reports:', error);
            container.innerHTML = this.renderEmptyState('Failed to load reporting modules.');
        }
    }

    getAnalyticsView() {
        setTimeout(() => this.loadInventoryData(), 0);
        const stats = this.calculateDashboardStats(this.allProjects || []);
        const projectBars = (this.allProjects || []).slice(0, 4).map(p => {
            const utilization = p.budgetTotal > 0 ? (p.budgetSpent / p.budgetTotal) * 100 : 0;
            const color = utilization > 100 ? 'var(--red)' : utilization > 80 ? 'var(--orange)' : 'var(--emerald)';
            return `
                <div class="bar-group">
                    <div class="bar" style="height: ${Math.min(utilization, 100)}%; background: ${color};" title="${p.name}: ${utilization.toFixed(1)}%"></div>
                    <div class="bar-label">${p.code || p.id}</div>
                </div>
            `;
        }).join('');

        return `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:24px;">
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Budget Utilization by Project (%)</div>
                        <button class="btn btn-secondary" onclick="window.app.pmModule.loadProjectsFromAPI()"><i class="fas fa-sync"></i></button>
                    </div>
                    <div style="padding:24px;">
                        <div class="chart-container">
                            ${projectBars || '<div style="height:200px; display:flex; align-items:center; color:var(--slate-400);">No project data available</div>'}
                        </div>
                    </div>
                </div>

                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Portfolio Distribution</div>
                        <div style="font-size:11px; color:var(--slate-500);">Value by Project Status</div>
                    </div>
                    <div style="padding:24px; display:flex; align-items:center; justify-content:center; height:240px;">
                        <div style="position:relative; width:160px; height:160px; border-radius:50%; background:conic-gradient(var(--emerald) 0% 45%, var(--orange) 45% 75%, var(--blue) 75% 100%);">
                            <div style="position:absolute; inset:30px; background:white; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                                <div style="font-weight:800; font-size:18px;">MWK ${(stats.portfolioValue / 1e9).toFixed(1)}B</div>
                                <div style="font-size:10px; color:var(--slate-500);">Portfolio</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="data-card">
                 <div class="data-card-header">
                    <div class="card-title">Critical Inventory & Assets</div>
                    <button class="btn btn-secondary" onclick="window.app.pmModule.loadInventoryData()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                <div id="inventory-table-container">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }

    async loadInventoryData() {
        const container = document.getElementById('inventory-table-container');
        if (!container) return;

        try {
            // Fetch assets/inventory from API
            const result = await assets.getAll({ limit: 10 });
            const data = result.data || result;
            const items = Array.isArray(data) ? data : data.assets || [];

            if (items.length === 0) {
                container.innerHTML = this.renderEmptyState('No inventory data tracked at this level.');
                return;
            }

            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Asset / Resource</th>
                            <th>Status</th>
                            <th>Current Location</th>
                            <th>Health</th>
                            <th>Last Activity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td style="font-weight:600;">${this.escapeHTML(item.name)}</td>
                                <td><span class="status ${item.status === 'active' ? 'active' : 'pending'}">${this.escapeHTML(item.status)}</span></td>
                                <td>${this.escapeHTML(item.location || 'Central Store')}</td>
                                <td>
                                    <div style="width:100px; height:6px; background:var(--slate-100); border-radius:3px;">
                                        <div style="width:${item.health || 100}%; height:100%; background:var(--emerald); border-radius:3px;"></div>
                                    </div>
                                </td>
                                <td>${item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Never'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Inventory load error:', error);
            container.innerHTML = this.renderEmptyState('Failed to load real-time inventory.');
        }
    }

    // --- 8. REVIEWS (LOGS) ---
    getReviewsView() {
        setTimeout(() => this.loadReviewsData(), 0);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Pending For Review</div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.app.pmModule.loadReviewsData()"><i class="fas fa-sync"></i> Refresh</button>
                    </div>
                </div>
                <div id="reviews-table-container">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }

    async loadReviewsData() {
        const container = document.getElementById('reviews-table-container');
        if (!container) return;

        try {
            const [logsResponse, reqsResponse] = await Promise.all([
                dailyLogs.getAll({ status: 'pending' }),
                requisitions.getPending()
            ]);

            const logs = Array.isArray(logsResponse) ? logsResponse : (logsResponse.data || []);
            const reqs = Array.isArray(reqsResponse) ? reqsResponse : (reqsResponse.data || []);

            if (logs.length === 0 && reqs.length === 0) {
                container.innerHTML = this.renderEmptyState('No pending reviews found.');
                return;
            }

            container.innerHTML = this.renderReviewsTable(logs, reqs);
        } catch (error) {
            console.error('Failed to load reviews:', error);
            container.innerHTML = this.renderEmptyState('Failed to load pending reviews.');
        }
    }

    renderReviewsTable(logs, reqs) {
        const logRows = logs.map(log => {
            const project = this.allProjects?.find(p => p.id === (log.projectId || log.project_id)) || {};
            return `
                <tr onclick="window.drawer.open('Review Daily Log', window.DrawerTemplates.siteLogVerification(${JSON.stringify(project).replace(/"/g, '&quot;')}, ${JSON.stringify(log).replace(/"/g, '&quot;')}))">
                    <td><span class="project-id">LOG-${this.escapeHTML(log.id)}</span></td>
                    <td>${this.escapeHTML(log.projectName || project.name || 'Central Site')}</td>
                    <td>${this.escapeHTML(log.supervisorName || log.created_by || 'Field Supervisor')}</td>
                    <td>${new Date(log.date || log.createdAt).toLocaleDateString()}</td>
                    <td><span style="background:var(--blue-light); color:var(--blue-dark); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">Site Daily</span></td>
                    <td><span class="status pending">Pending</span></td>
                    <td><button class="btn btn-secondary" style="padding:4px 8px;">Review</button></td>
                </tr>
            `;
        }).join('');

        const reqRows = reqs.map(req => {
            const project = this.allProjects?.find(p => p.id === (req.projectId || req.project_id)) || {};
            return `
                <tr onclick="window.drawer.open('Requisition Review', window.DrawerTemplates.requisitionReview(${JSON.stringify(project).replace(/"/g, '&quot;')}, ${JSON.stringify(req).replace(/"/g, '&quot;')}))">
                    <td><span class="project-id">REQ-${this.escapeHTML(req.id)}</span></td>
                    <td>${this.escapeHTML(req.projectName || project.name || 'Active Project')}</td>
                    <td>${this.escapeHTML(req.requesterName || 'Admin')}</td>
                    <td>${new Date(req.createdAt).toLocaleDateString()}</td>
                    <td><span style="background:var(--orange-light); color:var(--orange-dark); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">Requisition</span></td>
                    <td><span class="status pending">Pending</span></td>
                    <td><button class="btn btn-action" style="padding:4px 8px;">Review</button></td>
                </tr>
            `;
        }).join('');

        return `
            <table>
                <thead>
                    <tr>
                        <th>Item ID</th>
                        <th>Project</th>
                        <th>Submitted By</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${logRows}
                    ${reqRows}
                </tbody>
            </table>
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
        setTimeout(() => this.loadIssuesFromAPI(), 0);
        return `
            <div class="view-content" style="padding: 24px;">
                <div class="data-card shadow-sm" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--slate-200);">
                    <div style="padding: 20px; border-bottom: 1px solid var(--slate-100); display: flex; justify-content: space-between; align-items: center; background: var(--slate-50);">
                        <div>
                            <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--slate-900);">Project Issues & Governance Alerts</h3>
                            <p style="margin: 4px 0 0; font-size: 12px; color: var(--slate-500);">Track reported safety hazards and accountability flags.</p>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary btn-sm" onclick="window.app.pmModule.loadIssuesFromAPI()"><i class="fas fa-sync"></i> Refresh</button>
                            <button class="btn btn-action btn-sm" onclick="window.drawer.open('Log Complaint', window.DrawerTemplates.submitComplaint)"><i class="fas fa-plus"></i> Log Issue</button>
                        </div>
                    </div>
                    
                    <div id="issues-table-container" class="table-responsive">
                        ${this.renderLoadingState()}
                    </div>
                </div>
            </div>
        `;
    }

    async loadIssuesFromAPI() {
        const container = document.getElementById('issues-table-container');
        if (!container) return;

        try {
            const response = await issues.getAll({ limit: 50 });
            const data = response.data || response;
            const issuesList = Array.isArray(data) ? data : data.issues || [];

            if (issuesList.length === 0) {
                container.innerHTML = this.renderEmptyState('No active issues or governance alerts.');
                return;
            }

            container.innerHTML = this.renderIssuesTable(issuesList);
        } catch (error) {
            console.error('Failed to load issues:', error);
            container.innerHTML = this.renderEmptyState('Failed to load issues registry.');
        }
    }

    renderIssuesTable(issuesList) {
        const rows = issuesList.map(item => `
            <tr>
                <td style="font-weight: 700;">ISS-${this.escapeHTML(item.id)}</td>
                <td><span class="badge" style="background: var(--orange-light); color: var(--orange-hover); font-size: 10px; padding: 2px 8px; border-radius: 4px;">${this.escapeHTML(item.category || 'Site')}</span></td>
                <td title="${this.escapeHTML(item.description)}" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHTML(item.description)}</td>
                <td>${this.escapeHTML(item.projectName || item.project?.name || 'Central')}</td>
                <td><span class="status ${item.priority === 'high' ? 'red' : 'active'}" style="background: ${item.priority === 'high' ? '#FEE2E2' : '#F0F9FF'}; color: ${item.priority === 'high' ? '#991B1B' : '#075985'};">${this.escapeHTML(item.priority?.toUpperCase() || 'NORMAL')}</span></td>
                <td><span class="status ${item.status === 'open' ? 'pending' : 'active'}">${this.escapeHTML(item.status?.toUpperCase() || 'OPEN')}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Issue Details', window.DrawerTemplates.complaintDetails(${JSON.stringify(item).replace(/"/g, '&quot;')})); window.app.pmModule.initIssueResolutionForm(${JSON.stringify(item).replace(/"/g, '&quot;')})">Respond</button>
                </td>
            </tr>
        `).join('');

        return `
            <table class="data-table">
                <thead>
                    <tr><th>ID</th><th>Type</th><th>Description</th><th>Project</th><th>Priority</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    getFleetView() {
        setTimeout(() => this.loadAssetsFromAPI(), 0);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Fleet & Heavy Equipment Registry</div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Vehicle Requests', 'Reviewing pending requests...')"><i class="fas fa-list-check"></i> Requests</button>
                        <button class="btn btn-action btn-sm" onclick="window.drawer.open('Add Equipment', window.DrawerTemplates.addNewVehicle)"><i class="fas fa-plus"></i> Register Asset</button>
                    </div>
                </div>
                <div id="assets-table-container">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }

    async loadAssetsFromAPI() {
        const container = document.getElementById('assets-table-container');
        if (!container) return;

        try {
            const response = await assets.getAll({ limit: 100 });
            const data = response.data || response;
            const assetList = Array.isArray(data) ? data : data.assets || [];

            if (assetList.length === 0) {
                container.innerHTML = this.renderEmptyState('No heavy equipment or vehicles registered.');
                return;
            }

            container.innerHTML = this.renderAssetsTable(assetList);
        } catch (error) {
            console.error('Failed to load assets:', error);
            container.innerHTML = this.renderEmptyState('Failed to load asset registry.');
        }
    }

    renderAssetsTable(assetList) {
        const rows = assetList.map(asset => `
            <tr>
                <td class="project-id">${this.escapeHTML(asset.plateNumber || 'TOW-' + asset.id)}</td>
                <td style="font-weight:600;">${this.escapeHTML(asset.name)}</td>
                <td><span class="status active" style="background:var(--slate-100); color:var(--slate-600);">${this.escapeHTML((asset.type || 'Plant').replace(/_/g, ' '))}</span></td>
                <td>${this.escapeHTML(asset.location || 'Central Depot')}</td>
                <td><span class="status ${asset.status === 'active' ? 'active' : 'delayed'}">${this.escapeHTML(asset.status?.toUpperCase() || 'ACTIVE')}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Complete Maintenance', window.DrawerTemplates.completeMaintenance('${asset.id}'))">Maint.</button>
                </td>
            </tr>
        `).join('');

        return `
            <table>
                <thead>
                    <tr><th>Asset ID</th><th>Description</th><th>Category</th><th>Current Assignment</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
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

             // Sync with Sidebar Badge
             const sidebarBadge = document.querySelector('.nav-link[data-id="reviews"] .nav-badge');
             if (sidebarBadge) {
                 sidebarBadge.textContent = pendingLogsCount + pendingReqsCount;
                 sidebarBadge.style.display = (pendingLogsCount + pendingReqsCount) > 0 ? 'block' : 'none';
             }

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
                <div class="data-card-header" style="justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                    <div class="card-title">User Registry & Permissions</div>
                    <div style="display: flex; gap: 8px; flex-grow: 1; max-width: 600px;">
                        <div style="position: relative; flex-grow: 1;">
                            <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--slate-400); font-size: 13px;"></i>
                            <input type="text" id="user-search-filter" class="form-input" placeholder="Search name or email..." style="width: 100%; padding-left: 32px;" onkeyup="if(event.key === 'Enter') window.app.pmModule.loadUsers()">
                        </div>
                        <select id="user-role-filter" class="form-input" style="width: 160px;" onchange="window.app.pmModule.loadUsers()">
                            <option value="">All Roles</option>
                            <option value="Project_Manager">Project Manager</option>
                            <option value="Finance_Director">Finance Director</option>
                            <option value="Operations_Manager">Operations Manager</option>
                            <option value="Field_Supervisor">Field Supervisor</option>
                            <option value="Contract_Administrator">Contract Administrator</option>
                            <option value="Equipment_Coordinator">Equipment Coordinator</option>
                            <option value="Managing_Director">Managing Director</option>
                            <option value="System_Technician">System Technician</option>
                        </select>
                        <select id="user-status-filter" class="form-input" style="width: 140px;" onchange="window.app.pmModule.loadUsers()">
                            <option value="">All Statuses</option>
                            <option value="false">Active Only</option>
                            <option value="true">Locked Only</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Add New User', window.DrawerTemplates.newUser); window.app.pmModule.initCreateUserForm();" data-tooltip="Create a new system user"><i class="fas fa-plus"></i> New User</button>
                </div>
                <div id="users-table-container">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }

    initEditUserForm(user) {
        setTimeout(() => {
            const idEl = document.getElementById('edit-user-id');
            const nameEl = document.getElementById('edit-user-name');
            const emailEl = document.getElementById('edit-user-email');
            const roleEl = document.getElementById('edit-user-role');
            const passwordEl = document.getElementById('edit-user-password');
            const statusActions = document.getElementById('edit-user-status-actions');
            const btnLock = document.getElementById('btn-deactivate-user');
            const btnUnlock = document.getElementById('btn-unlock-user');

            if (idEl) idEl.value = user.id;
            if (nameEl) nameEl.value = user.name;
            if (emailEl) emailEl.value = user.email;
            if (roleEl) roleEl.value = user.role;
            if (passwordEl) passwordEl.value = '';

            if (statusActions) {
                const isLocked = user.isLocked;
                if (btnLock) btnLock.style.display = isLocked ? 'none' : 'flex';
                if (btnUnlock) btnUnlock.style.display = isLocked ? 'flex' : 'none';
            }
        }, 100);
    }

    async loadUsers() {
        const container = document.getElementById('users-table-container');
        if (!container) return;

        try {
            const search = document.getElementById('user-search-filter')?.value;
            const role = document.getElementById('user-role-filter')?.value;
            const status = document.getElementById('user-status-filter')?.value;

            const params = { limit: 100 };
            if (search) params.search = search;
            if (role) params.role = role;
            if (status !== "" && status !== undefined) params.isLocked = status;

            const response = await users.getAll(params);
            const data = response.data || response; 
            const usersList = Array.isArray(data) ? data : data.users || [];
            
            if (usersList.length === 0) {
                container.innerHTML = this.renderEmptyState('No users found matching your criteria.');
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
            const isLocked = user.isLocked;
            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${isLocked ? 'var(--red-light)' : 'var(--slate-800)'}; color: ${isLocked ? 'var(--red)' : 'white'}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${this.escapeHTML(getInitials(user.name))}</div>
                            <div style="font-weight: 600; ${isLocked ? 'color: var(--slate-400);' : ''}">${this.escapeHTML(user.name)}</div>
                        </div>
                    </td>
                    <td>${this.escapeHTML(formatRole(user.role))}</td>
                    <td>${this.escapeHTML(user.email)}</td>
                    <td>${this.escapeHTML(user.phone || '-')}</td>
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
                        <div style="position: relative;">
                            <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--slate-400); font-size: 12px;"></i>
                            <input type="text" id="audit-search" class="form-input" placeholder="Search actor or action..." style="width: 220px; padding: 6px 12px 6px 30px; font-size: 13px;" onkeyup="if(event.key === 'Enter') window.app.pmModule.loadAuditLogs()">
                        </div>
                        <select id="audit-severity-filter" class="form-input" style="width: 120px; padding: 4px 8px; font-size: 13px;" onchange="window.app.pmModule.loadAuditLogs()">
                            <option value="all">All Levels</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error / Critical</option>
                        </select>
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

        const search = document.getElementById('audit-search')?.value;
        const severity = document.getElementById('audit-severity-filter')?.value;

        try {
            const params = { limit: 100 };
            if (search) params.search = search;
            if (severity && severity !== 'all') params.severity = severity;

            const response = await audit.getAll(params);
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

    // --- USERS MODULE (HANDLERS) ---
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

    // --- PROJECT HANDLERS ---
    openEditProjectDrawer(id) {
        if(!id) return;
        window.drawer.open('Edit Project Details', window.DrawerTemplates.editProject);
         projects.getById(id).then(response => {
             const project = response.data || response;
             
             const setVal = (id, val) => {
                 const el = document.getElementById(id);
                 if (el) el.value = val !== undefined && val !== null ? val : '';
             };

             setVal('edit_proj_id', project.id);
             setVal('edit_proj_name', project.name);
             setVal('edit_proj_client', project.client);
             setVal('edit_proj_status', project.status);
             setVal('edit_proj_budget', project.budgetTotal || project.budget);
             setVal('edit_proj_start', project.startDate ? project.startDate.split('T')[0] : '');
             setVal('edit_proj_end', project.endDate ? project.endDate.split('T')[0] : '');
             
             const latEl = document.getElementById('edit_proj_lat');
             const lngEl = document.getElementById('edit_proj_lng');
             if (latEl) latEl.textContent = (project.lat || -13.9626).toFixed(6);
             if (lngEl) lngEl.textContent = (project.lng || 33.7741).toFixed(6);

             this.fetchSupervisors('edit_proj_supervisor').then(() => {
                 setVal('edit_proj_supervisor', project.managerId || project.manager_id);
             });

             this.initializeProjectMap(0, 'edit-project-map', {
                 lat: project.lat || -13.9626,
                 lng: project.lng || 33.7741,
                 radius: project.radius || 500
             });
         });
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

    // --- REVIEW & APPROVAL HANDLERS ---
    async handleApproveLog(id) {
        try {
            window.toast.show('Processing approval...', 'info');
            await dailyLogs.approve(id);
            window.toast.show('Log approved and Schedule updated', 'success');
            window.drawer.close();
            this.updateHeaderStats();
            this.render(); 
        } catch (error) {
            console.error('Log approval failed:', error);
            window.toast.show(error.message || 'Failed to approve log', 'error');
        }
    }

    async handleRejectLog(id, reason) {
        try {
            if (!reason) {
                window.toast.show('Reason for rejection is required', 'error');
                return;
            }
            window.toast.show('Processing rejection...', 'info');
            await dailyLogs.update(id, { status: 'rejected', rejectionReason: reason });
            window.toast.show('Log rejected successfully', 'warning');
            window.drawer.close();
            this.render();
        } catch (error) {
            console.error('Log rejection failed:', error);
            window.toast.show(error.message || 'Failed to reject log', 'error');
        }
    }

    async handleApproveRequisition(id) {
        try {
            window.toast.show('Approving requisition...', 'info');
            await requisitions.approve(id);
            window.toast.show(`Requisition ${id} approved`, 'success');
            window.drawer.close();
            this.render();
        } catch (error) {
            console.error('Requisition approval failed:', error);
            window.toast.show(error.message || 'Failed to approve requisition', 'error');
        }
    }

    async handleRejectRequisition(id, reason) {
        try {
            if (!reason) {
                window.toast.show('Please provide a reason for rejection', 'error');
                return;
            }
            window.toast.show('Rejecting requisition...', 'info');
            await requisitions.reject(id, reason);
            window.toast.show(`Requisition ${id} rejected`, 'warning');
            window.drawer.close();
            this.render();
        } catch (error) {
            console.error('Requisition rejection failed:', error);
            window.toast.show(error.message || 'Failed to reject requisition', 'error');
        }
    }

    // --- FEATURE SPECIFIC HANDLERS ---
    async handleIssueSubmit() {
        try {
            const category = document.getElementById('issue-category').value;
            const priority = document.getElementById('issue-priority').value;
            const description = document.getElementById('issue-description').value;

            if (!description) {
                window.toast.show('Please provide a description', 'error');
                return;
            }

            window.toast.show('Submitting issue report...', 'info');
            await issues.create({
                projectId: this.selectedProjectId,
                category,
                priority,
                description,
                status: 'open'
            });

            window.toast.show('Issue report submitted successfully', 'success');
            window.drawer.close();
            if (this.currentView === 'issues') this.loadIssuesFromAPI();
        } catch (error) {
            console.error('Issue submission error:', error);
            window.toast.show('Failed to submit issue: ' + error.message, 'error');
        }
    }

    async handleAddTask() {
        try {
            const name = document.getElementById('task-name').value;
            const startDate = document.getElementById('task-start').value;
            const endDate = document.getElementById('task-end').value;
            const dependencies = document.getElementById('task-dependencies')?.value || '';

            if (!name || !startDate || !endDate) {
                window.toast.show('Task name and dates are required', 'error');
                return;
            }

            window.toast.show('Creating task...', 'info');
            await tasks.create({
                projectId: this.selectedProjectId,
                name,
                startDate,
                endDate,
                dependencies,
                progress: 0
            });

            window.toast.show('Task created successfully', 'success');
            window.drawer.close();
            if (this.currentView === 'gantt' || this.currentView === 'execution') this.renderGanttChart();
        } catch (error) {
            console.error('Task creation error:', error);
            window.toast.show('Failed to create task: ' + error.message, 'error');
        }
    }

    async handleResolveIssue(id) {
        try {
            const status = document.getElementById('resolution-status').value;
            const notes = document.getElementById('resolution-notes').value;

            if (!notes) {
                window.toast.show('Resolution notes required', 'error');
                return;
            }

            window.toast.show('Updating issue status...', 'info');
            await issues.update(id, {
                status,
                resolutionNotes: notes,
                resolvedAt: status === 'resolved' ? new Date().toISOString() : null
            });

            window.toast.show('Issue updated successfully', 'success');
            window.drawer.close();
            if (this.currentView === 'issues') this.loadIssuesFromAPI();
        } catch (error) {
            console.error('Issue resolution error:', error);
            window.toast.show('Failed to update issue: ' + error.message, 'error');
        }
    }

    initIssueResolutionForm(issue) {
        setTimeout(() => {
            const notesEl = document.getElementById('resolution-notes');
            if (notesEl && issue.resolutionNotes) notesEl.value = issue.resolutionNotes;
            const statusEl = document.getElementById('resolution-status');
            if (statusEl && issue.status) statusEl.value = issue.status === 'open' ? 'in_progress' : issue.status;
        }, 100);
    }

    async handleAddVehicle() {
        try {
            const name = document.getElementById('vehicle-name').value;
            const plate = document.getElementById('vehicle-plate').value;
            const type = document.getElementById('vehicle-type').value;

            if (!name || !plate) {
                window.toast.show('Please fill name and plate', 'error');
                return;
            }

            window.toast.show('Registering asset...', 'info');
            await assets.create({ name, plateNumber: plate, type, status: 'active', condition: 'good' });
            window.toast.show('Asset registered successfully', 'success');
            window.drawer.close();
            if (this.currentView === 'fleet') this.loadAssetsFromAPI();
        } catch (error) {
            console.error('Asset registration error:', error);
            window.toast.show('Failed to register asset: ' + error.message, 'error');
        }
    }

    async handleReviewVehicle(id, action) {
        try {
            window.toast.show(`Processing vehicle ${action}...`, 'info');
            await assets.update(id, { status: action === 'approved' ? 'active' : 'rejected' });
            window.toast.show(`Vehicle request ${action}`, 'success');
            window.drawer.close();
            if (this.currentView === 'fleet') this.loadAssetsFromAPI();
        } catch (error) {
            console.error('Vehicle review error:', error);
            window.toast.show('Failed to process vehicle request', 'error');
        }
    }

    async handleCompleteMaintenance(assetId) {
        try {
            const summary = document.getElementById('maint-summary').value;
            const cost = document.getElementById('maint-cost').value;

            if (!summary) {
                window.toast.show('Please provide maintenance summary', 'error');
                return;
            }

            window.toast.show('Logging maintenance...', 'info');
            await assets.update(assetId, {
                lastMaintenance: new Date().toISOString(),
                maintenanceSummary: summary,
                maintenanceCost: parseFloat(cost) || 0,
                status: 'active'
            });

            window.toast.show(`Maintenance logged for asset ${assetId}`, 'success');
            window.drawer.close();
            if (this.currentView === 'fleet') this.loadAssetsFromAPI();
        } catch (error) {
            console.error('Maintenance log error:', error);
            window.toast.show('Failed to log maintenance', 'error');
        }
    }

    async handleTransactionSubmit() {
        try {
            const category = document.getElementById('trx-category').value;
            const amount = document.getElementById('trx-amount').value;
            const contractor = document.getElementById('trx-contractor').value;
            const description = document.getElementById('trx-description').value;

            if (!amount || !contractor) {
                window.toast.show('Please fill all required fields', 'error');
                return;
            }

            window.toast.show('Processing transaction...', 'info');
            await procurement.create({
                category,
                amount: parseFloat(amount),
                vendorName: contractor,
                projectId: this.selectedProjectId,
                status: 'pending'
            });

            window.toast.show('Transaction processed and awaiting approval', 'success');
            window.drawer.close();
            if (this.currentView === 'budget') this.loadTransactionsFromAPI();
        } catch (error) {
            console.error('Transaction error:', error);
            window.toast.show('Failed to process transaction: ' + error.message, 'error');
        }
    }

    async handleRequestFunds() {
        try {
            const amount = document.getElementById('fund-amount').value;
            const purpose = document.getElementById('fund-purpose').value;
            
            if (!amount || !purpose) {
                window.toast.show('Amount and purpose are required', 'error');
                return;
            }

            window.toast.show('Submitting fund request...', 'info');
            await requisitions.create({
                projectId: this.selectedProjectId,
                amount: parseFloat(amount),
                purpose: purpose,
                status: 'pending'
            });

            window.toast.show('Funding request submitted to Commissioner', 'success');
            window.drawer.close();
            if (this.currentView === 'budget' || this.currentView === 'reviews') this.render();
        } catch (error) {
            console.error('Fund request error:', error);
            window.toast.show('Failed to request funds', 'error');
        }
    }

    async handleContractUpload() {
        try {
            const title = document.getElementById('cnt-title').value;
            const type = document.getElementById('cnt-type').value;
            const expiry = document.getElementById('cnt-expiry').value;

            if (!title || !expiry) {
                window.toast.show('Contract title and expiry are required', 'error');
                return;
            }

            window.toast.show('Uploading contract document...', 'info');
            await contracts.create({ title, type, expiryDate: expiry, status: 'active' });
            window.toast.show('Contract registered in legal repository', 'success');
            window.drawer.close();
            if (this.currentView === 'contracts') this.loadContractsFromAPI();
        } catch (error) {
            console.error('Contract upload error:', error);
            window.toast.show('Failed to upload contract', 'error');
        }
    }

    async handleDailyLogSubmit() {
        try {
            window.toast.show('Uploading site log...', 'info');
            await dailyLogs.create({
                projectId: this.selectedProjectId,
                date: new Date().toISOString().split('T')[0],
                narrative: document.getElementById('log-narrative')?.value || 'Daily Progress',
                status: 'submitted'
            });
            window.toast.show('Daily progress logged successfully', 'success');
            window.drawer.close();
            this.render(); 
        } catch (error) {
            console.error('Log submission error:', error);
            window.toast.show('Failed to submit log', 'error');
        }
    }
}

