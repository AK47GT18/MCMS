<?php
/**
 * CSRF Middleware
 * 
 * @file CsrfMiddleware.php
 * @description Protects against Cross-Site Request Forgery attacks
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 * @security Implements OWASP CSRF protection best practices
 */

namespace Mkaka\Middleware;

use Mkaka\Core\Session;

class CsrfMiddleware {
    
    /**
     * CSRF token session key
     */
    private const TOKEN_SESSION_KEY = '_csrf_token';
    
    /**
     * CSRF token header name
     */
    private const TOKEN_HEADER = 'X-CSRF-Token';
    
    /**
     * CSRF token form field name
     */
    private const TOKEN_FIELD = '_token';
    
    /**
     * Token lifetime in seconds (2 hours to match session)
     */
    private const TOKEN_LIFETIME = 7200;
    
    /**
     * Handle CSRF validation for state-changing requests
     */
    public function handle() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        // Only validate state-changing requests (POST, PUT, DELETE, PATCH)
        if (!in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            return;
        }
        
        // Skip CSRF for API endpoints with Bearer tokens
        if ($this->isApiRequest() && $this->hasBearerToken()) {
            return;
        }
        
        // Validate CSRF token
        if (!$this->validateToken()) {
            $this->handleInvalidToken();
        }
        
        // Rotate token on successful validation (double-submit pattern)
        $this->rotateToken();
    }
    
    /**
     * Generate new CSRF token
     */
    public static function generateToken() {
        if (!isset($_SESSION)) {
            session_start();
        }
        
        $token = [
            'value' => bin2hex(random_bytes(32)),
            'timestamp' => time()
        ];
        
        $_SESSION[self::TOKEN_SESSION_KEY] = $token;
        
        return $token['value'];
    }
    
    /**
     * Get current CSRF token
     */
    public static function getToken() {
        if (!isset($_SESSION)) {
            session_start();
        }
        
        // Generate token if doesn't exist or expired
        if (!isset($_SESSION[self::TOKEN_SESSION_KEY]) || self::isTokenExpired()) {
            return self::generateToken();
        }
        
        return $_SESSION[self::TOKEN_SESSION_KEY]['value'];
    }
    
    /**
     * Validate CSRF token
     */
    private function validateToken() {
        $tokenFromRequest = $this->getTokenFromRequest();
        $tokenFromSession = $this->getTokenFromSession();
        
        // Token must exist in both request and session
        if (!$tokenFromRequest || !$tokenFromSession) {
            $this->logCsrfAttempt('missing_token');
            return false;
        }
        
        // Check if session token is expired
        if (self::isTokenExpired()) {
            $this->logCsrfAttempt('expired_token');
            return false;
        }
        
        // Compare tokens using timing-safe comparison
        if (!hash_equals($tokenFromSession, $tokenFromRequest)) {
            $this->logCsrfAttempt('invalid_token');
            return false;
        }
        
        return true;
    }
    
    /**
     * Get token from request
     */
    private function getTokenFromRequest() {
        // Check header first (for AJAX requests)
        if (isset($_SERVER['HTTP_' . str_replace('-', '_', strtoupper(self::TOKEN_HEADER))])) {
            return $_SERVER['HTTP_' . str_replace('-', '_', strtoupper(self::TOKEN_HEADER))];
        }
        
        // Check POST data (for form submissions)
        if (isset($_POST[self::TOKEN_FIELD])) {
            return $_POST[self::TOKEN_FIELD];
        }
        
        // Check JSON body
        $jsonData = json_decode(file_get_contents('php://input'), true);
        if (isset($jsonData[self::TOKEN_FIELD])) {
            return $jsonData[self::TOKEN_FIELD];
        }
        
        return null;
    }
    
    /**
     * Get token from session
     */
    private function getTokenFromSession() {
        if (!isset($_SESSION)) {
            session_start();
        }
        
        return $_SESSION[self::TOKEN_SESSION_KEY]['value'] ?? null;
    }
    
    /**
     * Check if token is expired
     */
    private static function isTokenExpired() {
        if (!isset($_SESSION[self::TOKEN_SESSION_KEY])) {
            return true;
        }
        
        $tokenAge = time() - $_SESSION[self::TOKEN_SESSION_KEY]['timestamp'];
        return $tokenAge > self::TOKEN_LIFETIME;
    }
    
    /**
     * Rotate token after successful validation
     */
    private function rotateToken() {
        self::generateToken();
    }
    
    /**
     * Check if request is API request
     */
    private function isApiRequest() {
        $uri = $_SERVER['REQUEST_URI'];
        return strpos($uri, '/api/') === 0;
    }
    
    /**
     * Check if request has Bearer token
     */
    private function hasBearerToken() {
        $headers = getallheaders();
        return isset($headers['Authorization']) && 
               strpos($headers['Authorization'], 'Bearer ') === 0;
    }
    
    /**
     * Handle invalid token
     */
    private function handleInvalidToken() {
        // Check if AJAX request
        if ($this->isAjaxRequest()) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => 'CSRF token validation failed',
                'message' => 'Security token expired or invalid. Please refresh the page.',
                'code' => 'CSRF_INVALID'
            ]);
            exit;
        }
        
        // For regular requests, redirect with error
        if (!isset($_SESSION)) {
            session_start();
        }
        
        $_SESSION['_flash']['error'] = 'Security token expired. Please try again.';
        
        $referer = $_SERVER['HTTP_REFERER'] ?? '/dashboard';
        header("Location: $referer");
        exit;
    }
    
    /**
     * Check if request is AJAX
     */
    private function isAjaxRequest() {
        return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }
    
    /**
     * Log CSRF attempt
     */
    private function logCsrfAttempt($reason) {
        try {
            $user = Authentication::check() ? Authentication::user() : null;
            
            $logData = [
                'user_id' => $user['id'] ?? null,
                'action' => 'csrf_validation_failed',
                'entity_type' => 'security',
                'entity_id' => null,
                'details' => json_encode([
                    'reason' => $reason,
                    'url' => $_SERVER['REQUEST_URI'],
                    'method' => $_SERVER['REQUEST_METHOD'],
                    'referer' => $_SERVER['HTTP_REFERER'] ?? null,
                    'user_agent' => $_SERVER['HTTP_USER_AGENT']
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ];
            
            $auditLog = new AuditLog();
            $auditLog->create($logData);
            
        } catch (Exception $e) {
            error_log("Failed to log CSRF attempt: " . $e->getMessage());
        }
    }
    
    /**
     * Generate hidden input field for forms
     */
    public static function field() {
        $token = self::getToken();
        return '<input type="hidden" name="' . self::TOKEN_FIELD . '" value="' . htmlspecialchars($token) . '">';
    }
    
    /**
     * Generate meta tag for AJAX requests
     */
    public static function metaTag() {
        $token = self::getToken();
        return '<meta name="csrf-token" content="' . htmlspecialchars($token) . '">';
    }
}