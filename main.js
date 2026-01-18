import { AppLayout } from './layouts/AppLayout.js';
import { currentUser } from './config/roles.js';
import { drawer } from './components/DrawerManager.js';
import './components/ui/ToastManager.js';
import './components/ui/ModalManager.js';

class App {
    constructor() {
        this.layout = new AppLayout();
        this.currentRoute = 'dashboard';
        this.init();
    }

    init() {
        console.log(`Starting MCMS as ${currentUser.role}`);
        
        // Render Shell
        this.layout.render();

        // Initial Page Load
        this.loadPage('dashboard');

        // Listen for navigation events
        window.addEventListener('navigate', (e) => {
            this.loadPage(e.detail.id);
        });
    }

    async loadPage(pageId) {
        // Update Title - Defensive check if element exists
        const titleEl = document.getElementById('page-title');
        if (titleEl) {
            titleEl.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1).replace('-', ' ');
        }

        let content = '';

        try {
            // Routing Logic
            if (currentUser.role === 'Finance Director') {
                // Lazy load the Finance Module if not already loaded
                if (!this.financeModule) {
                    const { FinanceDashboard } = await import('./components/modules/FinanceDashboard.js');
                    this.financeModule = new FinanceDashboard();
                }
                
                // Update the module's current view state
                this.financeModule.currentView = pageId;
                
                // Render the module with the new view
                content = this.financeModule.render(); 
            } else if (currentUser.role === 'Project Manager') {
                 // Lazy load the PM Module
                 if (!this.pmModule) {
                    const { ProjectManagerDashboard } = await import('./components/modules/ProjectManagerDashboard.js');
                    this.pmModule = new ProjectManagerDashboard();
                 }

                 this.pmModule.currentView = pageId;
                 content = this.pmModule.render();
            } else if (currentUser.role === 'Field Supervisor') {
                // Lazy load the Field Module
                if (!this.fsModule) {
                   const { FieldSupervisorDashboard } = await import('./components/modules/FieldSupervisorDashboard.js');
                   this.fsModule = new FieldSupervisorDashboard();
                }

                this.fsModule.currentView = pageId;
                content = this.fsModule.render();
            } else if (currentUser.role === 'Contract Administrator') {
                 // Lazy load Contract Module
                 if (!this.caModule) {
                    const { ContractAdminDashboard } = await import('./components/modules/ContractAdminDashboard.js');
                    this.caModule = new ContractAdminDashboard();
                 }
                 this.caModule.currentView = pageId;
                 content = this.caModule.render();
            } else if (currentUser.role === 'Equipment Coordinator') {
                 // Lazy load Equipment Module
                 if (!this.ecModule) {
                    const { EquipmentCoordinatorDashboard } = await import('./components/modules/EquipmentCoordinatorDashboard.js');
                    this.ecModule = new EquipmentCoordinatorDashboard();
                 }
                 this.ecModule.currentView = pageId;
                 content = this.ecModule.render();
            } else if (currentUser.role === 'Operations Manager') {
                 // Lazy load Operations Module
                 if (!this.omModule) {
                    const { OperationsManagerDashboard } = await import('./components/modules/OperationsManagerDashboard.js');
                    this.omModule = new OperationsManagerDashboard();
                 }
                 this.omModule.currentView = pageId;
                 content = this.omModule.render();
            } else if (currentUser.role === 'Managing Director') {
                 // Lazy load MD Module
                 if (!this.mdModule) {
                    const { ManagingDirectorDashboard } = await import('./components/modules/ManagingDirectorDashboard.js');
                    this.mdModule = new ManagingDirectorDashboard();
                 }
                 this.mdModule.currentView = pageId;
                 content = this.mdModule.render();
            } else if (currentUser.role === 'System Technician') {
                 // Lazy load Technician Module
                 if (!this.techModule) {
                    const { SystemTechnicianDashboard } = await import('./components/modules/SystemTechnicianDashboard.js');
                    this.techModule = new SystemTechnicianDashboard();
                 }
                 this.techModule.currentView = pageId;
                 content = this.techModule.render();
            } else {
                // Fallback / Other Roles Mock
                content = this.getMockContent(pageId);
            }
        } catch (error) {
            console.error('Error loading page:', error);
            content = `<div class="p-4 text-red-500">Error loading content: ${error.message}</div>`;
        }

        // Inject the content into the Main Layout
        this.layout.injectContent(content);

        // Initialization Hooks for Maps/Plots
        if (pageId === 'portfolio' && this.pmModule) {
            this.pmModule.initializeProjectMap();
        } else if (pageId === 'tracking' && this.ecModule) {
            this.ecModule.initializeTrackingMap();
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
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-32 flex items-center justify-center text-slate-400">
                        Widget A Placeholder
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-32 flex items-center justify-center text-slate-400">
                        Widget B Placeholder
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-32 flex items-center justify-center text-slate-400">
                        Widget C Placeholder
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
