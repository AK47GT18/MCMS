<?php
/**
 * Role-Based Access Control Middleware
 * 
 * @file RoleMiddleware.php
 * @description Enforces role-based permissions (FR-02)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

namespace Mkaka\Middleware;

use Mkaka\Core\Authorization;
use Mkaka\Core\Authentication;

class RoleMiddleware {
    
    /**
     * Handle role-based authorization
     * 
     * @param string $permission Required permission
     */
    public function handle($permission = null) {
        // First ensure user is authenticated
        if (!Authentication::check()) {
            $this->unauthorized('Authentication required');
            return;
        }
        
        // If no specific permission required, just check authentication
        if ($permission === null) {
            return;
        }
        
        // Check if user has required permission
        if (!Authorization::can($permission)) {
            $this->logUnauthorizedAccess($permission);
            $this->unauthorized('You do not have permission to access this resource');
            return;
        }
    }
    
    /**
     * Handle unauthorized access
     */
    private function unauthorized($message) {
        // Check if AJAX request
        if ($this->isAjaxRequest()) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => $message
            ]);
            exit;
        }
        
        // Redirect with error message for regular requests
        $_SESSION['_flash']['error'] = $message;
        header('Location: /dashboard');
        exit;
    }
    
    /**
     * Log unauthorized access attempt
     */
    private function logUnauthorizedAccess($permission) {
        try {
            $user = Authentication::user();
            
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => $user['id'],
                'action' => 'unauthorized_access_attempt',
                'entity_type' => 'permission',
                'entity_id' => null,
                'details' => json_encode([
                    'required_permission' => $permission,
                    'user_role' => $user['role_id'],
                    'requested_url' => $_SERVER['REQUEST_URI']
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ]);
        } catch (Exception $e) {
            error_log("Failed to log unauthorized access: " . $e->getMessage());
        }
    }
    
    /**
     * Check if request is AJAX
     */
    private function isAjaxRequest() {
        return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }
    
    /**
     * Check if user has specific role
     * 
     * @param int $roleId Role ID to check
     */
    public function requireRole($roleId) {
        if (!Authentication::check()) {
            $this->unauthorized('Authentication required');
            return;
        }
        
        if (!Authorization::hasRole($roleId)) {
            $this->logUnauthorizedAccess("role:{$roleId}");
            $this->unauthorized('Access denied. Insufficient privileges.');
            return;
        }
    }
    
    /**
     * Check if user has any of the specified roles
     * 
     * @param array $roleIds Array of role IDs
     */
    public function requireAnyRole(array $roleIds) {
        if (!Authentication::check()) {
            $this->unauthorized('Authentication required');
            return;
        }
        
        $user = Authentication::user();
        $userRoleId = $user['role_id'];
        
        if (!in_array($userRoleId, $roleIds)) {
            $this->logUnauthorizedAccess("roles:" . implode(',', $roleIds));
            $this->unauthorized('Access denied. Insufficient privileges.');
            return;
        }
    }
    
    /**
     * Check if user can access own resource or has admin permission
     * 
     * @param int $resourceOwnerId Owner ID of the resource
     * @param string $adminPermission Admin permission to check
     */
    public function canAccessResource($resourceOwnerId, $adminPermission = null) {
        if (!Authentication::check()) {
            $this->unauthorized('Authentication required');
            return false;
        }
        
        $user = Authentication::user();
        
        // User can access own resources
        if ($user['id'] == $resourceOwnerId) {
            return true;
        }
        
        // Or if they have admin permission
        if ($adminPermission && Authorization::can($adminPermission)) {
            return true;
        }
        
        $this->unauthorized('You can only access your own resources');
        return false;
    }
}