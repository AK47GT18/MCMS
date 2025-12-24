/**
 * Main Application Controller
 */
const App = {
  initialized: false,

  /**
   * Initialize application
   */
  init() {
    if (this.initialized) return;

    console.log(`${AppConfig.app.name} v${AppConfig.app.version} initializing...`);

    // Check authentication
    if (!AuthManager.isAuthenticated() && window.location.pathname !== AppConfig.routes.login) {
      window.location.href = AppConfig.routes.login;
      return;
    }

    // Initialize components
    this.initializeComponents();
    
    // Initialize router
    Router.init();

    // Set up global event listeners
    this.setupEventListeners();

    // Initialize notifications
    NotificationManager.init();

    this.initialized = true;
    console.log('Application initialized successfully');
  },

  /**
   * Initialize components
   */
  initializeComponents() {
    // Initialize tooltips
    this.initTooltips();
    
    // Initialize sidebar
    this.initSidebar();
    
    // Initialize active navigation
    this.setActiveNavigation();
  },

  /**
   * Initialize tooltips
   */
  initTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    tooltipTriggers.forEach(trigger => {
      trigger.addEventListener('mouseenter', function() {
        const text = this.getAttribute('data-tooltip');
        const position = this.getAttribute('data-tooltip-position') || 'top';
        
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip ${position}`;
        tooltip.textContent = text;
        tooltip.id = 'active-tooltip';
        
        this.appendChild(tooltip);
        
        // Show tooltip
        setTimeout(() => {
          tooltip.style.opacity = '1';
          tooltip.style.visibility = 'visible';
        }, 10);
      });

      trigger.addEventListener('mouseleave', function() {
        const tooltip = document.getElementById('active-tooltip');
        if (tooltip) {
          tooltip.remove();
        }
      });
    });
  },

  /**
   * Initialize sidebar
   */
  initSidebar() {
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (hamburger) {
      hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
      });
    }
  },

  /**
   * Set active navigation
   */
  setActiveNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      const linkPath = link.getAttribute('href');
      if (linkPath === currentPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Handle all nav link clicks
    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('.nav-link');
      if (navLink && navLink.getAttribute('data-page')) {
        e.preventDefault();
        const page = navLink.getAttribute('data-page');
        this.loadPage(page);
      }
    });

    // Handle logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        AuthManager.logout();
      });
    }
  },

  /**
   * Load page module
   */
  loadPage(page) {
    // Update active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[data-page="${page}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }

    // Load page module
    switch(page) {
      case 'dashboard':
        if (typeof Dashboard !== 'undefined') Dashboard.init();
        break;
      case 'projects':
        if (typeof Projects !== 'undefined') Projects.init();
        break;
      case 'finance':
        if (typeof Finance !== 'undefined') Finance.init();
        break;
      case 'equipment':
        if (typeof Equipment !== 'undefined') Equipment.init();
        break;
      case 'contracts':
        if (typeof Contracts !== 'undefined') Contracts.init();
        break;
      default:
        console.log(`Page module not found: ${page}`);
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.querySelector('.sidebar-overlay');
      if (sidebar) sidebar.classList.remove('show');
      if (overlay) overlay.classList.remove('show');
    }
  },

  /**
   * Show loading state
   */
  showLoading() {
    const loadingHTML = `
      <div id="app-loading" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div style="text-align: center;">
          <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: var(--orange); margin-bottom: 16px;"></i>
          <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">Loading...</div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
  },

  /**
   * Hide loading state
   */
  hideLoading() {
    const loading = document.getElementById('app-loading');
    if (loading) {
      loading.remove();
    }
  }
};

/**
 * UI Interaction Methods
 */

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('show');
  if (overlay) overlay.classList.toggle('show');
}

/**
 * Load page content
 */
function loadPage(page) {
  App.loadPage(page);
}

/**
 * Open project switcher dropdown
 */
function openProjectSwitcher() {
  const modalId = 'project-switcher-modal';
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

  const projects = [
    { id: 'PROJ-001', name: 'M1 Road Rehabilitation - Mzuzu', status: 'Active' },
    { id: 'PROJ-002', name: 'M5 Bridge Rehabilitation', status: 'Active' },
    { id: 'PROJ-003', name: 'City Road Upgrade - Blantyre', status: 'Planning' }
  ];

  modal.innerHTML = `
    <div class="modal" style="max-width: 450px;">
      <div class="modal-header">
        <h3 class="modal-title">Switch Project</h3>
        <div class="modal-close" onclick="document.getElementById('${modalId}').classList.remove('show')">
          <i class="fas fa-times"></i>
        </div>
      </div>
      <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
        ${projects.map(proj => `
          <div onclick="selectProject('${proj.id}', '${proj.name}'); document.getElementById('${modalId}').classList.remove('show');" style="
            padding: 16px;
            border-bottom: 1px solid var(--slate-200);
            cursor: pointer;
            transition: var(--transition);
            display: flex;
            justify-content: space-between;
            align-items: center;
          " onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='white'">
            <div>
              <div style="font-weight: 700; color: var(--slate-900); margin-bottom: 4px;">${proj.name}</div>
              <span class="status ${proj.status.toLowerCase()}">${proj.status}</span>
            </div>
            <i class="fas fa-arrow-right" style="color: var(--slate-400);"></i>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  modal.classList.add('show');
}

/**
 * Select and switch project
 */
function selectProject(projectId, projectName) {
  const projectElement = document.getElementById('current-project');
  if (projectElement) {
    projectElement.textContent = projectName;
  }
  NotificationComponent.success(`Switched to ${projectName}`);
}

/**
 * Open user profile
 */
function openUserProfile() {
  const modalId = 'user-profile-modal';
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

  modal.innerHTML = `
    <div class="modal" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">My Profile</h3>
        <div class="modal-close" onclick="document.getElementById('${modalId}').classList.remove('show')">
          <i class="fas fa-times"></i>
        </div>
      </div>
      <div class="modal-body" style="display: grid; gap: 20px;">
        <div style="text-align: center; padding: 20px; background: var(--slate-50); border-radius: 12px;">
          <div style="
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--orange) 0%, var(--orange-dark) 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 32px;
            color: white;
            margin: 0 auto 16px;
          ">AK</div>
          <div style="font-size: 20px; font-weight: 800; color: var(--slate-900); margin-bottom: 4px;">Anthony Kanjira</div>
          <div style="font-size: 14px; color: var(--slate-500); margin-bottom: 12px;">Project Manager</div>
          <button class="btn btn-secondary" style="width: 100%;" onclick="editProfile()">
            <i class="fas fa-edit"></i>
            <span>Edit Profile</span>
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Email</div>
            <div style="font-size: 14px; color: var(--slate-900);">anthony.kanjira@mkaka.mw</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Phone</div>
            <div style="font-size: 14px; color: var(--slate-900);">+265 9XX XXX XXX</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Department</div>
            <div style="font-size: 14px; color: var(--slate-900);">Project Management</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Joined</div>
            <div style="font-size: 14px; color: var(--slate-900);">January 15, 2024</div>
          </div>
        </div>

        <div style="border-top: 1px solid var(--slate-200); padding-top: 20px;">
          <div style="font-size: 14px; font-weight: 700; color: var(--slate-900); margin-bottom: 12px;">Permissions</div>
          <div style="display: grid; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-check-circle" style="color: var(--emerald);"></i>
              <span style="font-size: 14px; color: var(--slate-700);">View Projects</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-check-circle" style="color: var(--emerald);"></i>
              <span style="font-size: 14px; color: var(--slate-700);">Manage Contracts</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-check-circle" style="color: var(--emerald);"></i>
              <span style="font-size: 14px; color: var(--slate-700);">View Financial Reports</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-check-circle" style="color: var(--emerald);"></i>
              <span style="font-size: 14px; color: var(--slate-700);">Approve Commitments</span>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 12px; padding-top: 20px; border-top: 1px solid var(--slate-200);">
          <button class="btn btn-secondary" style="flex: 1;" onclick="changePassword()">
            <i class="fas fa-lock"></i>
            <span>Change Password</span>
          </button>
          <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').classList.remove('show')">
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('show');
}

/**
 * Edit user profile
 */
function editProfile() {
  NotificationComponent.info('Edit profile functionality');
}

/**
 * Change password
 */
function changePassword() {
  NotificationComponent.info('Change password functionality');
}

/**
 * Open settings
 */
function openSettings() {
  const menu = document.getElementById('user-menu-dropdown');
  if (menu) menu.remove();
  NotificationComponent.info('Opening settings...');
}

/**
 * Open help and support
 */
function openHelp() {
  const menu = document.getElementById('user-menu-dropdown');
  if (menu) menu.remove();
  NotificationComponent.info('Opening help center...');
}

/**
 * Open search modal
 */
function openSearch() {
  const modalId = 'search-modal';
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

  modal.innerHTML = `
    <div class="modal" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">Search</h3>
        <div class="modal-close" onclick="document.getElementById('${modalId}').classList.remove('show')">
          <i class="fas fa-times"></i>
        </div>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Search across all modules</label>
          <input type="text" class="form-input" id="search-input" placeholder="Search projects, tasks, commitments, equipment..." style="font-size: 16px;" autofocus onkeyup="performSearch(this.value)">
        </div>
        <div id="search-results" style="margin-top: 20px; max-height: 400px; overflow-y: auto;">
          <div style="color: var(--slate-500); text-align: center; padding: 20px;">
            <i class="fas fa-search" style="font-size: 32px; margin-bottom: 12px;"></i>
            <div>Start typing to search...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('show');
  setTimeout(() => document.getElementById('search-input')?.focus(), 100);
}

/**
 * Perform search across modules
 */
function performSearch(query) {
  if (!query) {
    document.getElementById('search-results').innerHTML = `
      <div style="color: var(--slate-500); text-align: center; padding: 20px;">
        <i class="fas fa-search" style="font-size: 32px; margin-bottom: 12px;"></i>
        <div>Start typing to search...</div>
      </div>
    `;
    return;
  }

  const results = [];
  const searchLower = query.toLowerCase();

  // Search projects
  if (typeof ProjectsModule !== 'undefined' && ProjectsModule.projects) {
    ProjectsModule.projects.forEach(proj => {
      if (proj.name.toLowerCase().includes(searchLower) || proj.description.toLowerCase().includes(searchLower)) {
        results.push({
          type: 'Project',
          title: proj.name,
          icon: 'fa-project-diagram',
          color: 'var(--blue)',
          action: `ProjectsModule.viewProject('${proj.id}')`
        });
      }
    });
  }

  // Search equipment
  if (typeof EquipmentModule !== 'undefined' && EquipmentModule.equipment) {
    EquipmentModule.equipment.forEach(eq => {
      if (eq.name.toLowerCase().includes(searchLower) || eq.id.toLowerCase().includes(searchLower)) {
        results.push({
          type: 'Equipment',
          title: eq.name,
          icon: 'fa-truck',
          color: 'var(--orange)',
          action: `EquipmentModule.viewEquipment('${eq.id}')`
        });
      }
    });
  }

  // Search commitments
  if (typeof CommitmentsModule !== 'undefined' && CommitmentsModule.commitments) {
    Object.entries(CommitmentsModule.commitments).forEach(([id, contract]) => {
      if (contract.title.toLowerCase().includes(searchLower) || id.toLowerCase().includes(searchLower)) {
        results.push({
          type: 'Contract',
          title: contract.title,
          icon: 'fa-file-contract',
          color: 'var(--emerald)',
          action: `CommitmentsModule.viewCommitment('${id}')`
        });
      }
    });
  }

  const resultsDiv = document.getElementById('search-results');
  if (results.length === 0) {
    resultsDiv.innerHTML = `
      <div style="color: var(--slate-500); text-align: center; padding: 20px;">
        <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px;"></i>
        <div>No results found for "${query}"</div>
      </div>
    `;
    return;
  }

  resultsDiv.innerHTML = results.map(result => `
    <div onclick="${result.action}; document.getElementById('search-modal').classList.remove('show');" style="
      padding: 12px 16px;
      border-bottom: 1px solid var(--slate-200);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: var(--transition);
    " onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='white'">
      <i class="fas ${result.icon}" style="color: ${result.color}; font-size: 16px;"></i>
      <div style="flex: 1;">
        <div style="font-weight: 600; color: var(--slate-900);">${result.title}</div>
        <div style="font-size: 12px; color: var(--slate-400);">${result.type}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Open notifications panel
 */
function openNotifications() {
  if (typeof NotificationComponent !== 'undefined') {
    NotificationComponent.openPanel();
  }
}

/**
 * Open user menu dropdown
 */
function openUserMenu() {
  // TODO: Implement user menu
  alert('User menu (would show profile, settings, logout)');
}


/**
 * Create new commitment
 */
function createCommitment() {
  if (typeof CommitmentsModule !== 'undefined') {
    CommitmentsModule.createCommitment();
  }
}

/**
 * View commitment details
 */
function viewCommitment(contractId) {
  if (typeof CommitmentsModule !== 'undefined') {
    CommitmentsModule.viewCommitment(contractId);
  }
}

/**
 * Close modal
 */
function closeModal() {
  const modal = document.getElementById('modal-overlay');
  if (modal) {
    modal.classList.remove('show');
  }
}

/**
 * Switch tab
 */
function switchTab(element, tabName) {
  if (typeof DataTables !== 'undefined') {
    DataTables.switchTab(element, tabName);
  }
}

/**
 * Filter table
 */
function filterTable(type, value) {
  if (typeof DataTables !== 'undefined') {
    DataTables.filterTable(type, value);
  }
}

/**
 * Initialize all modules
 */
function initializeModules() {
  // Initialize component services
  if (typeof NotificationComponent !== 'undefined') {
    NotificationComponent.init();
  }

  // Initialize modules based on current page
  const currentPage = window.location.pathname;
  
  if (currentPage.includes('dashboard')) {
    if (typeof DashboardModule !== 'undefined') DashboardModule.init();
  } else if (currentPage.includes('projects')) {
    if (typeof ProjectsModule !== 'undefined') ProjectsModule.init();
  } else if (currentPage.includes('equipment')) {
    if (typeof EquipmentModule !== 'undefined') EquipmentModule.init();
  } else if (currentPage.includes('commitments') || currentPage.includes('finance')) {
    if (typeof CommitmentsModule !== 'undefined') CommitmentsModule.init();
  } else if (currentPage.includes('reports')) {
    if (typeof FinanceModule !== 'undefined') FinanceModule.init();
  }

  // Initialize services
  if (typeof GPSService !== 'undefined') {
    GPSService.init();
  }
  if (typeof OfflineService !== 'undefined') {
    OfflineService.init();
  }
  if (typeof SyncService !== 'undefined') {
    SyncService.init();
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
    initializeModules();
  });
} else {
  App.init();
  initializeModules();
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', () => {
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === this) {
        closeModal();
      }
    });
  }
});