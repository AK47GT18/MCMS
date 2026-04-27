import { AppLayout } from './layouts/AppLayout.js';
import { currentUser as mockUser, ROLES } from './config/roles.js'; // Keep as fallback
import { drawer } from './components/DrawerManager.js';
import { ModuleLoaderStrategy } from './src/strategies/ModuleLoaderStrategy.js';
import issues from './src/api/issues.api.js';
import { realtime } from './src/realtime/RealtimeClient.js';
import V from './components/ui/FormValidator.js';
import './components/ui/ToastManager.js';
import './components/ui/ModalManager.js';

// Expose validation utility globally for drawer templates
window.V = V;

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

// PWA Install Logic
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    console.log('[PWA] Deferred prompt stashed');
});

window.triggerPwaInstall = async () => {
    if (!deferredPrompt) {
        // Show manual install instructions since beforeinstallprompt
        // won't fire on self-signed certs
        const isAndroid = /android/i.test(navigator.userAgent);
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        
        let msg = '';
        if (isAndroid) {
            msg = '📲 To install: Tap the ⋮ menu (top right) → "Add to Home screen" or "Install app"';
        } else if (isIOS) {
            msg = '📲 To install: Tap the Share button (bottom) → "Add to Home Screen"';
        } else {
            msg = '📲 To install: Use your browser menu → "Install" or "Add to Home screen"';
        }
        
        alert(msg);
        return;
    }
    try {
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User response: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        deferredPrompt = null;
    } catch (err) {
        console.error('[PWA] Install failed:', err);
        alert('📲 To install: Use your browser menu (⋮) → "Add to Home screen"');
    }
};

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => {
                console.log('[PWA] ServiceWorker registered:', reg.scope);
                // Initialize push notifications after registration
                initPushNotifications(reg);
            })
            .catch(err => console.warn('[PWA] ServiceWorker failed:', err));
    });
}

async function initPushNotifications(registration) {
    if (!('PushManager' in window)) {
        console.warn('[Push] Push notifications not supported by this browser');
        return;
    }

    try {
        // Check if we already have a subscription
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
            console.log('[Push] User already subscribed');
            return;
        }

        // Auto-subscribe if permission already granted
        if (Notification.permission === 'granted') {
            subscribeUserToPush(registration);
        }
    } catch (err) {
        console.error('[Push] Init error:', err);
    }
}

async function subscribeUserToPush(registration) {
    try {
        // 1. Get public key from server
        const keyResponse = await fetch('/api/v1/push/key');
        const { data } = await keyResponse.json();
        const publicKey = data.publicKey;

        // 2. Subscribe with the key
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        console.log('[Push] Subscription successful:', subscription);

        // 3. Send subscription to server
        const token = localStorage.getItem('mcms_auth_token');
        await fetch('/api/v1/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subscription)
        });

        window.toast?.show('Notifications enabled successfully', 'success');
    } catch (err) {
        console.error('[Push] Subscription failed:', err);
        if (Notification.permission === 'denied') {
            console.warn('[Push] Permission for notifications was denied');
        }
    }
}

// Utility to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Expose trigger globally
window.requestNotificationPermission = async () => {
    if (!('serviceWorker' in navigator)) return;
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        subscribeUserToPush(registration);
    } else {
        window.toast?.show('Notification permission denied', 'warning');
    }
};

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
            
            // Initialize real-time WebSocket connection
            this.realtime = realtime;
            window.realtime = realtime;
            realtime.connect();
            realtime.subscribe('projects');
            realtime.subscribe('logistics');
            realtime.subscribe('assets');
            realtime.subscribe('requisitions');
            console.log('[WS] Real-time client initialized');

            // Render Shell
            this.layout.render();

            // Initial Page Load - Attempt to restore last session view
            const lastPage = localStorage.getItem('mcms_last_page');
            const initialPage = lastPage || 'dashboard';
            console.log(`[INIT] Loading initial page: ${initialPage}`);
            await this.loadPage(initialPage);
            this.layout.setActiveNavItem(initialPage);

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
        // Persist current page for session recovery
        localStorage.setItem('mcms_last_page', pageId);
        
        // Route-level permission control
        const ROUTE_PERMISSIONS = {
            'dashboard': [], // All authenticated users
            'users': ['System_Technician', 'System Technician', 'Project_Manager', 'Project Manager'],
            'audit': ['System_Technician', 'Managing_Director', 'System Technician', 'Managing Director', 'Project_Manager', 'Project Manager', 'Finance_Director', 'Finance Director', 'Equipment_Coordinator', 'Equipment Coordinator', 'Operations_Manager', 'Operations Manager'],
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

            // Expose FM module globally for Finance Director contract creation
            if (this.currentUser.role === 'Finance Director' || this.currentUser.role === 'Finance_Director') {
                this.fmModule = module;
            }

            // Expose EC module globally for Equipment Coordinator distribution
            if (this.currentUser.role === 'Equipment Coordinator' || this.currentUser.role === 'Equipment_Coordinator') {
                this.ecModule = module;
            }

            // Expose FS module globally for Field Supervisor consumption
            if (this.currentUser.role === 'Field Supervisor' || this.currentUser.role === 'Field_Supervisor') {
                this.fsModule = module;
            }

            // Expose CA module globally for document interactions
            if (this.currentUser.role === ROLES.CONTRACT_ADMIN || this.currentUser.role === 'Contract Administrator' || this.currentUser.role === 'Contract_Administrator') {
                this.caModule = module;
            }
            
            // Expose techModule globally for System Technician role
            if (this.currentUser.role === 'System Technician' || this.currentUser.role === 'System_Technician') {
                window.techModule = module;
            }

            if (module) {
                module.currentView = pageId;
                content = await module.render();

                // Trigger PWA prompt hint for Field Supervisors on dashboard load
                if (this.currentUser.role === 'Field Supervisor' && pageId === 'dashboard') {
                    setTimeout(() => {
                        console.log('[PWA] Checking for install eligibility...');
                        // Note: actual prompt() requires user gesture, 
                        // so we just log or could show a subtle hint.
                        // But per user request to "trigger", we'll attempt if ready.
                    }, 2000);
                }
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

    // Generic Issue Submission Handler (works for all roles)
    async handleIssueSubmit() {
        try {
            const category = document.getElementById('issue-category')?.value;
            const priority = document.getElementById('issue-priority')?.value;
            const description = document.getElementById('issue-description')?.value;
            
            // Try to get project ID - with validation
            let projectId = window.currentIssueProjectId;
            
            // Check if user selected a project from the dropdown
            const projectSelectEl = document.getElementById('issue-project');
            if (projectSelectEl) {
                const selectedValue = projectSelectEl.value;
                if (selectedValue) {
                    projectId = parseInt(selectedValue);
                    console.log('[Issue Submit] Project selected from dropdown:', projectId);
                } else {
                    console.warn('[Issue Submit] Dropdown visible but no project selected');
                }
            }
            
            // Fallback to module's selected project
            if (!projectId && this.pmModule?.selectedProjectId) {
                projectId = this.pmModule.selectedProjectId;
                console.log('[Issue Submit] Using pmModule.selectedProjectId:', projectId);
            }
            
            // Fallback to window variable
            if (!projectId) {
                projectId = window.currentProjectId;
                console.log('[Issue Submit] Using window.currentProjectId:', projectId);
            }
            
            // Fallback to URL params
            if (!projectId) {
                const urlParams = new URLSearchParams(window.location.search);
                projectId = parseInt(urlParams.get('projectId'));
                console.log('[Issue Submit] Using URL projectId:', projectId);
            }

            // Validate description
            if (!description || description.trim() === '') {
                window.toast.show('❌ Description required: Please explain the issue', 'error');
                document.getElementById('issue-description')?.focus();
                return;
            }

            // Validate project ID
            if (!projectId || isNaN(projectId)) {
                const errorEl = document.getElementById('issue-project-error');
                if (errorEl) {
                    errorEl.style.display = 'block';
                    document.getElementById('issue-project')?.focus();
                }
                window.toast.show('❌ Project required: Please select a project from the dropdown', 'error');
                console.warn('[Issue Submit] No valid projectId found:', {
                    currentIssueProjectId: window.currentIssueProjectId,
                    projectSelectValue: projectSelectEl?.value,
                    pmModuleSelected: this.pmModule?.selectedProjectId,
                    windowProjectId: window.currentProjectId,
                    urlParam: new URLSearchParams(window.location.search).get('projectId')
                });
                return;
            }

            console.log('[Issue Submit] ✅ All validation passed. Submitting for project:', projectId);
            window.toast.show('✅ Submitting issue report...', 'info');
            
            const result = await issues.create({
                projectId: parseInt(projectId),
                category: category || 'General',
                priority: priority || 'Medium',
                description: description.trim(),
                status: 'open'
            });

            console.log('[Issue Submit] ✅ Issue created successfully:', result);
            window.toast.show('✅ Issue submitted! Issue Code: ' + (result.issueCode || result.id), 'success');
            
            // Close drawer after slight delay
            setTimeout(() => {
                window.drawer.close();
            }, 500);
            
            // Clear the stored project context
            window.currentIssueProjectId = null;
            
            // Reload issues if in issues view
            if (this.pmModule?.currentView === 'issues') {
                console.log('[Issue Submit] Refreshing issues list');
                this.pmModule.loadIssuesFromAPI();
            }
            
        } catch (error) {
            console.error('[Issue Submit] ❌ Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
            window.toast.show('❌ Failed to submit: ' + errorMsg, 'error');
        }
    }

    // Helper method to open issue drawer with project context
    openIssueDrawer(projectId = null, title = 'Report Issue') {
        window.currentIssueProjectId = projectId;
        window.drawer.open(title, window.DrawerTemplates.submitComplaint);
    }
}

window.EXPENSE_RATES = {
    'Fuel': 3000,
    'Cement': 25000,
    'Aggregate': 40000,
    'Labor': 15000,
    'Equipment': 100000
};

window.calculateExpenses = () => {
    const rows = document.querySelectorAll('.expense-item-row');
    let total = 0;
    rows.forEach(row => {
        const cat = row.querySelector('.exp-cat').value;
        const qty = parseFloat(row.querySelector('.exp-qty').value) || 0;
        const rate = window.EXPENSE_RATES[cat] || 0;
        const cost = qty * rate;
        row.querySelector('.exp-cost').innerText = cost.toLocaleString() + ' MWK';
        total += cost;
    });
    const totalEl = document.getElementById('daily-total-expense');
    if (totalEl) totalEl.innerText = total.toLocaleString() + ' MWK';
    
    // Update wallet
    const balEl = document.getElementById('wallet-balance');
    if (balEl) {
        const bal = 800000 - total;
        balEl.innerText = bal.toLocaleString();
        balEl.style.color = bal < 0 ? '#ef4444' : 'white';
    }
};

window.addExpenseRow = () => {
    const container = document.getElementById('expense-rows');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'expense-item-row';
    div.style.cssText = 'display:grid; grid-template-columns:2fr 1fr 1fr auto; gap:8px; align-items:end; padding-bottom:8px; border-bottom:1px solid var(--slate-200);';
    div.innerHTML = `
        <div>
            <label style="font-size:10px; color:var(--slate-500);">Category</label>
            <select class="form-input exp-cat" style="padding:4px 8px; font-size:12px;" onchange="window.calculateExpenses()">
                <option value="">Select...</option>
                <option value="Fuel">Fuel (3k/L)</option>
                <option value="Cement">Cement (25k/bag)</option>
                <option value="Aggregate">Aggregate (40k/ton)</option>
                <option value="Labor">Labor (15k/day)</option>
                <option value="Equipment">Equipment (100k/hr)</option>
            </select>
        </div>
        <div>
            <label style="font-size:10px; color:var(--slate-500);">Qty</label>
            <input type="number" class="form-input exp-qty" style="padding:4px 8px; font-size:12px;" min="1" value="1" oninput="window.calculateExpenses()">
        </div>
        <div>
            <label style="font-size:10px; color:var(--slate-500);">Cost</label>
            <div class="exp-cost" style="font-size:12px; font-weight:700; padding:6px 0;">0 MWK</div>
        </div>
        <button class="btn btn-secondary" style="padding:4px 8px; color:var(--red); border-color:var(--red-light); background:var(--red-light);" onclick="this.parentElement.remove(); window.calculateExpenses()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(div);
};

// =============================================
// PHOTO GALLERY SYSTEM (Min 3, Max 10)
// =============================================
window.photoGalleries = {};

window.initPhotoGallery = (galleryId) => {
    if (!window.photoGalleries[galleryId]) {
        window.photoGalleries[galleryId] = [];
    }
};

window.handlePhotoCapture = async (input, galleryId) => {
    window.initPhotoGallery(galleryId);
    const gallery = window.photoGalleries[galleryId];
    const files = Array.from(input.files);
    
    if (files.length === 0) return;

    // Request GPS once for this batch
    let geo = null;
    try {
        if (navigator.geolocation) {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { 
                    enableHighAccuracy: true, 
                    timeout: 5000 
                });
            });
            geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }
    } catch (e) {
        console.warn('GPS tagging failed for photo:', e);
    }

    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            window.toast.show(`Invalid file type: ${file.name}`, 'error');
            continue;
        }

        if (gallery.length >= 10) {
            window.toast.show('Maximum 10 photos allowed!', 'warning');
            break;
        }

        const reader = new FileReader();
        window.toast.show('Processing & Tagging...', 'info');
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                gallery.push({ 
                    name: file.name, 
                    dataUrl: e.target.result, 
                    file: file, 
                    timestamp: Date.now(),
                    location: geo, // Attached GPS tag
                    metadata: {
                        size: file.size,
                        type: file.type,
                        width: img.width,
                        height: img.height
                    }
                });
                window.renderPhotoGallery(galleryId);
                const geoTagText = geo ? `[Tagged at ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}]` : '[GPS Missing]';
                window.toast.show(`Evidence captured ${geoTagText}`, 'success');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    input.value = '';
};

// --- WebRTC PC Camera Fallback ---
window.activeWebcamStream = null;
window.activeGalleryId = null;

window.handleCameraClick = (event, galleryId) => {
    // Detect if desktop (not mobile)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
        event.preventDefault(); // Stop file picker
        window.activeGalleryId = galleryId;
        const modal = document.getElementById('webrtc-camera-modal');
        const video = document.getElementById('webrtc-video');
        if (modal && video) {
            modal.style.display = 'flex';
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    window.activeWebcamStream = stream;
                    video.srcObject = stream;
                })
                .catch(err => {
                    console.error('Webcam access failed:', err);
                    window.toast.show('Webcam access denied. Please allow camera permissions.', 'error');
                    window.closeWebcamModal();
                });
        }
        return false;
    }
    return true; // Let mobile native camera open
};

window.closeWebcamModal = () => {
    const modal = document.getElementById('webrtc-camera-modal');
    if (modal) modal.style.display = 'none';
    if (window.activeWebcamStream) {
        window.activeWebcamStream.getTracks().forEach(track => track.stop());
        window.activeWebcamStream = null;
    }
    window.activeGalleryId = null;
};

window.captureFromWebcam = async () => {
    const video = document.getElementById('webrtc-video');
    const canvas = document.getElementById('webrtc-canvas');
    if (!video || !canvas || !window.activeGalleryId) return;

    // Check limit
    window.initPhotoGallery(window.activeGalleryId);
    const gallery = window.photoGalleries[window.activeGalleryId];
    if (gallery.length >= 10) {
        window.toast.show('Maximum 10 photos allowed!', 'warning');
        return;
    }

    // Capture GPS
    let geo = null;
    try {
        if (navigator.geolocation) {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            });
            geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }
    } catch(e) { console.warn('GPS failed for webcam capture'); }

    // Draw video frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    gallery.push({
        name: `webcam-${Date.now()}.jpg`,
        dataUrl: dataUrl,
        file: null, 
        timestamp: Date.now(),
        location: geo // GPS Tagging
    });

    window.renderPhotoGallery(window.activeGalleryId);
    window.toast.show(geo ? `Photo snapped with GPS tag!` : 'Photo snapped (GPS missing)', 'success');
};
// ---------------------------------

window.removePhoto = (galleryId, index) => {
    if (window.photoGalleries[galleryId]) {
        window.photoGalleries[galleryId].splice(index, 1);
        window.renderPhotoGallery(galleryId);
    }
};

window.renderPhotoGallery = (galleryId) => {
    const gallery = window.photoGalleries[galleryId] || [];
    const container = document.getElementById(`photo-preview-${galleryId}`);
    const counter = document.getElementById(`photo-counter-${galleryId}`);
    const addBtn = document.getElementById(`photo-add-btn-${galleryId}`);
    
    if (!container) return;
    
    // Update counter
    if (counter) {
        const count = gallery.length;
        let color = 'var(--red)';
        if (count >= 3 && count <= 10) color = 'var(--emerald)';
        else if (count > 0) color = 'var(--orange)';
        counter.innerHTML = `<span style="color:${color}; font-weight:700;">${count}</span>/10 photos <span style="font-size:10px; color:var(--slate-400);">(min 3)</span>`;
    }
    
    // Show/hide add button at max
    if (addBtn) {
        addBtn.style.display = gallery.length >= 10 ? 'none' : 'block';
    }
    
    // Render thumbnails
    if (gallery.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--slate-400); font-size:12px; padding:8px;">No photos yet. Tap the button above to capture.</div>';
        return;
    }
    
    container.innerHTML = gallery.map((photo, i) => `
        <div style="position:relative; width:72px; height:72px; flex-shrink:0; border-radius:8px; overflow:hidden; border:2px solid var(--slate-200);">
            <img src="${photo.dataUrl}" style="width:100%; height:100%; object-fit:cover;" alt="Photo ${i+1}">
            <button onclick="window.removePhoto('${galleryId}', ${i})" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                <i class="fas fa-times"></i>
            </button>
            <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.5); color:white; font-size:8px; text-align:center; padding:1px;">${i+1}</div>
        </div>
    `).join('');
};

window.validatePhotos = (galleryId) => {
    const gallery = window.photoGalleries[galleryId] || [];
    if (gallery.length < 3) {
        window.toast.show(`Minimum 3 photos required! You have ${gallery.length}.`, 'error');
        return false;
    }
    if (gallery.length > 10) {
        window.toast.show('Maximum 10 photos allowed!', 'error');
        return false;
    }

    // Check for 10-minute expiry
    const now = Date.now();
    for (let i = 0; i < gallery.length; i++) {
        if (gallery[i].timestamp && (now - gallery[i].timestamp > 600000)) { // 10 minutes
            window.photoGalleries[galleryId] = []; // WIPE GALLERY
            window.renderPhotoGallery(galleryId);
            window.toast.show('Photos expired (10 min limit). Please retake.', 'error');
            return false;
        }
    }

    return true;
};

window.submitDailyProgressLog = (btn) => {
    if (!window.validatePhotos('progressLog')) return;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying site coordinates...';
    btn.disabled = true;

    const rows = document.querySelectorAll('.expense-item-row');
    const items = Array.from(rows).map(row => {
        const cat = row.querySelector('.exp-cat').value;
        const qty = parseFloat(row.querySelector('.exp-qty').value) || 0;
        const rate = window.EXPENSE_RATES[cat] || 0;
        return { category: cat, quantity: qty, unitPrice: rate, totalCost: qty * rate, description: '' };
    }).filter(i => i.category && i.quantity > 0);

    // Find whichever module has handleDailyLogSubmit
    const module = [window.app.pmModule, window.app.fsModule, window.app.caModule]
        .find(m => m && typeof m.handleDailyLogSubmit === 'function');
    
    if (!module) {
        // Fallback: use pmModule directly since that's where the method is defined
        window.toast.show('Submitting via project manager module...', 'info');
        const pm = window.app.pmModule;
        if (!pm) {
            window.toast.show('No module available to handle submission', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }
    }

    (module || window.app.pmModule).handleDailyLogSubmit({
        taskId: document.getElementById('daily-log-task-id')?.value,
        progressIncrement: document.getElementById('daily-progress-increment')?.value,
        narrative: document.getElementById('daily-narrative')?.value,
        expenseItems: items,
        sos: document.getElementById('sos-toggle')?.checked
    }).finally(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }).catch(e => console.warn('Caught rejected promise at top level:', e));
};

// Start App
document.addEventListener('DOMContentLoaded', async () => {
    // Globals for Inline Handlers
    const { DrawerTemplates } = await import('./components/DrawerTemplates.js');
    window.DrawerTemplates = DrawerTemplates;

    window.app = new App();
});
