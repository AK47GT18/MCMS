<?php

class Authorization {
    private static $permissions = [];
    private static $rolePermissions = [
        ROLE_SUPERADMIN => ['*'], // All permissions
        
        ROLE_MANAGING_DIRECTOR => [
            'dashboard.view',
            'projects.view',
            'finance.view', 'finance.export',
            'contracts.view', 'contracts.export',
            'equipment.view',
            'reports.view', 'reports.export',
            'users.view'
        ],
        
        ROLE_OPERATIONS_MANAGER => [
            'dashboard.view',
            'projects.view', 'projects.create', 'projects.edit',
            'finance.view', 'finance.approve', 'finance.export',
            'contracts.view', 'contracts.create', 'contracts.edit',
            'equipment.view', 'equipment.create', 'equipment.edit',
            'site_reports.view', 'site_reports.approve',
            'reports.view', 'reports.export',
            'users.view', 'users.create', 'users.edit'
        ],
        
        ROLE_PROJECT_MANAGER => [
            'dashboard.view',
            'projects.view', 'projects.create', 'projects.edit',
            'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
            'finance.view', 'finance.create',
            'contracts.view',
            'equipment.view',
            'site_reports.view',
            'documents.view', 'documents.create', 'documents.edit',
            'reports.view', 'reports.export'
        ],
        
        ROLE_FINANCE_OFFICER => [
            'dashboard.view',
            'finance.view', 'finance.create', 'finance.edit', 'finance.approve',
            'transactions.view', 'transactions.create', 'transactions.edit',
            'budgets.view', 'budgets.edit',
            'contracts.view',
            'reports.view', 'reports.export'
        ],
        
        ROLE_CONTRACT_ADMIN => [
            'dashboard.view',
            'contracts.view', 'contracts.create', 'contracts.edit',
            'documents.view', 'documents.create', 'documents.edit', 'documents.delete',
            'milestones.view', 'milestones.create', 'milestones.edit',
            'reports.view'
        ],
        
        ROLE_EQUIPMENT_COORDINATOR => [
            'dashboard.view',
            'equipment.view', 'equipment.create', 'equipment.edit',
            'maintenance.view', 'maintenance.create', 'maintenance.edit',
            'equipment.checkin', 'equipment.checkout',
            'reports.view'
        ],
        
        ROLE_FIELD_SUPERVISOR => [
            'dashboard.view',
            'site_reports.view', 'site_reports.create', 'site_reports.edit',
            'equipment.view',
            'tasks.view'
        ]
    ];
    
    /**
     * Load permissions for current user
     */
    private static function loadPermissions() {
        if (!empty(self::$permissions)) {
            return;
        }
        
        if (!Authentication::check()) {
            return;
        }
        
        $user = Authentication::user();
        $roleId = $user['role_id'];
        
        self::$permissions = self::$rolePermissions[$roleId] ?? [];
    }
    
    /**
     * Check if user has permission
     */
    public static function can($permission) {
        self::loadPermissions();
        
        // Superadmin has all permissions
        if (in_array('*', self::$permissions)) {
            return true;
        }
        
        return in_array($permission, self::$permissions);
    }
    
    /**
     * Check if user has any of the permissions
     */
    public static function canAny(array $permissions) {
        foreach ($permissions as $permission) {
            if (self::can($permission)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Check if user has all permissions
     */
    public static function canAll(array $permissions) {
        foreach ($permissions as $permission) {
            if (!self::can($permission)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Check if user has role
     */
    public static function hasRole($roleId) {
        if (!Authentication::check()) {
            return false;
        }
        
        $user = Authentication::user();
        return $user['role_id'] == $roleId;
    }
    
    /**
     * Require permission or throw exception
     */
    public static function require($permission) {
        if (!self::can($permission)) {
            throw new UnauthorizedException("Permission denied: $permission");
        }
    }
}