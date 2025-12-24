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

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}