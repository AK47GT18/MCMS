<?php
/**
 * Authorization Exception
 * 
 * Thrown when user lacks permission to access resource (FR-02)
 */
class AuthorizationException extends Exception {
    
    /**
     * Required permission
     */
    protected $requiredPermission;
    
    /**
     * Resource being accessed
     */
    protected $resource;
    
    /**
     * Constructor
     * 
     * @param string $message Error message
     * @param string $requiredPermission Permission that was required
     * @param string $resource Resource being accessed
     * @param int $code Error code
     */
    public function __construct(
        $message = "Access denied", 
        $requiredPermission = null, 
        $resource = null, 
        $code = 403
    ) {
        parent::__construct($message, $code);
        $this->requiredPermission = $requiredPermission;
        $this->resource = $resource;
    }
    
    /**
     * Get required permission
     * 
     * @return string|null
     */
    public function getRequiredPermission() {
        return $this->requiredPermission;
    }
    
    /**
     * Get resource
     * 
     * @return string|null
     */
    public function getResource() {
        return $this->resource;
    }
    
    /**
     * Convert to JSON response
     * 
     * @return array
     */
    public function toJson() {
        $response = [
            'success' => false,
            'error' => 'Access denied',
            'message' => $this->getMessage(),
            'code' => 'FORBIDDEN'
        ];
        
        // Include permission details if available
        if ($this->requiredPermission) {
            $response['required_permission'] = $this->requiredPermission;
        }
        
        if ($this->resource) {
            $response['resource'] = $this->resource;
        }
        
        return $response;
    }
    
    /**
     * Get user-friendly message
     * 
     * @return string
     */
    public function getUserMessage() {
        if ($this->requiredPermission) {
            return "You don't have permission to perform this action. Required: {$this->requiredPermission}";
        }
        
        return "You don't have permission to access this resource.";
    }
    
    /**
     * Log authorization failure
     */
    public function logFailure() {
        try {
            $user = Authentication::check() ? Authentication::user() : null;
            
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => $user['id'] ?? null,
                'action' => 'authorization_failed',
                'entity_type' => 'security',
                'entity_id' => null,
                'details' => json_encode([
                    'required_permission' => $this->requiredPermission,
                    'resource' => $this->resource,
                    'url' => $_SERVER['REQUEST_URI'] ?? null,
                    'method' => $_SERVER['REQUEST_METHOD'] ?? null
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null
            ]);
        } catch (Exception $e) {
            error_log("Failed to log authorization failure: " . $e->getMessage());
        }
    }
}
