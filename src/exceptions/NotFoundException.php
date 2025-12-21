<?php
/**
 * Not Found Exception
 * 
 * Thrown when requested resource is not found
 */
class NotFoundException extends Exception {
    
    /**
     * Resource type
     */
    protected $resourceType;
    
    /**
     * Resource identifier
     */
    protected $resourceId;
    
    /**
     * Constructor
     * 
     * @param string $message Error message
     * @param string $resourceType Type of resource (project, user, transaction, etc.)
     * @param mixed $resourceId Identifier of the resource
     * @param int $code Error code
     */
    public function __construct(
        $message = "Resource not found", 
        $resourceType = null, 
        $resourceId = null, 
        $code = 404
    ) {
        parent::__construct($message, $code);
        $this->resourceType = $resourceType;
        $this->resourceId = $resourceId;
    }
    
    /**
     * Get resource type
     * 
     * @return string|null
     */
    public function getResourceType() {
        return $this->resourceType;
    }
    
    /**
     * Get resource ID
     * 
     * @return mixed
     */
    public function getResourceId() {
        return $this->resourceId;
    }
    
    /**
     * Convert to JSON response
     * 
     * @return array
     */
    public function toJson() {
        $response = [
            'success' => false,
            'error' => 'Not found',
            'message' => $this->getMessage(),
            'code' => 'NOT_FOUND'
        ];
        
        if ($this->resourceType) {
            $response['resource_type'] = $this->resourceType;
        }
        
        if ($this->resourceId) {
            $response['resource_id'] = $this->resourceId;
        }
        
        return $response;
    }
    
    /**
     * Get user-friendly message
     * 
     * @return string
     */
    public function getUserMessage() {
        if ($this->resourceType && $this->resourceId) {
            return ucfirst($this->resourceType) . " with ID '{$this->resourceId}' not found.";
        }
        
        if ($this->resourceType) {
            return ucfirst($this->resourceType) . " not found.";
        }
        
        return "The requested resource could not be found.";
    }
    
    /**
     * Create exception for specific resource types
     */
    public static function project($projectId) {
        return new self("Project not found", 'project', $projectId);
    }
    
    public static function user($userId) {
        return new self("User not found", 'user', $userId);
    }
    
    public static function transaction($transactionId) {
        return new self("Transaction not found", 'transaction', $transactionId);
    }
    
    public static function contract($contractId) {
        return new self("Contract not found", 'contract', $contractId);
    }
    
    public static function equipment($equipmentId) {
        return new self("Equipment not found", 'equipment', $equipmentId);
    }
    
    public static function siteReport($reportId) {
        return new self("Site report not found", 'site_report', $reportId);
    }
}
