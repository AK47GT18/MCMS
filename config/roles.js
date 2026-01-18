export const ROLES = {
    PROJECT_MANAGER: 'Project Manager',
    FINANCE_DIRECTOR: 'Finance Director',
    FIELD_SUPERVISOR: 'Field Supervisor',
    CONTRACT_ADMIN: 'Contract Administrator',
    EQUIPMENT_COORDINATOR: 'Equipment Coordinator',
    OPERATIONS_MANAGER: 'Operations Manager',
    MANAGING_DIRECTOR: 'Managing Director',
    SYSTEM_TECHNICIAN: 'System Technician'
};

export const USERS = {
    pm: {
        name: 'Sarah Jenkins',
        role: ROLES.PROJECT_MANAGER,
        email: 's.jenkins@mkaka.mw',
        phone: '+265 991 234 567',
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=0D8ABC&color=fff',
        permissions: ['read_all', 'write_project', 'approve_timesheets']
    },
    finance: {
        name: 'Stefan Mwale',
        role: ROLES.FINANCE_DIRECTOR,
        email: 's.mwale@mkaka.mw',
        phone: '+265 882 111 222',
        avatar: 'https://ui-avatars.com/api/?name=Stefan+Mwale&background=F97316&color=fff',
        permissions: ['read_all', 'write_finance', 'approve_budget']
    },
    field: {
        name: 'Mike Banda',
        role: ROLES.FIELD_SUPERVISOR,
        email: 'm.banda@mkaka.mw',
        phone: '+265 995 333 444',
        avatar: 'https://ui-avatars.com/api/?name=Mike+Banda&background=10B981&color=fff',
        permissions: ['read_assigned', 'write_daily_logs']
    },
    contract_admin: {
        name: 'John Kaira',
        role: ROLES.CONTRACT_ADMIN,
        email: 'j.kaira@mkaka.mw',
        phone: '+265 884 555 666',
        avatar: 'https://ui-avatars.com/api/?name=John+Kaira&background=7C3AED&color=fff',
        permissions: ['read_contracts', 'write_contracts']
    },
    equipment_coordinator: {
        name: 'Blessings Phiri',
        role: ROLES.EQUIPMENT_COORDINATOR,
        email: 'b.phiri@mkaka.mw',
        phone: '+265 993 777 888',
        avatar: 'https://ui-avatars.com/api/?name=Blessings+Phiri&background=6366F1&color=fff',
        permissions: ['read_fleet', 'write_maintenance']
    },
    ops_manager: {
        name: 'Grace Chibwe',
        role: ROLES.OPERATIONS_MANAGER,
        email: 'g.chibwe@mkaka.mw',
        phone: '+265 889 999 000',
        avatar: 'https://ui-avatars.com/api/?name=Grace+Chibwe&background=EC4899&color=fff',
        permissions: ['read_all', 'write_operations']
    },
    md: {
        name: 'David Mkaka',
        role: ROLES.MANAGING_DIRECTOR,
        email: 'd.mkaka@mkaka.mw',
        phone: '+265 991 123 456',
        avatar: 'https://ui-avatars.com/api/?name=David+Mkaka&background=111827&color=fff',
        permissions: ['read_all', 'approve_high_value']
    },
    tech: {
        name: 'Isaac Newton',
        role: ROLES.SYSTEM_TECHNICIAN,
        email: 'i.newton@mkaka.mw',
        phone: '+265 990 000 111',
        avatar: 'https://ui-avatars.com/api/?name=Isaac+Newton&background=334155&color=fff',
        permissions: ['read_all', 'manage_system', 'manage_users']
    }
};

// Default to Finance Director for Development/Review, or load from storage
const storedUserKey = localStorage.getItem('mcms_user');
export let currentUser = (storedUserKey && USERS[storedUserKey]) ? USERS[storedUserKey] : USERS.finance;

export function switchUser(userKey) {
    if (USERS[userKey]) {
        currentUser = USERS[userKey];
        localStorage.setItem('mcms_user', userKey);
        // Reload app to reflect changes
        window.location.reload();
    }
}
