import { ROLES } from './roles.js';

const ICONS = {
    dashboard: '<i class="fas fa-chart-line"></i>',
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
                { label: 'Audit Log', icon: ICONS.fingerprint, id: 'audit' },
                { label: 'Fraud Detection', icon: ICONS.shield, id: 'fraud' },
                { label: 'Contracts', icon: ICONS.contract, id: 'contracts' },
                { label: 'Vendor Registry', icon: ICONS.store, id: 'vendors' }
            ]
        },
         { 
            section: 'Reporting', 
            items: [
                { label: 'Reports Generator', icon: ICONS.reports, id: 'reports' }
            ]
        }
    ],
    // Default fallback for other roles (simplified for now)
    [ROLES.PROJECT_MANAGER]: [
        {
            section: 'Main',
            items: [
                { label: 'Portfolio', icon: '<i class="fas fa-th-large"></i>', id: 'portfolio', active: true },
                { label: 'Log Reviews', icon: '<i class="fas fa-check-double"></i>', id: 'reviews', badge: 3 },
                { label: 'Analytics', icon: '<i class="fas fa-chart-pie"></i>', id: 'analytics' }
            ]
        },
        {
            section: 'Execution',
            items: [
                { label: 'Gantt Schedule', icon: '<i class="fas fa-stream"></i>', id: 'gantt' },
                { label: 'Budget Control', icon: '<i class="fas fa-coins"></i>', id: 'budget' },
                { label: 'Field Teams', icon: '<i class="fas fa-users"></i>', id: 'teams' }
            ]
        },
        {
            section: 'Documents',
            items: [
                { label: 'Contracts', icon: '<i class="fas fa-file-contract"></i>', id: 'contracts' },
                { label: 'Reports', icon: '<i class="fas fa-file-pdf"></i>', id: 'reports' }
            ]
        }
    ],
    [ROLES.FIELD_SUPERVISOR]: [
        {
            section: 'Field Operations',
            items: [
                { label: 'Site Dashboard', icon: '<i class="fas fa-home"></i>', id: 'dashboard', active: true },
                { label: 'Tasks', icon: '<i class="fas fa-list-check"></i>', id: 'tasks' },
                // Special FAB item for Mobile, or just standard link for Desktop
                { label: 'Daily Reports', icon: '<i class="fas fa-camera"></i>', id: 'reports', action: 'drawer', drawerId: 'dailyReport' }, 
                { label: 'Equipment', icon: '<i class="fas fa-truck-moving"></i>', id: 'equipment' }
            ]
        }
    ],
    [ROLES.CONTRACT_ADMIN]: [
        {
            section: 'Lifecycle',
            items: [
                 { label: 'Dashboard', icon: '<i class="fas fa-chart-line"></i>', id: 'dashboard', active: true },
                 { label: 'Repository', icon: '<i class="fas fa-folder-open"></i>', id: 'repository' },
                 { label: 'Milestones', icon: '<i class="fas fa-flag"></i>', id: 'milestones', badge: 3 },
                 { label: 'Amendments', icon: '<i class="fas fa-pen-to-square"></i>', id: 'amendments' }
            ]
        },
        {
            section: 'Compliance',
            items: [
                { label: 'Ins. & Bonds', icon: '<i class="fas fa-shield-halved"></i>', id: 'compliance' },
                { label: 'Vendor Registry', icon: '<i class="fas fa-store"></i>', id: 'vendors' }
            ]
        },
        {
            section: 'Reporting',
            items: [
                { label: 'Performance', icon: '<i class="fas fa-file-invoice"></i>', id: 'reports' }
            ]
        }
    ],
    [ROLES.EQUIPMENT_COORDINATOR]: [
        {
            section: 'Fleet Management',
            items: [
                { label: 'Dashboard', icon: '<i class="fas fa-chart-simple"></i>', id: 'dashboard', active: true },
                { label: 'Asset Registry', icon: '<i class="fas fa-list"></i>', id: 'registry' },
                { label: 'GPS Tracking', icon: '<i class="fas fa-map-location-dot"></i>', id: 'tracking' },
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
                 { label: 'Operator Logs', icon: '<i class="fas fa-id-card"></i>', id: 'operators' }
             ]
        }
    ],
    [ROLES.OPERATIONS_MANAGER]: [
        {
            section: 'Oversight',
            items: [
                { label: 'Ops Dashboard', icon: '<i class="fas fa-tower-control"></i>', id: 'dashboard', active: true },
                { label: 'Site Performance', icon: '<i class="fas fa-building-user"></i>', id: 'sites' },
                { label: 'Resource Efficiency', icon: '<i class="fas fa-users-gear"></i>', id: 'resources' }
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
                { label: 'Board View', icon: '<i class="fas fa-chess-king"></i>', id: 'dashboard', active: true },
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
            section: 'Portfolio',
            items: [
                { label: 'All Projects', icon: '<i class="fas fa-globe"></i>', id: 'portfolio' },
                { label: 'Top Clients', icon: '<i class="fas fa-handshake"></i>', id: 'clients' }
            ]
        }
    ]
};
