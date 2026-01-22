import { currentUser, ROLES } from '../config/roles.js';
import { NAV_ITEMS } from '../config/navConfig.js';
import { DrawerTemplates } from '../components/DrawerTemplates.js';
import { modal } from '../components/ui/ModalManager.js';
import { toast } from '../components/ui/ToastManager.js';

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
    }

    render() {
        this.appContainer.innerHTML = '';
        const navSections = NAV_ITEMS[currentUser.role] || [];
        const allItems = navSections.flatMap(s => s.items);

        const sidebarHTML = this.generateSidebar(navSections);
        const mobileNavHTML = this.generateMobileNav(allItems);
        const topBarHTML = this.generateTopBar();

        // Using semantic classes from updated style.css
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
    }

    generateSidebar(sections) {
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
                <div class="logo">
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
        const linksHTML = items.slice(0, 4).map(item => `
            <a href="#" class="mobile-nav-item ${item.active ? 'active' : ''}" data-id="${item.id}">
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
        // Generic Breadcrumb - Title is updated by main.js
        const breadcrumbTitle = currentUser.role.toUpperCase();
        
        // Notifications & Alerts Logic
        let alertHTML = '';
        if (currentUser.role === 'Finance Director') {
             alertHTML = `
                <div style="background: #FEF2F2; color: var(--red); padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; border: 1px solid #FECACA;">
                    <i class="fas fa-triangle-exclamation"></i> 1 Active Fraud Alert
                </div>
             `;
        }

        // Notification Badge Count
        const notifCount = this.getNotificationCountForRole(currentUser.role);

        return `
            <header class="top-bar hidden-mobile">
                <div class="breadcrumb">
                    <span>Workspace</span>
                 </div>
                <div style="margin-left: auto; display: flex; gap: 16px; align-items: center;">
                    ${alertHTML}
                    
                    <!-- Notification Bell Wrapper -->
                    <div style="position: relative;">
                        <button id="notification-bell" class="btn btn-secondary" style="border: none; padding: 8px; position: relative;" onclick="window.app.layout.toggleNotifications(event)">
                            <i class="fas fa-bell" style="color: var(--slate-500); font-size: 16px;"></i>
                            ${this.getNotificationBadgeHTML(notifCount)}
                        </button>
                        
                        <!-- Dropdown -->
                        <div id="notification-dropdown" class="notification-dropdown">
                            <div class="notification-header">
                                <span>Recent Notifications</span>
                                <button class="view-all-btn">Mark read</button>
                            </div>
                            <div class="notification-list">
                                ${this.getRecentNotificationsHTML()}
                            </div>
                            <div class="notification-footer">
                                <button class="view-all-btn">View All History</button>
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

    getNotificationCountForRole(role) {
        if (role === 'Finance Director') return 12;
        if (role === 'Project Manager') return 5;
        if (role === 'Field Supervisor') return 2;
        if (role === 'System Technician') return 4;
        return 3;
    }

    getRecentNotificationsHTML() {
        const role = currentUser.role;
        let notifications = [];

        if (role === 'Finance Director') {
            notifications = [
                 { type: 'info', icon: 'fa-wrench', title: 'System Maintenance', desc: 'Scheduled maintenance for tomorrow at 02:00 AM.', time: '10 mins ago' },
                 { type: 'success', icon: 'fa-check', title: 'Requisition Approved', desc: 'REQ-089 has been final approved.', time: '1 hour ago' },
                 { type: 'warning', icon: 'fa-exclamation', title: 'Budget Alert', desc: 'Project CEN-01 is approaching 90% budget utilization.', time: '2 hours ago' },
                 { type: 'info', icon: 'fa-comment', title: 'New Comment', desc: 'Sarah replied to your note on BCR-102.', time: '4 hours ago' }
            ];
        } else if (role === 'Project Manager') {
            notifications = [
                 { type: 'warning', icon: 'fa-clock', title: 'Schedule Slippage', desc: 'Task 2.4 in CEN-01 is 2 days behind.', time: '30 mins ago' },
                 { type: 'success', icon: 'fa-file-signature', title: 'Log Verified', desc: 'Field Supervisor submitted daily log for MZ-05.', time: '2 hours ago' },
                 { type: 'info', icon: 'fa-comment', title: 'Client Message', desc: 'New message from Ministry Rep regarding milestones.', time: '5 hours ago' }
            ];
        } else if (role === 'Field Supervisor') {
            notifications = [
                 { type: 'info', icon: 'fa-truck', title: 'Delivery Incoming', desc: 'Cement truck for CEN-01 arriving at 14:00.', time: '15 mins ago' },
                 { type: 'info', icon: 'fa-cloud-sun', title: 'Weather Alert', desc: 'Rain expected tomorrow. Secure loose materials.', time: '1 hour ago' }
            ];
        } else if (role === 'System Technician') {
            notifications = [
                 { type: 'error', icon: 'fa-shield-virus', title: 'Multiple Login Failures', desc: 'S. Mwale account flagged for security review.', time: '5 mins ago' },
                 { type: 'warning', icon: 'fa-database', title: 'Sync Warning', desc: 'M. Banda daily report failed to sync (File size limit).', time: '1 hour ago' },
                 { type: 'success', icon: 'fa-cloud-arrow-up', title: 'Backup Successful', desc: 'Nightly database snapshot stored to S3.', time: '2 hours ago' },
                 { type: 'info', icon: 'fa-server', title: 'System Patch', desc: 'v2.4.1 available for staging deployment.', time: '6 hours ago' }
            ];
        } else {
             // Generic for other roles
             notifications = [
                 { type: 'info', icon: 'fa-info-circle', title: 'System Update', desc: 'New features available.', time: '1 day ago' },
                 { type: 'warning', icon: 'fa-user-clock', title: 'Timesheet Due', desc: 'Please submit your weekly timesheet.', time: '2 days ago' }
             ];
        }

        return notifications.map(n => `
            <div class="notification-item">
                <div class="notif-icon ${n.type}"><i class="fas ${n.icon}"></i></div>
                <div class="notif-content">
                    <div class="notif-title">${n.title}</div>
                    <div class="notif-desc">${n.desc}</div>
                    <div class="notif-time">${n.time}</div>
                </div>
            </div>
        `).join('');
    }

    toggleNotifications(e) {
        if(e) e.stopPropagation();
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            
            // Add click outside listener once
            if (dropdown.classList.contains('show')) {
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

        // ... (existing)
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
                    const template = DrawerTemplates[drawerId];
                    if (template) {
                        window.drawer.open(title, template);
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
        document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(el => {
            if (el.dataset.id === id) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    getNotificationBadgeHTML(count) {
        if (!count || count <= 0) return '';
        const display = count > 10 ? '10+' : count;
        return `
            <span style="
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
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 4px;
                border: 2px solid var(--white);
                transform: translate(25%, -25%);
            ">${display}</span>
        `;
    }

    injectContent(html) {
        document.getElementById('main-content').innerHTML = html;
    }

    showProfileDrawer() {
        const contentHTML = `
            <div style="padding: 24px; border-bottom: 1px solid var(--slate-200); background: var(--slate-50); text-align: center;">
                <div style="width: 64px; height: 64px; background: var(--white); color: var(--slate-600); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm);">
                    <i class="fas fa-id-card-clip"></i>
                </div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--slate-900); margin: 0;">${currentUser.name}</h3>
                <p style="color: var(--slate-500); font-size: 13px; margin: 4px 0 0;">${currentUser.role}</p>
            </div>

            <div class="drawer-section">
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
                            <input type="password" class="form-input" placeholder="••••••••" style="background: var(--white);">
                        </div>
                        <div class="form-group">
                            <label class="form-label">New Password</label>
                            <input type="password" class="form-input" placeholder="••••••••" style="background: var(--white);">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Confirm New Password</label>
                            <input type="password" class="form-input" placeholder="••••••••" style="background: var(--white);">
                        </div>
                        <button class="btn btn-primary" style="width: 100%; justify-content: center; font-weight: 700; margin-top: 8px;" onclick="window.app.layout.handlePasswordUpdate()">
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

    handlePasswordUpdate() {
        // Mock update
        toast.success('Success', 'Password has been updated successfully.');
        window.drawer.close();
    }

    handleLogout() {
        if(confirm('Are you sure you want to sign out?')) {
            window.toast.show('Signing out...', 'info');
            setTimeout(() => {
                window.location.reload(); // Simulates logout for now
            }, 800);
        }
    }
}
