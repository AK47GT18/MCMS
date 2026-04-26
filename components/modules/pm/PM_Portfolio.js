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

export const PM_Portfolio = {
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
	},

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
    },

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
    },

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
                            <a href="#" onclick="event.preventDefault(); window.app.pmModule.openExtendProjectDrawer('${project.id}');" style="color: var(--orange); padding: 12px 16px; text-decoration: none; display: block; font-size: 13px;"><i class="fas fa-calendar-plus" style="width: 20px;"></i> Extend Timeline</a>
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
	},

    openProjectDetailsDrawer(id) {
        if(!id) return;
        window.toast.show('Loading project details...', 'info');
        projects.getById(id).then(response => {
            const project = response.data || response;
            window.drawer.open('Project Details', window.DrawerTemplates.projectDetails(project));
        }).catch(err => {
            window.toast.show('Failed to load project details', 'error');
        });
    },

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
};
