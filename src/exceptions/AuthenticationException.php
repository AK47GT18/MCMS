<?php
namespace Mkaka\Exceptions;

/**
 * Authentication Exception
 * 
 * Thrown when user authentication fails (FR-01, FR-16, FR-17)
 */
class AuthenticationException extends \Exception {
    
    /**
     * Authentication failure reason
     */
    protected $reason;
    
    /**
     * Constructor
     * 
     * @param string $message Error message
     * @param string $reason Failure reason (invalid_credentials, account_locked, etc.)
     * @param int $code Error code
     */
    public function __construct($message = "Authentication failed", $reason = 'auth_failed', $code = 401) {
        parent::__construct($message, $code);
        $this->reason = $reason;
    }
    
    /**
     * Get failure reason
     * 
     * @return string
     */
    public function getReason() {
        return $this->reason;
    }
    
    /**
     * Check if account is locked (FR-17)
     * 
     * @return bool
     */
    public function isAccountLocked() {
        return $this->reason === 'account_locked';
    }
    
    /**
     * Check if credentials are invalid
     * 
     * @return bool
     */
    public function isInvalidCredentials() {
        return $this->reason === 'invalid_credentials';
    }
    
    /**
     * Check if session expired
     * 
     * @return bool
     */
    public function isSessionExpired() {
        return $this->reason === 'session_expired';
    }
    
    /**
     * Convert to JSON response
     * 
     * @return array
     */
    public function toJson() {
        return [
            'success' => false,
            'error' => 'Authentication failed',
            'message' => $this->getMessage(),
            'reason' => $this->reason,
            'code' => 'AUTH_FAILED',
            'redirect' => '/login'
        ];
    }
    
    /**
     * Get user-friendly message
     * 
     * @return string
     */
    public function getUserMessage() {
        switch ($this->reason) {
            case 'account_locked':
                return 'Your account has been temporarily locked due to multiple failed login attempts. Please try again in 30 minutes.';
            
            case 'invalid_credentials':
                return 'Invalid username or password. Please try again.';
            
            case 'session_expired':
                return 'Your session has expired. Please login again.';
            
            case 'account_disabled':
                return 'Your account has been disabled. Please contact the administrator.';
            
            default:
                return $this->getMessage();
        }
    }
}