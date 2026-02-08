import { AppLayout } from './layouts/AppLayout.js';
import { currentUser as mockUser } from './config/roles.js'; // Keep as fallback
import { drawer } from './components/DrawerManager.js';
import { ModuleLoaderStrategy } from './src/strategies/ModuleLoaderStrategy.js';
import './components/ui/ToastManager.js';
import './components/ui/ModalManager.js';

// Auth constants
const TOKEN_KEY = 'mcms_auth_token';
const API_BASE = '/api/v1';
const USE_REAL_AUTH = true; // Feature flag for migration

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

// Listen for 401 Unauthorized from API interceptors - auto logout
window.addEventListener('auth:unauthorized', (event) => {
    console.warn('Session expired or unauthorized:', event.detail?.message);
    window.toast?.show('Session expired. Please log in again.', 'warning');
    localStorage.removeItem(TOKEN_KEY);
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
});

class App {
    constructor() {
        this.layout = new AppLayout();
        this.moduleLoader = new ModuleLoaderStrategy();
        this.currentRoute = 'dashboard';
        this.currentUser = null;
        this.init();
    }

    async init() {
        try {
            console.log('[DEBUG] MCM Main.init() started');
            
            // Check if localStorage is accessible
            const storageAvailable = this.checkStorage();
            if (!storageAvailable) {
                console.error('[CRITICAL] LocalStorage is blocked by the browser. Auth will fail.');
                window.toast?.show('Browser storage is blocked. Please enable cookies/storage for this site.', 'error');
            }

            // Auth check: Either use real API or fallback to mock
            if (USE_REAL_AUTH) {
                const token = localStorage.getItem(TOKEN_KEY);
                console.log(`[DEBUG] TOKEN_KEY: ${TOKEN_KEY}, Token value: ${token ? (token.substring(0, 10) + '...') : 'NULL'}`);
                
                if (!token || token === 'undefined') {
                    console.warn('[DEBUG] No valid token found, redirecting to index.html in 1s...');
                    setTimeout(() => window.location.href = 'index.html', 1000);
                    return;
                }
                
                // Fetch user profile from backend
                try {
                    const response = await fetch(`${API_BASE}/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.status === 429) {
                        console.warn('Rate limit exceeded fetching profile');
                        window.toast?.show('Rate limit exceeded. Please wait...', 'warning');
                        // Don't redirect, just pause/retry or degraded mode? 
                        // For now, let's just stop initialization but keep token
                        return;
                    }

                    if (!response.ok) {
                         if (response.status === 401 || response.status === 403) {
                             throw new Error('Session expired');
                         } else {
                             // Server error or other issue - don't logout, just warn
                             console.error('Profile fetch failed:', response.statusText);
                             window.toast?.show(`Connection error: ${response.status}`, 'error');
                             return;
                         }
                    }
                    
                    const data = await response.json();
                    this.currentUser = data.data || data; // Handle both {data: user} and direct user response
                    
                    // Normalize role (handle db enum "Project_Manager" -> "Project Manager")
                    if (this.currentUser && this.currentUser.role) {
                        this.currentUser.role = this.currentUser.role.replace(/_/g, ' ');
                    }
                    
                    console.log(`Authenticated as ${this.currentUser.name} (${this.currentUser.role})`);

                    // Mandatory Credential Check
                    if (this.currentUser.mustChangePassword || this.currentUser.mustChangeEmail) {
                        this.handleMandatoryCredentialUpdate();
                    }
                } catch (error) {
                    console.error('Auth failed:', error);
                    if (error.message === 'Session expired') {
                        localStorage.removeItem(TOKEN_KEY);
                        window.location.href = 'index.html';
                    } else {
                         window.toast?.show('Authentication check failed', 'error');
                    }
                    return;
                }
            } else {
                // Fallback to mock user for development
                this.currentUser = mockUser;
                console.log(`[DEV MODE] Starting MCMS as ${this.currentUser.role}`);
            }
            
            // Expose currentUser globally for templates
            window.currentUser = this.currentUser;
            
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
        // Route-level permission control
        const ROUTE_PERMISSIONS = {
            'dashboard': [], // All authenticated users
            'users': ['System_Technician', 'System Technician', 'Project_Manager', 'Project Manager'],
            'audit': ['System_Technician', 'Managing_Director', 'System Technician', 'Managing Director', 'Project_Manager', 'Project Manager'],
            'config': ['System_Technician', 'System Technician'],
            'finance': ['Finance_Director', 'Managing_Director', 'Finance Director', 'Managing Director'],
            'accounting': ['Finance_Director', 'Finance Director'],
            'requisitions': ['Finance_Director', 'Project_Manager', 'Finance Director', 'Project Manager'],
            'transactions': ['Finance_Director', 'Finance Director']
        };

        // Check access
        const allowedRoles = ROUTE_PERMISSIONS[pageId];
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(this.currentUser.role)) {
            window.toast?.show('Access denied: insufficient permissions', 'error');
            console.warn(`Access denied to ${pageId} for role ${this.currentUser.role}`);
            return;
        }

        // Update Title - Defensive check if element exists
        const titleEl = document.getElementById('page-title');
        if (titleEl) {
            titleEl.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1).replace('-', ' ');
        }

        let content = '';
        let module = null;

        try {
            // Strategy Pattern: Load module based on role
            module = await this.moduleLoader.load(this.currentUser.role);

            // Expose PM module globally as expected by ProjectManagerDashboard.js templates
            if (this.currentUser.role === 'Project Manager' || this.currentUser.role === 'Project_Manager') {
                this.pmModule = module;
            }
            
            // Expose techModule globally for System Technician role
            if (this.currentUser.role === 'System Technician' || this.currentUser.role === 'System_Technician') {
                window.techModule = module;
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
                <p>Failed to load the dashboard module for <strong>${this.currentUser.role}</strong>.</p>
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
        const user = this.currentUser || window.currentUser || { name: 'User', role: 'Unknown' };
        return `
            <div class="grid gap-6">
                <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h2 class="text-lg font-bold text-slate-800 mb-2">Welcome, ${user.name}</h2>
                    <p class="text-slate-500">You are viewing the ${pageId} view for the ${user.role} role.</p>
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

    checkStorage() {
        try {
            localStorage.setItem('__storage_test__', 'test');
            localStorage.removeItem('__storage_test__');
            return true;
        } catch (e) {
            return false;
        }
    }

    handleMandatoryCredentialUpdate() {
        const user = this.currentUser;
        let message = 'For security purposes, you are required to update your initial credentials before proceeding:';
        let updates = [];
        if (user.mustChangeEmail) updates.push('<strong>Email Address</strong>');
        if (user.mustChangePassword) updates.push('<strong>Password</strong>');
        
        message += `<ul style="margin: 10px 0; padding-left: 20px;">${updates.map(u => `<li>${u}</li>`).join('')}</ul>`;

        window.modal.show({
            type: 'info',
            title: 'Security Sync Required',
            message: message,
            confirmText: 'Begin Update',
            onConfirm: () => {
                if (user.mustChangeEmail) {
                    this.promptEmailUpdate();
                } else if (user.mustChangePassword) {
                    this.promptPasswordUpdate();
                }
            }
        });

        // Hide main content until done
        const main = document.querySelector('main');
        if (main) main.style.opacity = '0.1';
    }

    promptEmailUpdate() {
        window.modal.prompt(
            'Update Initial Email',
            'Your administrator has set an initial email. Please update it to your official email address:',
            'Enter your new email...',
            async (newEmail) => {
                if (!newEmail || !newEmail.includes('@')) {
                    window.toast.show('Please enter a valid email address', 'error');
                    return this.promptEmailUpdate();
                }

                try {
                    const token = localStorage.getItem(TOKEN_KEY);
                    const response = await fetch(`${API_BASE}/auth/change-email`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ newEmail })
                    });

                    if (!response.ok) throw new Error('Failed to update email');
                    
                    this.currentUser.mustChangeEmail = false;
                    this.currentUser.email = newEmail;
                    window.toast.show('Email updated successfully', 'success');
                    
                    if (this.currentUser.mustChangePassword) {
                        this.promptPasswordUpdate();
                    } else {
                        this.finishCredentialUpdate();
                    }
                } catch (error) {
                    window.toast.show(error.message, 'error');
                    this.promptEmailUpdate();
                }
            }
        );
    }

    promptPasswordUpdate() {
        window.modal.show({
            type: 'confirm',
            title: 'Update Initial Password',
            message: `
                <p style="margin-bottom: 15px;">Please set a new secure password for your account.</p>
                <div class="form-group">
                    <label>Current (Initial) Password</label>
                    <input type="password" id="modal-current-pw" class="form-input" style="width:100%">
                </div>
                <div class="form-group" style="margin-top: 10px;">
                    <label>New Secure Password</label>
                    <input type="password" id="modal-new-pw" class="form-input" style="width:100%">
                </div>
            `,
            confirmText: 'Update Password',
            onConfirm: async () => {
                const currentPassword = document.getElementById('modal-current-pw').value;
                const newPassword = document.getElementById('modal-new-pw').value;

                if (!currentPassword || !newPassword) {
                    window.toast.show('Both fields are required', 'warning');
                    return this.promptPasswordUpdate();
                }

                try {
                    const token = localStorage.getItem(TOKEN_KEY);
                    const response = await fetch(`${API_BASE}/auth/change-password`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ currentPassword, newPassword })
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.message || 'Failed to change password');
                    }

                    this.currentUser.mustChangePassword = false;
                    window.toast.show('Password updated successfully', 'success');
                    this.finishCredentialUpdate();
                } catch (error) {
                    window.toast.show(error.message, 'error');
                    this.promptPasswordUpdate();
                }
            }
        });
    }

    finishCredentialUpdate() {
        const main = document.querySelector('main');
        if (main) main.style.opacity = '1';
        window.modal.success('Security Synced', 'Your credentials have been updated. Welcome to MCMS!');
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
