<?php
class AuditService {
    
    private $auditRepository;
    
    public function __construct() {
        $this->auditRepository = new AuditRepository();
    }
    
    /**
     * Log audit event (FR-25)
     */
    public function log($data) {
        // Ensure IP address is captured
        if (!isset($data['ip_address'])) {
            $data['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? null;
        }
        
        // Ensure details is JSON
        if (isset($data['details']) && !is_string($data['details'])) {
            $data['details'] = json_encode($data['details']);
        }
        
        return $this->auditRepository->create($data);
    }
    
    /**
     * Get audit trail for entity (FR-25)
     */
    public function getEntityAuditTrail($entityType, $entityId) {
        return $this->auditRepository->getEntityAuditTrail($entityType, $entityId);
    }
    
    /**
     * Get security events (FR-16)
     */
    public function getSecurityEvents($days = 7) {
        return $this->auditRepository->getSecurityEvents($days);
    }
}