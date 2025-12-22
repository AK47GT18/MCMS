<?php
/**
 * CORS Middleware
 * 
 * @file CorsMiddleware.php
 * @description Handles Cross-Origin Resource Sharing headers
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

namespace Mkaka\Middleware;

class CorsMiddleware {
    
    /**
     * Allowed origins (configure based on deployment)
     */
    private $allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:8080',
        // Add production domains here
    ];
    
    /**
     * Handle CORS headers
     */
    public function handle() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
        
        // Handle preflight OPTIONS request
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            $this->handlePreflight($origin);
            exit;
        }
        
        // Set CORS headers for regular requests
        $this->setCorsHeaders($origin);
    }
    
    /**
     * Handle preflight OPTIONS request
     */
    private function handlePreflight($origin) {
        if ($this->isOriginAllowed($origin)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
            header('Access-Control-Max-Age: 86400'); // 24 hours
        }
        
        http_response_code(204);
    }
    
    /**
     * Set CORS headers for regular requests
     */
    private function setCorsHeaders($origin) {
        if ($this->isOriginAllowed($origin)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Expose-Headers: Content-Length, Content-Type');
        }
    }
    
    /**
     * Check if origin is allowed
     */
    private function isOriginAllowed($origin) {
        if (!$origin) {
            return false;
        }
        
        // In development, allow all localhost
        if (getenv('APP_ENV') === 'development') {
            if (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false) {
                return true;
            }
        }
        
        // Check against whitelist
        return in_array($origin, $this->allowedOrigins);
    }
    
    /**
     * Add allowed origin
     */
    public function addAllowedOrigin($origin) {
        if (!in_array($origin, $this->allowedOrigins)) {
            $this->allowedOrigins[] = $origin;
        }
    }
    
    /**
     * Set allowed origins
     */
    public function setAllowedOrigins(array $origins) {
        $this->allowedOrigins = $origins;
    }
}
