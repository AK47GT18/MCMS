import { currentUser } from '../config/roles.js';
import { NAV_ITEMS } from '../config/navConfig.js';
import { DrawerTemplates } from '../components/DrawerTemplates.js';

export class AppLayout {
    constructor() {
        this.appContainer = document.getElementById('app');
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
        const sectionsHTML = sections.map(section => `
            <div class="nav-section">
                <div class="nav-label">${section.section}</div>
                ${section.items.map(item => `
                    <a href="#" class="nav-link ${item.active ? 'active' : ''}" data-id="${item.id}" ${item.action ? `data-action="${item.action}"` : ''}>
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
                    <i class="fas fa-hard-hat"></i>
                    <span>MKAKA FINANCE</span>
                </div>
                <div class="sidebar-header">
                     <div class="user-profile">
                        <div class="profile-avatar" style="background: var(--emerald);">SM</div>
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
        return `
            <header class="top-bar hidden-mobile">
                 <div class="breadcrumb">
                    <span>Finance Workspace</span>
                    <i class="fas fa-chevron-right" style="font-size: 9px;"></i>
                    <span id="header-breadcrumb">Financial Overview</span>
                 </div>
                <div style="margin-left: auto; display: flex; gap: 16px; align-items: center;">
                    <div style="background: #FEF2F2; color: var(--red); padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; border: 1px solid #FECACA;">
                        <i class="fas fa-triangle-exclamation"></i> 1 Active Fraud Alert
                    </div>
                    
                    <!-- Notification Bell Wrapper -->
                    <div style="position: relative;">
                        <button id="notification-bell" class="btn btn-secondary" style="border: none; padding: 8px; position: relative;" onclick="window.app.layout.toggleNotifications(event)">
                            <i class="fas fa-bell" style="color: var(--slate-500); font-size: 16px;"></i>
                            ${this.getNotificationBadgeHTML(12)}
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
                        <div class="profile-avatar">FD</div>
                    </div>
                </div>
            </header>
        `;
    }

    getRecentNotificationsHTML() {
        // Mock Data as requested (4 items)
        const notifications = [
             { type: 'info', icon: 'fa-wrench', title: 'System Maintenance', desc: 'Scheduled maintenance for tomorrow at 02:00 AM.', time: '10 mins ago' },
             { type: 'success', icon: 'fa-check', title: 'Requisition Approved', desc: 'REQ-089 has been final approved.', time: '1 hour ago' },
             { type: 'warning', icon: 'fa-exclamation', title: 'Budget Alert', desc: 'Project CEN-01 is approaching 90% budget utilization.', time: '2 hours ago' },
             { type: 'info', icon: 'fa-comment', title: 'New Comment', desc: 'Sarah replied to your note on BCR-102.', time: '4 hours ago' }
        ];

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
        // ... (existing)
        document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.closest('a');
                if (target.dataset.action === 'drawer') {
                    window.drawer.open('Transaction Entry', DrawerTemplates.transactionEntry);
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
}
