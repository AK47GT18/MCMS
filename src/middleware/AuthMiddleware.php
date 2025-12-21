<?php
/**
 * Authentication Middleware
 * 
 * @file AuthMiddleware.php
 * @description Ensures user is authenticated before accessing protected routes
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class AuthMiddleware {
    
    /**
     * Handle authentication check
     */
    public function handle() {
        // Check if user is authenticated
        if (!Authentication::check()) {
            // Store intended URL for redirect after login
            $this->storeIntendedUrl();
            
            // Check if AJAX request
            if ($this->isAjaxRequest()) {
                http_response_code(401);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => 'Unauthorized. Please login to continue.',
                    'redirect' => '/login'
                ]);
                exit;
            }
            
            // Redirect to login for regular requests
            $_SESSION['_flash']['error'] = 'Please login to access this page';
            header('Location: /login');
            exit;
        }
        
        // Check session expiry (FR-17)
        $this->checkSessionExpiry();
        
        // Update last activity timestamp
        $this->updateLastActivity();
    }
    
    /**
     * Store intended URL for post-login redirect
     */
    private function storeIntendedUrl() {
        $currentUrl = $_SERVER['REQUEST_URI'];
        
        // Don't store login/logout URLs
        if (!in_array($currentUrl, ['/login', '/logout', '/forgot-password'])) {
            $_SESSION['_intended_url'] = $currentUrl;
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
     * Check session expiry (2 hours - NFR)
     */
    private function checkSessionExpiry() {
        $lastActivity = $_SESSION['_last_activity'] ?? time();
        $currentTime = time();
        
        // Check if session has expired (2 hours = 7200 seconds)
        if (($currentTime - $lastActivity) > SESSION_LIFETIME) {
            // Log session timeout
            $user = Authentication::user();
            if ($user) {
                $auditLog = new AuditLog();
                $auditLog->create([
                    'user_id' => $user['id'],
                    'action' => 'session_timeout',
                    'entity_type' => 'user',
                    'entity_id' => $user['id'],
                    'details' => json_encode([
                        'last_activity' => date(DATETIME_FORMAT, $lastActivity),
                        'timeout_duration' => SESSION_LIFETIME
                    ]),
                    'ip_address' => $_SERVER['REMOTE_ADDR']
                ]);
            }
            
            // Destroy session
            Authentication::logout();
            
            $_SESSION['_flash']['error'] = 'Your session has expired. Please login again.';
            header('Location: /login');
            exit;
        }
    }
    
    /**
     * Update last activity timestamp
     */
    private function updateLastActivity() {
        $_SESSION['_last_activity'] = time();
    }
    
    /**
     * Get intended URL after login
     */
    public static function getIntendedUrl() {
        $url = $_SESSION['_intended_url'] ?? '/dashboard';
        unset($_SESSION['_intended_url']);
        return $url;
    }
}