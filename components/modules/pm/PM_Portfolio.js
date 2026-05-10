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
            <div class="data-card">
                <div class="data-card-header" style="flex-wrap: wrap; gap: 16px;">
                    <div class="tabs" style="margin-bottom: 0; flex-grow: 1;">
                      <div class="tab active" data-status="active" onclick="this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active'); (window.app?.pmModule || window.app?.fmModule)?.filterProjectsByStatus('active')">Active Projects</div>
                      <div class="tab" data-status="hold" onclick="this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active'); (window.app?.pmModule || window.app?.fmModule)?.filterProjectsByStatus('on_hold')">On Hold</div>
                      <div class="tab" data-status="completed" onclick="this.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active'); (window.app?.pmModule || window.app?.fmModule)?.filterProjectsByStatus('completed')">Completed</div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                    </div>
                </div>
              <div id="projects-table-container">
				${this.renderLoadingState()}
			  </div>
			</div>`;
	},

    async loadProjectsFromAPI() {
        if (this.isLoadingProjects) return;
        this.isLoadingProjects = true;

        const container = document.getElementById('projects-table-container');
        if (!container) {
            this.isLoadingProjects = false;
            return;
        }

        try {
            const result = await client.get('/projects');
            this.allProjects = Array.isArray(result) ? result : result.data || result.items || [];

            if (this.allProjects.length === 0) {
                container.innerHTML = this.renderEmptyState('No projects found. Create a new project to get started.');
                return;
            }

            const activeTab = document.querySelector('.tabs .tab.active');
            const activeStatus = activeTab ? activeTab.getAttribute('data-status') : 'active';
            
            this.applyCurrentFilter(activeStatus);

            if (!this.selectedProjectId && this.allProjects.length > 0) {
                this.selectedProjectId = this.allProjects[0].id || this.allProjects[0].code;
            }

            this.updateHeaderStats();
        } catch (error) {
            console.error('[CRITICAL] Failed to load projects:', error);
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
        } finally {
            this.isLoadingProjects = false;
        }
    },

    filterProjectsByStatus(status) {
        if (this.isLoadingProjects) return;
        this.applyCurrentFilter(status);
    },

    applyCurrentFilter(status) {
        const container = document.getElementById('projects-table-container');
        if (!container || !this.allProjects) return;

        this.projectsPage = 1; 

        const filtered = status === 'all' 
            ? this.allProjects 
            : (status === 'active' 
                ? this.allProjects.filter(p => (p.status || '').toLowerCase() === 'active' || (p.status || '').toLowerCase() === 'in_progress')
                : this.allProjects.filter(p => (p.status || '').toLowerCase() === status.toLowerCase()));
        
        this.currentFilteredProjects = filtered;
        this.renderProjectsWithPagination();

        // Sync with tabs UI
        const tabs = document.querySelectorAll('.tabs .tab');
        tabs.forEach(t => {
            if (t.getAttribute('data-status') === status) {
                t.parentElement.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                t.classList.add('active');
            }
        });
    },

    renderProjectsWithPagination() {
        const container = document.getElementById('projects-table-container');
        if (!container || !this.currentFilteredProjects) return;

        const totalItems = this.currentFilteredProjects.length;
        
        if (totalItems === 0) {
            const activeTab = document.querySelector('.tabs .tab.active');
            const status = activeTab ? activeTab.getAttribute('data-status') : 'active';
            container.innerHTML = this.renderEmptyState(`No ${status.replace(/_/g, ' ')} projects found.`);
            return;
        }

        const perPage = 10;
        const totalPages = Math.ceil(totalItems / perPage);
        const start = (this.projectsPage - 1) * perPage;
        const end = start + perPage;
        const pageData = this.currentFilteredProjects.slice(start, end);

        let html = this.renderProjectsTable(pageData);

        if (totalPages > 1) {
            html += this.renderPaginationControls(this.projectsPage, totalPages);
        }

        container.innerHTML = html;
    },

    renderPaginationControls(current, total) {
        let buttons = '';
        for (let i = 1; i <= total; i++) {
            buttons += `
                <button class="btn ${i === current ? 'btn-primary' : 'btn-secondary'}" 
                        style="padding: 4px 10px; font-size: 11px; min-width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;" 
                        onclick="window.app.pmModule.changeProjectsPage(${i})">
                    ${i}
                </button>
            `;
        }

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid var(--slate-200); background: #fcfcfd; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                <div style="font-size: 11px; color: var(--slate-500); font-weight: 500;">
                    Showing <b style="color: var(--slate-900);">${Math.min((current - 1) * 10 + 1, this.currentFilteredProjects.length)}</b> to <b style="color: var(--slate-900);">${Math.min(current * 10, this.currentFilteredProjects.length)}</b> of <b style="color: var(--slate-900);">${this.currentFilteredProjects.length}</b> projects
                </div>
                <div style="display: flex; gap: 4px;">
                    ${buttons}
                </div>
            </div>
        `;
    },

    changeProjectsPage(page) {
        this.projectsPage = page;
        this.renderProjectsWithPagination();
        const container = document.getElementById('projects-table-container');
        if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

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

        const rows = projects.map(project => `
            <tr>
                <td onclick="(window.app.pmModule || window.app.fmModule).openProjectDetailsDrawer('${project.id}')">
                    <span class="mono-val" style="font-weight: 700;">${this.escapeHTML(project.code || 'PRJ-' + project.id)}</span>
                </td>
                <td onclick="(window.app.pmModule || window.app.fmModule).openProjectDetailsDrawer('${project.id}')">
                    <div style="font-weight:700; color:var(--slate-800);">${this.escapeHTML(project.name)}</div>
                    <div style="font-size:11px; color:var(--slate-500); margin-top:2px;">${this.escapeHTML(project.client || 'Government of Malawi')}</div>
                </td>
                <td onclick="(window.app.pmModule || window.app.fmModule).openProjectDetailsDrawer('${project.id}')">${this.escapeHTML(project.manager?.name || project.managerName || 'Unassigned')}</td>
                <td onclick="(window.app.pmModule || window.app.fmModule).openProjectDetailsDrawer('${project.id}')">
                    <div style="width:100%; height:6px; background:var(--slate-100); border-radius:3px; margin-bottom:4px;">
                        <div style="width:${project.progress || 0}%; height:100%; background:var(--orange); border-radius:3px;"></div>
                    </div>
                    <div style="font-size:10px; color:var(--slate-500); font-weight:600;">${project.progress || 0}% Complete</div>
                </td>
                <td onclick="(window.app.pmModule || window.app.fmModule).openProjectDetailsDrawer('${project.id}')">
                    <span class="status ${project.budgetUtilization > 100 ? 'delayed' : 'active'}" style="background:${project.budgetUtilization > 100 ? 'var(--red-light)' : 'var(--emerald-light)'}; color:${project.budgetUtilization > 100 ? 'var(--red-dark)' : 'var(--emerald-dark)'};">
                        ${project.budgetUtilization > 100 ? 'Overrun' : 'Good'} (${project.budgetUtilization ?? 0}%)
                    </span>
                </td>
                <td onclick="(window.app.pmModule || window.app.fmModule).openProjectDetailsDrawer('${project.id}')"><span class="status ${getStatusClass(project.status)}"><i class="fas ${getStatusIcon(project.status)}"></i> ${formatStatus(project.status)}</span></td>
                <td style="position: relative;">
                    <div class="dropdown" style="position: relative; display: inline-block;">
                        <button class="btn-icon dropdown-trigger" onclick="event.stopPropagation(); (window.app.pmModule || window.app.fmModule).toggleDropdown(this)"><i class="fas fa-ellipsis-v"></i></button>
                        <div class="dropdown-content" style="display: none; position: absolute; right: 0; background-color: white; min-width: 160px; box-shadow: var(--shadow-md); z-index: 100; border-radius: 4px; border: 1px solid var(--slate-200);">
                            <a href="#" onclick="event.preventDefault(); (window.app.pmModule || window.app.fmModule).openProjectDetailsDrawer('${project.id}');" style="color: var(--slate-700); padding: 12px 16px; text-decoration: none; display: block; font-size: 13px;"><i class="fas fa-eye" style="width: 20px;"></i> View Details</a>
                            <a href="#" onclick="event.preventDefault(); window.app.pmModule?.openEditProjectDrawer('${project.id}');" style="color: var(--slate-700); padding: 12px 16px; text-decoration: none; display: block; font-size: 13px;"><i class="fas fa-edit" style="width: 20px;"></i> Edit Project</a>
                            <a href="#" onclick="event.preventDefault(); window.app.pmModule?.openSuspendProjectDrawer('${project.id}');" style="color: var(--amber-dark); padding: 12px 16px; text-decoration: none; display: block; font-size: 13px; border-top: 1px solid var(--slate-100);"><i class="fas fa-pause-circle" style="width: 20px;"></i> Suspend Project</a>
                            <a href="#" onclick="event.preventDefault(); window.app.pmModule?.handleCompleteProject('${project.id}');" style="color: var(--emerald-dark); padding: 12px 16px; text-decoration: none; display: block; font-size: 13px;"><i class="fas fa-check-circle" style="width: 20px;"></i> Mark as Complete</a>
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
	},

    openProjectDetailsDrawer(id) {
        if(!id) return;
        window.toast.show('Loading project details...', 'info');
        projects.getById(id).then(response => {
            const project = response.data || response;
            window.drawer.open('Project Details', window.DrawerTemplates.projectDetails(project));
        }).catch(err => {
            window.toast.show('Failed to load project details', 'error');
        });
    },


};
