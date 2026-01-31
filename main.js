import { AppLayout } from './layouts/AppLayout.js';
import { currentUser } from './config/roles.js';
import { drawer } from './components/DrawerManager.js';
import { ModuleLoaderStrategy } from './src/strategies/ModuleLoaderStrategy.js';
import './components/ui/ToastManager.js';
import './components/ui/ModalManager.js';

// --- Global Error Boundary ---
window.addEventListener('error', (event) => {
    console.error('Global Error Caught:', event.error);
    
    // Send to error reporting service (e.g., Sentry)
    if (typeof reportError === 'function') {
        reportError(event.error, { type: 'uncaught_error', message: event.message });
    }
    
    if (window.modal) {
        window.modal.error('Application Error', `An unexpected error occurred: ${event.message}`);
    } else {
        alert(`Critical Error: ${event.message}`);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    
    // Send to error reporting service
    if (typeof reportError === 'function') {
        reportError(event.reason, { type: 'unhandled_rejection' });
    }
    
    if (window.toast) {
        window.toast.show(`Async Error: ${event.reason.message || 'Unknown network error'}`, 'error');
    }
});

class App {
    constructor() {
        this.layout = new AppLayout();
        this.moduleLoader = new ModuleLoaderStrategy();
        this.currentRoute = 'dashboard';
        this.init();
    }

    async init() {
        try {
            console.log(`Starting MCMS as ${currentUser.role}`);
            
            // Render Shell
            this.layout.render();

            // Initial Page Load
            await this.loadPage('dashboard');

            // Listen for navigation events
            window.addEventListener('navigate', (e) => {
                this.loadPage(e.detail.id);
            });
        } catch (error) {
            console.error('Initialization Failed:', error);
            window.modal.error('Startup Failed', 'The application could not start. Please refresh.');
        }
    }

    async loadPage(pageId) {
        // Update Title - Defensive check if element exists
        const titleEl = document.getElementById('page-title');
        if (titleEl) {
            titleEl.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1).replace('-', ' ');
        }

        let content = '';
        let module = null;

        try {
            // Strategy Pattern: Load module based on role
            module = await this.moduleLoader.load(currentUser.role);

            // Expose PM module globally as expected by ProjectManagerDashboard.js templates
            if (currentUser.role === 'Project Manager') {
                this.pmModule = module;
            }

            if (module) {
                module.currentView = pageId;
                content = module.render();
            } else {
                // Fallback for roles without specific modules or testing
                content = this.getMockContent(pageId);
            }
        } catch (error) {
            console.error('Error loading page:', error);
            content = `<div class="p-6 text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <h3 class="font-bold text-lg mb-2"><i class="fas fa-exclamation-circle"></i> Module Load Error</h3>
                <p>Failed to load the dashboard module for <strong>${currentUser.role}</strong>.</p>
                <div class="mt-4 text-sm text-slate-600 font-mono bg-white p-3 rounded border">${error.message}</div>
            </div>`;
            window.toast.show('Failed to load content', 'error');
        }

        // Inject the content into the Main Layout
        this.layout.injectContent(content);

        // Initialization Hooks for Maps/Plots
        if (module) {
             // Safe invocation of module-specific hooks
            if (pageId === 'portfolio' && typeof module.initializeProjectMap === 'function') {
                module.initializeProjectMap();
            } else if (pageId === 'tracking' && typeof module.initializeTrackingMap === 'function') {
                module.initializeTrackingMap();
            }
        }
    }

    getMockContent(pageId) {
        return `
            <div class="grid gap-6">
                <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h2 class="text-lg font-bold text-slate-800 mb-2">Welcome, ${currentUser.name}</h2>
                    <p class="text-slate-500">You are viewing the ${pageId} view for the ${currentUser.role} role.</p>
                    <div class="mt-6 flex gap-4">
                        <button class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm font-medium" onclick="window.drawer.open('Demo Drawer', '<div class=\\'p-4\\'>Hello from Drawer!</div>')">
                            Test Drawer
                        </button>
                         <button class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm font-medium" onclick="throw new Error('Test Global Error')">
                            Test Error Boundary
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Start App
document.addEventListener('DOMContentLoaded', async () => {
    // Globals for Inline Handlers
    const { DrawerTemplates } = await import('./components/DrawerTemplates.js');
    window.DrawerTemplates = DrawerTemplates;

    window.app = new App();
    
    // Dev Tools: Role Switcher
    const { RoleSwitcher } = await import('./components/RoleSwitcher.js');
    new RoleSwitcher();
});
