import { currentUser as mockUser, ROLES } from '../config/roles.js';
import { NAV_ITEMS } from '../config/navConfig.js';
import { DrawerTemplates } from '../components/DrawerTemplates.js';
import { modal } from '../components/ui/ModalManager.js';
import { toast } from '../components/ui/ToastManager.js';
import notificationsApi from '../src/api/notifications.api.js';
import client from '../src/api/client.js';

// Get current user dynamically (from main.js real auth or fallback to mock)
const getCurrentUser = () => window.currentUser || mockUser;

export class AppLayout {
    constructor() {
        this.appContainer = document.getElementById('app');
        this.roleTitles = {
            [ROLES.FINANCE_DIRECTOR]: 'FINANCE',
            [ROLES.PROJECT_MANAGER]: 'PROJECTS',
            [ROLES.FIELD_SUPERVISOR]: 'OPERATIONS',
            [ROLES.CONTRACT_ADMIN]: 'CONTRACTS',
            [ROLES.EQUIPMENT_COORDINATOR]: 'FLEET',
            [ROLES.OPERATIONS_MANAGER]: 'OPERATIONS',
            [ROLES.MANAGING_DIRECTOR]: 'EXECUTIVE',
            [ROLES.SYSTEM_TECHNICIAN]: 'SYSTEM'
        };

        // --- LIVE NOTIFICATION STATE ---
        this.notifications = [];
        this.unreadCount = 0;
        this._wsListenerSetup = false;
    }

    render() {
        this.appContainer.innerHTML = '';
        const currentUser = getCurrentUser();
        const roleKey = currentUser.role ? currentUser.role.replace(/_/g, ' ') : '';
        const navSections = NAV_ITEMS[roleKey] || NAV_ITEMS[currentUser.role] || [];
        const allItems = navSections.flatMap(s => s.items);

        // Optimize mobile nav: limit to 5 items max for better UX
        let mobileItems = allItems;
        if (currentUser.role === ROLES.FIELD_SUPERVISOR && allItems.length > 5) {
            mobileItems = allItems.slice(0, 4);
            mobileItems.push({
                label: 'Reporting',
                icon: '<i class="fas fa-clipboard-check"></i>',
                id: 'mobile_reporting',
                action: 'drawer',
                drawerId: 'reportingMenu'
            });
        }

        const sidebarHTML = this.generateSidebar(navSections);
        const mobileNavHTML = this.generateMobileNav(mobileItems);
        const topBarHTML = this.generateTopBar();

        this.appContainer.innerHTML = `
            ${sidebarHTML}
            <div class="app-main">
                ${topBarHTML}
                <main id="main-content" class="main-content-area">
                    <!-- Page Content Injected Here -->
                </main>
                ${mobileNavHTML}
            </div>
        `;

        this.attachEventListeners();

        // Load notifications from API
        this._loadNotifications();
        // Setup real-time listener
        this._setupRealtimeNotifications();
    }

    // =============================================
    // NOTIFICATION DATA LAYER (API + WebSocket)
    // =============================================

    async _loadNotifications() {
        try {
            const result = await notificationsApi.getAll({ limit: 15 });
            const data = result.data || result;

            this.notifications = (data.notifications || [])
                .filter(n => !n.isRead) // Filter out read ones so they "disappear" as requested
                .map(n => ({
                    id: n.id,
                    type: n.type || 'info',
                    icon: n.icon || 'fa-bell',
                    title: n.title || 'Notification', // Fallback for undefined
                    desc: n.message || 'New update available', // Fallback for undefined
                    time: this._formatTime(n.createdAt),
                    isRead: n.isRead
                }));
            this.unreadCount = data.unreadCount || 0;

            this._renderNotificationBadge();
            this._renderNotificationList();
        } catch (error) {
            console.error('[Notifications] Failed to load:', error);
            // Keep UI functional with empty state
            this.notifications = [];
            this.unreadCount = 0;
            this._renderNotificationBadge();
            this._renderNotificationList();
        }
    }

    _setupRealtimeNotifications() {
        if (this._wsListenerSetup) return;

        const trySetup = () => {
            if (window.realtime) {
                window.realtime.on('NOTIFICATION', (data) => {
                    console.log('[Notifications][WS] New notification:', data);

                    // Prepend to local list
                    this.notifications.unshift({
                        id: data.id,
                        type: data.type || 'info',
                        icon: data.icon || 'fa-bell',
                        title: data.title || 'Notification',
                        desc: data.message || 'New update available',
                        time: this._formatTime(data.createdAt || new Date()),
                        isRead: false
                    });

                    this.unreadCount++;

                    // Update UI
                    this._renderNotificationBadge();
                    this._renderNotificationList();

                    // Show toast for the new notification
                    if (window.toast) {
                        window.toast.show(`${data.title}: ${data.message}`, data.type || 'info');
                    }
                });

                this._wsListenerSetup = true;
                console.log('[Notifications] Real-time listener active');
            } else {
                setTimeout(trySetup, 2000);
            }
        };

        trySetup();
    }

    _formatTime(dateStr) {
        if (!dateStr) return 'Just now';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    }

    _renderNotificationBadge() {
        const badge = document.getElementById('notif-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 10 ? '10+' : this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    _renderNotificationList() {
        const list = document.getElementById('notification-list');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div style="padding: 32px 16px; text-align: center; color: var(--slate-400);">
                    <i class="fas fa-bell-slash" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <div style="font-weight: 600; font-size: 13px;">No notifications yet</div>
                    <div style="font-size: 11px; margin-top: 4px;">You're all caught up!</div>
                </div>
            `;
            return;
        }

        list.innerHTML = this.notifications.map(n => `
            <div class="notification-item ${n.isRead ? 'read' : ''}" data-notif-id="${n.id}" onclick="window.app.layout.handleNotificationClick(${n.id})" style="cursor:pointer; ${!n.isRead ? 'background: #f0f7ff;' : ''}">
                <div class="notif-icon ${n.type}"><i class="fas ${n.icon}"></i></div>
                <div class="notif-content">
                    <div class="notif-title" style="${!n.isRead ? 'font-weight: 800;' : ''}">${n.title}</div>
                    <div class="notif-desc">${n.desc}</div>
                    <div class="notif-time">${n.time}</div>
                </div>
                ${!n.isRead ? '<div style="width:8px; height:8px; border-radius:50%; background: var(--blue); flex-shrink:0; margin-top: 6px;"></div>' : ''}
            </div>
        `).join('');
    }

    async handleNotificationClick(id) {
        // Mark as read via API
        try {
            await notificationsApi.markRead(id);
            const notif = this.notifications.find(n => n.id === id);
            if (notif && !notif.isRead) {
                notif.isRead = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this._renderNotificationBadge();
                this._renderNotificationList();
            }
        } catch (e) {
            console.error('[Notifications] Mark read failed:', e);
        }
    }

    async handleMarkAllRead() {
        try {
            await notificationsApi.markAllRead();
            this.notifications = [];
            this.unreadCount = 0;
            this._renderNotificationBadge();
            this._renderNotificationList();
            window.toast?.show('All notifications marked as read.', 'success');
        } catch (e) {
            console.error('[Notifications] Mark all read failed:', e);
        }
    }

    // =============================================
    // LAYOUT GENERATION
    // =============================================

    generateSidebar(sections) {
        const currentUser = getCurrentUser();
        const dashboardTitle = this.roleTitles[currentUser.role] || 'DASHBOARD';
        
        const sectionsHTML = sections.map(section => `
            <div class="nav-section">
                <div class="nav-label">${section.section}</div>
                ${section.items.map(item => `
                    <a href="#" class="nav-link ${item.active ? 'active' : ''}" data-id="${item.id}" ${item.action ? `data-action="${item.action}"` : ''} ${item.drawerId ? `data-drawer-id="${item.drawerId}"` : ''}>
                        <span class="nav-icon">${item.icon}</span>
                        <span>${item.label}</span>
                        ${item.badge ? `<span class="nav-badge" style="margin-left:auto; background:var(--red); color:white; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700;">${item.badge}</span>` : ''}
                    </a>
                `).join('')}
            </div>
        `).join('');

        return `
            <aside class="sidebar hidden-mobile">
                <div class="logo" onclick="window.app.loadPage('dashboard')" style="cursor: pointer;">
                     <div class="logo-icon">
                        <span class="material-symbols-outlined">architecture</span>
                    </div>
                    <div class="logo-text">
                        MKAKA <span style="color: var(--orange);">${dashboardTitle}</span>
                    </div>
                </div>
                <div class="sidebar-header">
                     <div class="user-profile">
                        <div class="profile-avatar" style="background: var(--slate-800);">${this.getInitials(currentUser.name)}</div>
                        <div class="profile-info">
                            <div class="profile-name">${currentUser.name}</div>
                            <div class="profile-role">${currentUser.role}</div>
                        </div>
                    </div>
                </div>
                <nav class="sidebar-nav">
                    ${sectionsHTML}
                </nav>
            </aside>
        `;
    }

    generateMobileNav(items) {
        const linksHTML = items.map(item => `
            <a href="#" class="mobile-nav-item ${item.active ? 'active' : ''}" data-id="${item.id}" ${item.action ? `data-action="${item.action}"` : ''} ${item.drawerId ? `data-drawer-id="${item.drawerId}"` : ''}>
                ${item.icon}
                <span>${item.label}</span>
            </a>
        `).join('');

        return `
            <nav class="mobile-nav hidden-desktop">
                ${linksHTML}
            </nav>
        `;
    }

    generateTopBar() {
        const currentUser = getCurrentUser();

        return `
            <header class="top-bar hidden-mobile">
                <div class="breadcrumb">
                    <span>Workspace</span>
                 </div>
                <div style="margin-left: auto; display: flex; gap: 16px; align-items: center;">
                    
                    ${currentUser.role !== 'Project_Manager' && currentUser.role !== 'Project Manager' ? `
                    <button class="btn btn-secondary btn-sm" style="margin-right: 12px; font-size: 11px; padding: 6px 10px; background: white; border-color: var(--slate-200); color: var(--orange-600); font-weight: 700;" onclick="window.app.layout.openTimelineExtensionDrawer()">
                        <i class="fas fa-calendar-plus" style="margin-right: 4px;"></i> Extend Timeline
                    </button>
                    ` : ''}

                    <!-- Notification Bell Wrapper -->
                    <div style="position: relative;">
                        <button id="notification-bell" class="btn btn-secondary" style="border: none; padding: 8px; position: relative;" onclick="window.app.layout.toggleNotifications(event)">
                            <i class="fas fa-bell" style="color: var(--slate-500); font-size: 16px;"></i>
                            <span id="notif-badge" style="
                                position: absolute;
                                top: 0;
                                right: 0;
                                background: var(--red);
                                color: white;
                                font-size: 10px;
                                font-weight: 700;
                                min-width: 16px;
                                height: 16px;
                                border-radius: 8px;
                                display: none;
                                align-items: center;
                                justify-content: center;
                                padding: 0 4px;
                                border: 2px solid var(--white);
                                transform: translate(25%, -25%);
                            ">0</span>
                        </button>
                        
                        <!-- Dropdown -->
                        <div id="notification-dropdown" class="notification-dropdown">
                            <div class="notification-header">
                                <span>Notifications</span>
                                <button class="view-all-btn" onclick="window.app.layout.handleMarkAllRead()">Mark all read</button>
                            </div>
                            <div class="notification-list" id="notification-list">
                                <div style="padding: 24px; text-align: center; color: var(--slate-400);">
                                    <i class="fas fa-circle-notch fa-spin" style="font-size: 16px;"></i>
                                    <div style="font-size: 12px; margin-top: 8px;">Loading…</div>
                                </div>
                            </div>
                            <div class="notification-footer">
                                <button class="view-all-btn" onclick="window.requestNotificationPermission()">Enable Push</button>
                                <button class="view-all-btn" onclick="window.app.layout._loadNotifications()">Refresh</button>
                            </div>
                        </div>
                    </div>

                    <div class="user-profile">
                        <div class="profile-avatar" style="background: var(--slate-800);">${this.getInitials(currentUser.name)}</div>
                    </div>
                </div>
            </header>
        `;
    }

    getInitials(name) {
        return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'UR';
    }

    toggleNotifications(e) {
        if(e) e.stopPropagation();
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            
            if (dropdown.classList.contains('show')) {
                // Refresh each time it opens
                this._loadNotifications();

                const closeDropdown = (ev) => {
                    if (!dropdown.contains(ev.target) && !ev.target.closest('#notification-bell')) {
                        dropdown.classList.remove('show');
                        document.removeEventListener('click', closeDropdown);
                    }
                };
                document.addEventListener('click', closeDropdown);
            }
        }
    }

    attachEventListeners() {
        // Toggle Profile Drawer on avatar/info click
        document.querySelectorAll('.user-profile').forEach(profile => {
            profile.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProfileDrawer();
            });
        });

        // Navigation links
        document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.closest('a');
                if (target.dataset.action === 'drawer') {
                    const drawerId = target.dataset.drawerId || 'transactionEntry';
                    const drawerTitles = {
                        'transactionEntry': 'Transaction Entry',
                        'submitComplaint': 'Report Issue',
                        'whistleblowerPortal': 'Whistleblower Portal',
                        'safetyIncident': 'Report Safety Incident',
                        'dailyReport': 'Daily Report',
                        'assignEquipment': 'Assign Equipment'
                    };
                    const title = drawerTitles[drawerId] || 'Details';
                    
                    if (drawerId === 'submitComplaint') {
                        const projectId = window.app?.pmModule?.selectedProjectId || null;
                        window.app?.openIssueDrawer(projectId, title);
                    } else if (drawerId === 'safetyIncident') {
                        // safetyIncident is a function template - invoke it
                        window.drawer.open(title, DrawerTemplates.safetyIncident());
                    } else {
                        const template = DrawerTemplates[drawerId];
                        if (template) {
                            window.drawer.open(title, typeof template === 'function' ? template() : template);
                        }
                    }
                } else {
                    const id = target.dataset.id;
                    this.setActiveNavItem(id);
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { id } }));
                }
            });
        });
    }

    setActiveNavItem(id) {
        // Handle logical aliases (e.g. 'dashboard' vs 'portfolio' for PMs)
        const aliases = {
            'dashboard': ['portfolio', 'dashboard'],
            'portfolio': ['portfolio', 'dashboard']
        };

        const targetIds = aliases[id] || [id];

        document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(el => {
            if (targetIds.includes(el.dataset.id)) {
                el.classList.add('active');
                
                // Ensure parent sections or groups are visually highlighted if needed
                const section = el.closest('.nav-section');
                if (section) {
                    section.querySelector('.nav-label').style.color = 'var(--slate-900)';
                }
            } else {
                el.classList.remove('active');
                
                const section = el.closest('.nav-section');
                if (section) {
                    section.querySelector('.nav-label').style.color = 'var(--slate-400)';
                }
            }
        });
    }

    injectContent(html) {
        document.getElementById('main-content').innerHTML = html;
    }

    showProfileDrawer() {
        const currentUser = getCurrentUser();
        const contentHTML = `
            <div style="padding: 24px; border-bottom: 1px solid var(--slate-200); background: var(--slate-50); text-align: center;">
                <div style="width: 64px; height: 64px; background: var(--white); color: var(--slate-600); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm);">
                    <i class="fas fa-id-card-clip"></i>
                </div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--slate-900); margin: 0;">${currentUser.name}</h3>
                <p style="color: var(--slate-500); font-size: 13px; margin: 4px 0 0;">${currentUser.role}</p>
            </div>

            <div class="drawer-section">
                <button class="btn btn-secondary" style="width: 100%; justify-content: center; gap: 8px; font-weight: 600; margin-bottom: 16px; background: #EEF2FF; color: #4F46E5; border-color: #C7D2FE;" onclick="window.requestNotificationPermission()">
                    <i class="fas fa-bell"></i> Enable App Notifications
                </button>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="form-group">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-user-tag" style="color: var(--slate-400); width: 16px;"></i> Full Name
                        </label>
                        <div class="form-input" style="background: var(--slate-50); border-color: var(--slate-200); color: var(--slate-600); font-weight: 500;">${currentUser.name}</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-envelope" style="color: var(--slate-400); width: 16px;"></i> Email Address
                        </label>
                        <div class="form-input" style="background: var(--slate-50); border-color: var(--slate-200); color: var(--slate-600); font-weight: 500;">${currentUser.email || 'N/A'}</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-phone" style="color: var(--slate-400); width: 16px;"></i> Phone Number
                        </label>
                        <div class="form-input" style="background: var(--slate-50); border-color: var(--slate-200); color: var(--slate-600); font-weight: 500;">${currentUser.phone || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div class="drawer-section" style="border-bottom: none;">
                <div id="password-section">
                    <button class="btn btn-secondary" style="width: 100%; justify-content: center; gap: 8px; font-weight: 600;" onclick="document.getElementById('password-form').style.display='flex'; this.style.display='none';">
                        <i class="fas fa-shield-halved"></i> Privacy & Password
                    </button>
                    
                    <div id="password-form" style="display: none; flex-direction: column; gap: 16px; margin-top: 12px; padding: 20px; background: var(--slate-50); border-radius: 12px; border: 1px solid var(--slate-200);">
                        <div class="form-group">
                            <label class="form-label">Current Password</label>
                            <input type="password" id="pw_current" class="form-input" data-vrules="required|minLen:4" placeholder="••••••••" style="background: var(--white);">
                        </div>
                        <div class="form-group">
                            <label class="form-label">New Password</label>
                            <input type="password" id="pw_new" class="form-input" data-vrules="required|password" placeholder="••••••••" style="background: var(--white);" oninput="window.V?.checkPasswordStrength(this)">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Confirm New Password</label>
                            <input type="password" id="pw_confirm" class="form-input" data-vrules="required|match:pw_new" placeholder="••••••••" style="background: var(--white);">
                        </div>
                        <button class="btn btn-primary" style="width: 100%; justify-content: center; font-weight: 700; margin-top: 8px;" onclick="if(!window.V.validateForm(document.getElementById('password-form'))){return}window.app.layout.handlePasswordUpdate()">
                            Update Securely
                        </button>
                    </div>
                </div>
                 <button class="btn" style="width: 100%; justify-content: center; gap: 8px; font-weight: 600; margin-top: 16px; color: var(--red); border: 1px solid var(--red-light); background: #FEF2F2;" onclick="window.app.layout.handleLogout()">
                    <i class="fas fa-right-from-bracket"></i> Sign Out
                </button>
            </div>
        `;

        window.drawer.open('User Profile', contentHTML);
    }

    async openTimelineExtensionDrawer() {
        try {
            const result = await client.get('/projects');
            const data = result.data || result || [];
            
            window.drawer.open('Request Timeline Extension', DrawerTemplates.requestTimelineExtension(data));
        } catch (error) {
            console.error('Failed to load projects:', error);
            window.drawer.open('Request Timeline Extension', DrawerTemplates.requestTimelineExtension([]));
        }
    }

    async handleTimelineProjectChange(projectId, projects) {
        const project = projects.find(p => p.id == projectId);
        const endContainer = document.getElementById('ext-req-current-end');
        const phaseSelect = document.getElementById('ext-req-phase-id');
        
        if (endContainer) {
            if (project && project.endDate) {
                this._selectedProjectForExtension = project;
                const date = new Date(project.endDate);
                endContainer.textContent = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                // Set min date for new end date
                const minDate = project.endDate.split('T')[0];
                document.getElementById('ext-req-new-date').min = minDate;

                // Populate Phases (Tasks for this project)
                if (phaseSelect) {
                    phaseSelect.innerHTML = '<option value="">Full Project Timeline</option>';
                    try {
                        const tasksApi = await import('../src/api/tasks.api.js');
                        const result = await tasksApi.default.getByProject(projectId);
                        const tasks = result.data || result || [];
                        tasks.filter(t => !t.parentId).forEach(t => {
                            const opt = document.createElement('option');
                            opt.value = t.id;
                            opt.textContent = t.name;
                            phaseSelect.appendChild(opt);
                        });
                    } catch (e) { console.error('Phases load error:', e); }
                }
            } else {
                endContainer.textContent = '—';
                if (phaseSelect) phaseSelect.innerHTML = '<option value="">Full Project Timeline</option>';
            }
        }
        this.updateExtensionBadge();
    }

    updateExtensionBadge() {
        const currentEndStr = document.getElementById('ext-req-current-end')?.textContent;
        const newEndStr = document.getElementById('ext-req-new-date')?.value;
        const badge = document.getElementById('ext-req-days-badge');
        const text = document.getElementById('ext-req-days-text');

        if (currentEndStr && currentEndStr !== '—' && newEndStr) {
            const current = new Date(currentEndStr);
            const next = new Date(newEndStr);
            const diffTime = next - current;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                text.textContent = `Extension: +${diffDays} days`;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        } else {
            badge.style.display = 'none';
        }
    }

    calculateNewEndDate() {
        const daysInput = document.getElementById('ext-req-days-input');
        const newDateInput = document.getElementById('ext-req-new-date');
        const project = this._selectedProjectForExtension;

        if (project && project.endDate && daysInput && daysInput.value > 0) {
            const current = new Date(project.endDate);
            const daysToAdd = parseInt(daysInput.value);
            const newDate = new Date(current.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
            
            // Format for date input (YYYY-MM-DD)
            const year = newDate.getFullYear();
            const month = String(newDate.getMonth() + 1).padStart(2, '0');
            const day = String(newDate.getDate()).padStart(2, '0');
            newDateInput.value = `${year}-${month}-${day}`;
            
            this.updateExtensionBadge();
        }
    }

    handleTimelinePhaseChange(phaseId) {
        this.updateExtensionBadge();
    }

    updateCharCount(val) {
        const count = val.length;
        const el = document.getElementById('ext-req-char-count');
        if (el) {
            el.textContent = `${count} / 20 min`;
            el.style.color = count >= 20 ? 'var(--emerald)' : 'var(--slate-400)';
        }
    }

    async handleSubmitExtensionRequest() {
        const projectId = document.getElementById('ext-req-project-id')?.value;
        const newDate = document.getElementById('ext-req-new-date')?.value;
        const justification = document.getElementById('ext-req-justification')?.value;
        const warning = document.getElementById('ext-req-warning');
        const btn = document.getElementById('ext-req-submit-btn');

        if (!projectId || !newDate || !justification) {
            warning.textContent = 'Please fill in all required fields.';
            warning.style.display = 'block';
            return;
        }

        if (justification.length < 20) {
            warning.textContent = 'Justification must be at least 20 characters.';
            warning.style.display = 'block';
            return;
        }

        warning.style.display = 'none';
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Submitting...';

        try {
            const phaseId = document.getElementById('ext-req-phase-id')?.value;
            const extensionDays = document.getElementById('ext-req-days-input')?.value;

            const result = await client.post('/timeline-extensions', { 
                projectId: parseInt(projectId), 
                phaseId: phaseId ? parseInt(phaseId) : null,
                extensionDays: extensionDays ? parseInt(extensionDays) : null,
                requestedEndDate: newDate, 
                justification 
            });

            toast.show('Timeline extension request submitted to PM.', 'success');
            window.drawer.close();
        } catch (error) {
            console.error('Submission error:', error);
            warning.textContent = 'Failed to submit request. Please try again.';
            warning.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right: 8px;"></i>Submit Extension Request';
        }
    }

    handlePasswordUpdate() {
        toast.show('Password has been updated successfully.', 'success');
        window.drawer.close();
    }

    handleLogout() {
        modal.confirm('Sign Out', 'Are you sure you want to sign out?', () => {
            window.toast.show('Signing out...', 'info');
            localStorage.removeItem('mcms_auth_token');
            // Disconnect WebSocket gracefully
            if (window.realtime) window.realtime.disconnect();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        });
    }
}
