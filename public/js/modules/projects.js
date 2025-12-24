/**
 * Projects Module
 * Handles project management and overview
 */
const ProjectsModule = {
  projects: [],

  /**
   * Initialize projects module
   */
  init() {
    console.log('Projects module initialized');
    this.loadProjects();
  },

  /**
   * Load projects from API
   */
  loadProjects() {
    this.projects = [
      {
        id: 'PROJ-001',
        name: 'M1 Road Rehabilitation - Mzuzu',
        description: 'Complete rehabilitation of M1 road corridor from Lilongwe to Mzuzu',
        status: 'Active',
        progress: 65,
        budget: 8500000000,
        spent: 5525000000,
        startDate: '2024-01-15',
        endDate: '2024-12-31',
        manager: 'Anthony Kanjira',
        team: ['John Banda', 'James Mwale', 'Grace Phiri']
      },
      {
        id: 'PROJ-002',
        name: 'M5 Bridge Rehabilitation',
        description: 'Rehabilitation and modernization of bridges on M5 corridor',
        status: 'Active',
        progress: 45,
        budget: 3200000000,
        spent: 1440000000,
        startDate: '2024-03-01',
        endDate: '2024-11-30',
        manager: 'John Banda',
        team: ['James Mwale', 'David Phiri']
      },
      {
        id: 'PROJ-003',
        name: 'City Road Upgrade - Blantyre',
        description: 'Upgrade and expansion of city roads in Blantyre',
        status: 'Planning',
        progress: 15,
        budget: 2100000000,
        spent: 315000000,
        startDate: '2024-06-01',
        endDate: '2025-05-31',
        manager: 'Grace Phiri',
        team: ['David Phiri']
      }
    ];
  },

  /**
   * Display projects in grid or table
   */
  displayProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    container.innerHTML = this.projects.map(project => `
      <div class="project-card" onclick="ProjectsModule.viewProject('${project.id}')">
        <div class="project-header">
          <h3 class="project-name">${project.name}</h3>
          <span class="status ${project.status.toLowerCase()}">${project.status}</span>
        </div>
        <div class="project-description">${project.description}</div>
        
        <div class="project-stats">
          <div class="stat">
            <div class="stat-label">Progress</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${project.progress}%"></div>
            </div>
            <div class="stat-value">${project.progress}%</div>
          </div>
          
          <div class="stat">
            <div class="stat-label">Budget</div>
            <div class="stat-value">MWK ${(project.spent / 1000000000).toFixed(1)}B / ${(project.budget / 1000000000).toFixed(1)}B</div>
          </div>
        </div>
        
        <div class="project-footer">
          <div class="team">
            <span>Manager: ${project.manager}</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  /**
   * View project details
   */
  viewProject(projectId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      NotificationComponent.error('Project not found');
      return;
    }

    const modalId = 'project-details-modal';
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('show');
        }
      });
    }

    const budgetPercentage = Math.round((project.spent / project.budget) * 100);

    modal.innerHTML = `
      <div class="modal" style="max-width: 700px;">
        <div class="modal-header">
          <h3 class="modal-title">${project.name}</h3>
          <div class="modal-close" onclick="document.getElementById('${modalId}').classList.remove('show')">
            <i class="fas fa-times"></i>
          </div>
        </div>
        <div class="modal-body" style="display: grid; gap: 20px;">
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Status</div>
            <span class="status ${project.status.toLowerCase()}">${project.status}</span>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Description</div>
            <div style="font-size: 14px; line-height: 1.6; color: var(--slate-700);">${project.description}</div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Overall Progress</div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="progress-bar" style="flex: 1;">
                <div class="progress-fill" style="width: ${project.progress}%"></div>
              </div>
              <span style="font-weight: 800; font-size: 16px; color: var(--slate-900);">${project.progress}%</span>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Start Date</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${project.startDate}</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">End Date</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${project.endDate}</div>
            </div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Budget Usage</div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="progress-bar" style="flex: 1;">
                <div class="progress-fill" style="width: ${budgetPercentage}%; background: ${budgetPercentage > 80 ? 'var(--red)' : budgetPercentage > 60 ? 'var(--amber)' : 'var(--emerald)'}"></div>
              </div>
              <span style="font-weight: 800; font-size: 16px; color: var(--slate-900);">${budgetPercentage}%</span>
            </div>
            <div style="font-size: 13px; color: var(--slate-600); margin-top: 8px;">
              MWK ${(project.spent / 1000000000).toFixed(2)}B spent of MWK ${(project.budget / 1000000000).toFixed(2)}B
            </div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Project Manager</div>
            <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${project.manager}</div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Team Members</div>
            <div style="font-size: 14px; color: var(--slate-700);">
              ${project.team.map(member => `<div style="padding: 4px 0;">${member}</div>`).join('')}
            </div>
          </div>
          
          <div style="display: flex; gap: 12px; padding-top: 20px;">
            <button class="btn btn-primary" style="flex: 1;" onclick="ProjectsModule.editProject('${project.id}')">
              <i class="fas fa-edit"></i>
              <span>Edit</span>
            </button>
            <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').classList.remove('show')">
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('show');
  },

  /**
   * Edit project
   */
  editProject(projectId) {
    NotificationComponent.info(`Editing project ${projectId}`);
  },

  /**
   * Create new project
   */
  createProject() {
    NotificationComponent.info('Creating new project');
  },

  /**
   * Archive project
   */
  archiveProject(projectId) {
    NotificationComponent.warning(`Archiving project ${projectId}`);
  }
};
