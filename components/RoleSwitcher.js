import { USERS, switchUser } from '../config/roles.js';

export class RoleSwitcher {
    constructor() {
        this.render();
    }

    render() {
        const container = document.createElement('div');
        // Inline styles to ensure it works regardless of global CSS changes
        Object.assign(container.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px',
            fontFamily: 'sans-serif'
        });
        
        const toggleBtn = document.createElement('button');
        Object.assign(toggleBtn.style, {
            background: '#0F172A',
            color: 'white',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s'
        });
        toggleBtn.innerHTML = '<i class="fas fa-users-gear" style="font-size: 20px;"></i>';
        toggleBtn.title = "Switch Role";

        const menu = document.createElement('div');
        Object.assign(menu.style, {
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #E2E8F0',
            padding: '8px',
            minWidth: '220px',
            display: 'none', // Hidden by default
            flexDirection: 'column',
            gap: '4px'
        });
        
        Object.entries(USERS).forEach(([key, user]) => {
            const btn = document.createElement('button');
            Object.assign(btn.style, {
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#475569'
            });

            const isActive = user.role === window.app?.currentUser?.role || document.querySelector('.profile-name')?.textContent === user.name;
            
            if (isActive) {
                btn.style.background = '#FFF7ED';
                btn.style.color = '#F97316';
                btn.style.fontWeight = '600';
            } else {
                btn.onmouseenter = () => { btn.style.background = '#F1F5F9'; btn.style.color = '#0F172A'; };
                btn.onmouseleave = () => { btn.style.background = 'transparent'; btn.style.color = '#475569'; };
            }
            
            btn.innerHTML = `
                <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${this.getRoleColor(user.role)};"></div>
                ${user.role}
            `;
            
            btn.onclick = () => {
                switchUser(key);
            };
            
            menu.appendChild(btn);
        });

        toggleBtn.onclick = () => {
            const isHidden = menu.style.display === 'none';
            menu.style.display = isHidden ? 'flex' : 'none';
        };

        container.appendChild(menu);
        container.appendChild(toggleBtn);
        document.body.appendChild(container);
    }

    getRoleColor(role) {
        if (role.toLowerCase().includes('finance')) return '#F97316'; // Orange
        if (role.toLowerCase().includes('project')) return '#3B82F6'; // Blue
        if (role.toLowerCase().includes('field')) return '#10B981'; // Green
        if (role.toLowerCase().includes('contract')) return '#7C3AED'; // Purple
        if (role.toLowerCase().includes('equipment')) return '#6366F1'; // Indigo
        return '#64748B'; // Slate
    }
}
