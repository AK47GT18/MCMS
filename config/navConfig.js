import { ROLES } from './roles.js';

const ICONS = {
    dashboard: '<i class="fas fa-chart-simple"></i>',
    projects: '<i class="fas fa-chart-pie"></i>', // Mapping 'projects' to analytics/pie for now or chart
    finance: '<i class="fas fa-coins"></i>',
    team: '<i class="fas fa-users"></i>',
    reports: '<i class="fas fa-file-pdf"></i>',
    settings: '<i class="fas fa-cog"></i>',
    gps: '<i class="fas fa-map-marker-alt"></i>',
    check: '<i class="fas fa-check-to-slot"></i>',
    book: '<i class="fas fa-book"></i>',
    scale: '<i class="fas fa-scale-balanced"></i>',
    sliders: '<i class="fas fa-sliders"></i>',
    fingerprint: '<i class="fas fa-fingerprint"></i>',
    shield: '<i class="fas fa-shield-cat"></i>',
    contract: '<i class="fas fa-file-contract"></i>',
    store: '<i class="fas fa-store"></i>',
    plus: '<i class="fas fa-plus-circle"></i>'
};

// Exact replica of Finance Director Sidebar structure
export const NAV_ITEMS = {
    [ROLES.FINANCE_DIRECTOR]: [
        { 
            section: 'Strategic', 
            items: [
                { label: 'Dashboard', icon: ICONS.dashboard, id: 'dashboard', active: true },
                { label: 'Analytics', icon: ICONS.projects, id: 'analytics' }
            ]
        },
        { 
            section: 'Operations', 
            items: [
                { label: 'Transaction Entry', icon: ICONS.plus, id: 'transaction', action: 'drawer' },
                { label: 'Approvals', icon: ICONS.check, id: 'approvals', badge: 5 },
                { label: 'General Ledger', icon: ICONS.book, id: 'ledger' },
                { label: 'Reconciliation', icon: ICONS.scale, id: 'reconciliation' }
            ]
        },
        { 
            section: 'Governance', 
            items: [
                { label: 'Budget Control', icon: ICONS.sliders, id: 'bcr' },
                { label: 'Whistleblower Portal', icon: ICONS.shield, id: 'whistleblower', action: 'drawer', drawerId: 'whistleblowerPortal' },
                { label: 'Audit Log', icon: ICONS.fingerprint, id: 'audit' },
                { label: 'Contracts', icon: ICONS.contract, id: 'contracts' },
                { label: 'Vendor Registry', icon: ICONS.store, id: 'vendors' }
            ]
        },
         { 
            section: 'Reporting', 
            items: [
                { label: 'Reports Generator', icon: ICONS.reports, id: 'reports' },
                { label: 'Report Issue', icon: '<i class="fas fa-exclamation-triangle"></i>', id: 'complaint', action: 'drawer', drawerId: 'submitComplaint' }
            ]
        }
    ],
    // Default fallback for other roles (simplified for now)
    [ROLES.PROJECT_MANAGER]: [
        {
            section: 'Main',
            items: [
                { label: 'Dashboard', icon: '<i class="fas fa-chart-simple"></i>', id: 'portfolio', active: true },
                { label: 'Log Reviews', icon: '<i class="fas fa-check-double"></i>', id: 'reviews', badge: 3 },
                { label: 'Analytics', icon: '<i class="fas fa-chart-pie"></i>', id: 'analytics' }
            ]
        },
        {
            section: 'Execution',
            items: [
                { label: 'Gantt Schedule', icon: '<i class="fas fa-stream"></i>', id: 'gantt' },
                { label: 'Asset Registry', icon: '<i class="fas fa-truck-pickup"></i>', id: 'fleet' },
                { label: 'Budget Control', icon: '<i class="fas fa-coins"></i>', id: 'budget' },
                { label: 'Field Teams', icon: '<i class="fas fa-users"></i>', id: 'teams' }
            ]
        },
        {
            section: 'Documents',
            items: [
                { label: 'Contracts', icon: '<i class="fas fa-file-contract"></i>', id: 'contracts' },
                { label: 'Reports', icon: '<i class="fas fa-file-pdf"></i>', id: 'reports' },
                { label: 'Issues Center', icon: '<i class="fas fa-headset"></i>', id: 'issues' }
            ]
        },
        {
            section: 'System Management',
            items: [
                { label: 'User Management', icon: '<i class="fas fa-users-cog"></i>', id: 'users' },
                { label: 'Audit Logs', icon: '<i class="fas fa-shield-alt"></i>', id: 'audit' }
            ]
        }
    ],
    [ROLES.FIELD_SUPERVISOR]: [
        {
            section: 'Field Operations',
            items: [
                { label: 'Dashboard', icon: ICONS.dashboard, id: 'dashboard', active: true },
                { label: 'Tasks', icon: '<i class="fas fa-list-check"></i>', id: 'tasks' },
                { label: 'Execution Schedule', icon: '<i class="fas fa-stream"></i>', id: 'gantt' },
                { label: 'Daily Reports', icon: '<i class="fas fa-camera"></i>', id: 'reports', action: 'drawer', drawerId: 'dailyReport' }, 
                { label: 'Equipment', icon: '<i class="fas fa-truck-moving"></i>', id: 'equipment' },
                { label: 'Report Safety Incident', icon: '<i class="fas fa-helmet-safety"></i>', id: 'safety_incident', action: 'drawer', drawerId: 'safetyIncident' }
            ]
        }
    ],
    [ROLES.CONTRACT_ADMIN]: [
        {
            section: 'Lifecycle',
            items: [
                 { label: 'Dashboard', icon: ICONS.dashboard, id: 'dashboard', active: true },
                 { label: 'Documents', icon: '<i class="fas fa-folder-open"></i>', id: 'documents' },
                 { label: 'Milestones', icon: '<i class="fas fa-flag"></i>', id: 'milestones', badge: 3 },
                 { label: 'Amendments', icon: '<i class="fas fa-pen-to-square"></i>', id: 'amendments' }
            ]
        },
        {
            section: 'Compliance',
            items: [
                { label: 'Ins. & Bonds', icon: '<i class="fas fa-shield-halved"></i>', id: 'compliance' }
            ]
        },
        {
            section: 'Reporting',
            items: [
                { label: 'Performance', icon: '<i class="fas fa-file-invoice"></i>', id: 'reports' },
                { label: 'Report Issue', icon: '<i class="fas fa-exclamation-triangle"></i>', id: 'complaint', action: 'drawer', drawerId: 'submitComplaint' }
            ]
        }
    ],
    [ROLES.EQUIPMENT_COORDINATOR]: [
        {
            section: 'Fleet Management',
            items: [
                { label: 'Dashboard', icon: '<i class="fas fa-chart-simple"></i>', id: 'dashboard', active: true },
                { label: 'Asset Registry', icon: '<i class="fas fa-list"></i>', id: 'registry' },
                { label: 'Asset Log', icon: '<i class="fas fa-clipboard-list"></i>', id: 'tracking' },
                { label: 'Check-Out Asset', icon: '<i class="fas fa-right-from-bracket"></i>', id: 'checkout', action: 'drawer', drawerId: 'assignEquipment' }
            ]
        },
        {
            section: 'Maintenance',
            items: [
                 { label: 'Service Schedule', icon: '<i class="fas fa-wrench"></i>', id: 'maintenance', badge: 2 },
                 { label: 'Repair Costs', icon: '<i class="fas fa-coins"></i>', id: 'costs' }
            ]
        },
        {
             section: 'Reporting',
             items: [
                 { label: 'Utilization Reports', icon: '<i class="fas fa-chart-pie"></i>', id: 'utilization' },
                 { label: 'Operator Logs', icon: '<i class="fas fa-id-card"></i>', id: 'operators' },
                 { label: 'Report Issue', icon: '<i class="fas fa-exclamation-triangle"></i>', id: 'complaint', action: 'drawer', drawerId: 'submitComplaint' }
             ]
        }
    ],
    [ROLES.OPERATIONS_MANAGER]: [
        {
            section: 'Oversight',
            items: [
                { label: 'Dashboard', icon: ICONS.dashboard, id: 'dashboard', active: true },
                { label: 'Site Performance', icon: '<i class="fas fa-building-user"></i>', id: 'sites' },
                { label: 'Resource Efficiency', icon: '<i class="fas fa-users-gear"></i>', id: 'resources' },
                { label: 'Complaint Lodger', icon: '<i class="fas fa-headset"></i>', id: 'complaints', badge: 2 }
            ]
        },
        {
            section: 'Logistics',
            items: [
                { label: 'Supply Chain', icon: '<i class="fas fa-truck-fast"></i>', id: 'supply' },
                { label: 'Global Inventory', icon: '<i class="fas fa-warehouse"></i>', id: 'inventory' }
            ]
        },
        {
            section: 'Safety',
            items: [
                { label: 'Safety Audits', icon: '<i class="fas fa-clipboard-list"></i>', id: 'safety', badge: 1 }
            ]
        }
    ],
    [ROLES.MANAGING_DIRECTOR]: [
        {
            section: 'Executive',
            items: [
                { label: 'Dashboard', icon: ICONS.dashboard, id: 'dashboard', active: true },
                { label: 'Whistleblower Portal', icon: '<i class="fas fa-shield-halved"></i>', id: 'whistleblower', action: 'drawer', drawerId: 'whistleblowerPortal' },
                { label: 'Strategy Map', icon: '<i class="fas fa-compass"></i>', id: 'strategy' }
            ]
        },
        {
            section: 'Performance',
            items: [
                { label: 'P&L Overview', icon: '<i class="fas fa-file-invoice-dollar"></i>', id: 'pnl' },
                { label: 'Risk Heatmap', icon: '<i class="fas fa-fire"></i>', id: 'risk' }
            ]
        },
        {
            section: 'Project Dashboard',
            items: [
                { label: 'All Projects', icon: '<i class="fas fa-chart-simple"></i>', id: 'portfolio' },
                { label: 'Top Clients', icon: '<i class="fas fa-handshake"></i>', id: 'clients' },
                { label: 'Report Issue', icon: '<i class="fas fa-exclamation-triangle"></i>', id: 'complaint', action: 'drawer', drawerId: 'submitComplaint' }
            ]
        }
    ],
    [ROLES.SYSTEM_TECHNICIAN]: [
        {
            section: 'System Admin',
            items: [
                { label: 'Dashboard', icon: ICONS.dashboard, id: 'dashboard', active: true },
                { label: 'Global Config', icon: ICONS.settings, id: 'config' }
            ]
        },
        {
            section: 'Management',
            items: [
                { label: 'User Registry', icon: ICONS.team, id: 'users' },
                { label: 'Audit Logs', icon: ICONS.fingerprint, id: 'audit' }
            ]
        }
    ]
};
