/**
 * AuthGuard Utility
 * Authentication guards and role-based access control for frontend
 */

import auth from '../api/auth.api.js';

/**
 * Role hierarchy for RBAC (lower index = lower level)
 */
const ROLE_HIERARCHY = [
    'Field_Supervisor',
    'Equipment_Coordinator',
    'Contract_Administrator',
    'Operations_Manager',
    'Finance_Director',
    'Project_Manager',
    'Managing_Director',
    'System_Technician'
];

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function requireAuth() {
    if (!auth.isAuthenticated()) {
        window.openModal?.('loginModal');
        return false;
    }
    return true;
}

/**
 * Check if user has one of the specified roles
 * @param {Object} user - User object with role property
 * @param {string[]} allowedRoles - Array of allowed role strings
 * @returns {boolean}
 */
export function hasRole(user, allowedRoles) {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
}

/**
 * Check if user meets minimum role level
 * @param {Object} user - User object with role property
 * @param {string} minimumRole - Minimum required role
 * @returns {boolean}
 */
export function hasMinimumRole(user, minimumRole) {
    if (!user || !user.role) return false;
    const userLevel = ROLE_HIERARCHY.indexOf(user.role);
    const minLevel = ROLE_HIERARCHY.indexOf(minimumRole);
    return userLevel >= minLevel;
}

export const AuthGuard = {
    requireAuth,
    hasRole,
    hasMinimumRole,
    ROLE_HIERARCHY
};

export default AuthGuard;
