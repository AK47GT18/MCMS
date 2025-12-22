<?php
namespace Mkaka\Exceptions;

/**
 * Database Exception
 * 
 * Thrown when database operations fail
 */
class DatabaseException extends \Exception {
    
    /**
     * SQL query that caused the error
     */
    protected $query;
    
    /**
     * SQL error code
     */
    protected $sqlErrorCode;
    
    /**
     * SQL error message
     */
    protected $sqlErrorMessage;
    
    /**
     * Constructor
     * 
     * @param string $message Error message
     * @param string $query SQL query
     * @param string $sqlErrorCode SQL error code
     * @param string $sqlErrorMessage SQL error message
     * @param int $code Error code
     */
    public function __construct(
        $message = "Database error occurred", 
        $query = null, 
        $sqlErrorCode = null,
        $sqlErrorMessage = null,
        $code = 500
    ) {
        parent::__construct($message, $code);
        $this->query = $query;
        $this->sqlErrorCode = $sqlErrorCode;
        $this->sqlErrorMessage = $sqlErrorMessage;
        
        // Log database error
        $this->logError();
    }
    
    /**
     * Get SQL query
     * 
     * @return string|null
     */
    public function getQuery() {
        return $this->query;
    }
    
    /**
     * Get SQL error code
     * 
     * @return string|null
     */
    public function getSqlErrorCode() {
        return $this->sqlErrorCode;
    }
    
    /**
     * Get SQL error message
     * 
     * @return string|null
     */
    public function getSqlErrorMessage() {
        return $this->sqlErrorMessage;
    }
    
    /**
     * Check if duplicate entry error
     * 
     * @return bool
     */
    public function isDuplicateEntry() {
        return $this->sqlErrorCode === '23000' || 
               strpos($this->sqlErrorMessage, 'Duplicate entry') !== false;
    }
    
    /**
     * Check if connection error
     * 
     * @return bool
     */
    public function isConnectionError() {
        return in_array($this->sqlErrorCode, ['HY000', '2002', '2003', '2006']);
    }
    
    /**
     * Check if foreign key constraint error
     * 
     * @return bool
     */
    public function isForeignKeyError() {
        return $this->sqlErrorCode === '23000' && 
               strpos($this->sqlErrorMessage, 'foreign key constraint') !== false;
    }
    
    /**
     * Convert to JSON response
     * 
     * @return array
     */
    public function toJson() {
        return [
            'success' => false,
            'error' => 'Database error',
            'message' => 'A database error occurred. Please try again or contact support.',
            'code' => 'DATABASE_ERROR'
        ];
    }
    
    /**
     * Get detailed error (for logging/debugging only)
     * 
     * @return array
     */
    public function getDetailedError() {
        return [
            'message' => $this->getMessage(),
            'query' => $this->query,
            'sql_error_code' => $this->sqlErrorCode,
            'sql_error_message' => $this->sqlErrorMessage,
            'file' => $this->getFile(),
            'line' => $this->getLine(),
            'trace' => $this->getTraceAsString()
        ];
    }
    
    /**
     * Log database error
     */
    private function logError() {
        // Log to error log
        error_log(sprintf(
            "Database Error: %s | Query: %s | SQL Error: [%s] %s",
            $this->getMessage(),
            $this->query ?? 'N/A',
            $this->sqlErrorCode ?? 'N/A',
            $this->sqlErrorMessage ?? 'N/A'
        ));
        
        // Log to audit trail
        try {
            $user = Authentication::check() ? Authentication::user() : null;
            
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => $user['id'] ?? null,
                'action' => 'database_error',
                'entity_type' => 'system',
                'entity_id' => null,
                'details' => json_encode([
                    'error_message' => $this->getMessage(),
                    'sql_error_code' => $this->sqlErrorCode,
                    'sql_error_message' => $this->sqlErrorMessage,
                    'query' => $this->sanitizeQuery($this->query)
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null
            ]);
        } catch (Exception $e) {
            // Avoid infinite loop if audit logging also fails
            error_log("Failed to log database error to audit trail: " . $e->getMessage());
        }
    }
    
    /**
     * Sanitize query for logging (remove sensitive data)
     * 
     * @param string $query SQL query
     * @return string
     */
    private function sanitizeQuery($query) {
        if (!$query) {
            return null;
        }
        
        // Remove potential password values
        $query = preg_replace("/password\s*=\s*'[^']*'/i", "password='***'", $query);
        $query = preg_replace('/password\s*=\s*"[^"]*"/i', 'password="***"', $query);
        
        return $query;
    }
    
    /**
     * Get user-friendly message based on error type
     * 
     * @return string
     */
    public function getUserMessage() {
        if ($this->isDuplicateEntry()) {
            return "This record already exists. Please check your input.";
        }
        
        if ($this->isConnectionError()) {
            return "Unable to connect to the database. Please try again later.";
        }
        
        if ($this->isForeignKeyError()) {
            return "Cannot perform this action because related records exist.";
        }
        
        return "A database error occurred. Please try again or contact support.";
    }
}