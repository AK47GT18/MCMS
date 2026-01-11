export const ROLES = {
    PROJECT_MANAGER: 'Project Manager',
    FINANCE_DIRECTOR: 'Finance Director',
    FIELD_SUPERVISOR: 'Field Supervisor',
    CONTRACT_ADMIN: 'Contract Administrator',
    EQUIPMENT_COORDINATOR: 'Equipment Coordinator',
    OPERATIONS_MANAGER: 'Operations Manager',
    MANAGING_DIRECTOR: 'Managing Director'
};

export const USERS = {
    pm: {
        name: 'Sarah Jenkins',
        role: ROLES.PROJECT_MANAGER,
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=0D8ABC&color=fff',
        permissions: ['read_all', 'write_project', 'approve_timesheets']
    },
    finance: {
        name: 'Stefan Mwale',
        role: ROLES.FINANCE_DIRECTOR,
        avatar: 'https://ui-avatars.com/api/?name=Stefan+Mwale&background=F97316&color=fff',
        permissions: ['read_all', 'write_finance', 'approve_budget']
    },
    field: {
        name: 'Mike Banda',
        role: ROLES.FIELD_SUPERVISOR,
        avatar: 'https://ui-avatars.com/api/?name=Mike+Banda&background=10B981&color=fff',
        permissions: ['read_assigned', 'write_daily_logs']
    },
    contract_admin: {
        name: 'John Kaira',
        role: ROLES.CONTRACT_ADMIN,
        avatar: 'https://ui-avatars.com/api/?name=John+Kaira&background=7C3AED&color=fff',
        permissions: ['read_contracts', 'write_contracts']
    },
    equipment_coordinator: {
        name: 'Blessings Phiri',
        role: ROLES.EQUIPMENT_COORDINATOR,
        avatar: 'https://ui-avatars.com/api/?name=Blessings+Phiri&background=6366F1&color=fff',
        permissions: ['read_fleet', 'write_maintenance']
    }
    // Add other mocks as needed
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
