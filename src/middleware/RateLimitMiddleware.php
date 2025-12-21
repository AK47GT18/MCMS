<?php
/**
 * Rate Limit Middleware
 * 
 * @file RateLimitMiddleware.php
 * @description Prevents abuse through rate limiting and throttling
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 * @security Implements sliding window rate limiting algorithm
 */

class RateLimitMiddleware {
    
    /**
     * Rate limit configurations for different endpoints
     */
    private const RATE_LIMITS = [
        // Authentication endpoints - strict limits
        'auth.login' => ['max' => 5, 'window' => 900],        // 5 attempts per 15 minutes
        'auth.forgot_password' => ['max' => 3, 'window' => 3600], // 3 per hour
        'auth.reset_password' => ['max' => 3, 'window' => 3600],  // 3 per hour
        
        // API endpoints - moderate limits
        'api.write' => ['max' => 100, 'window' => 3600],      // 100 writes per hour
        'api.read' => ['max' => 300, 'window' => 3600],       // 300 reads per hour
        
        // File uploads - strict limits
        'upload.file' => ['max' => 50, 'window' => 3600],     // 50 uploads per hour
        'upload.photo' => ['max' => 100, 'window' => 3600],   // 100 photos per hour
        
        // Report generation - moderate limits
        'report.generate' => ['max' => 30, 'window' => 3600], // 30 reports per hour
        'report.export' => ['max' => 20, 'window' => 3600],   // 20 exports per hour
        
        // General endpoints - lenient limits
        'general' => ['max' => 500, 'window' => 3600]         // 500 requests per hour
    ];
    
    /**
     * Cache backend (using APCu for in-memory storage)
     */
    private const CACHE_PREFIX = 'rate_limit:';
    
    /**
     * Handle rate limiting
     */
    public function handle() {
        $identifier = $this->getIdentifier();
        $endpoint = $this->getEndpoint();
        $limit = $this->getLimit($endpoint);
        
        // Check if rate limit exceeded
        if ($this->isRateLimitExceeded($identifier, $endpoint, $limit)) {
            $this->handleRateLimitExceeded($identifier, $endpoint, $limit);
        }
        
        // Record this request
        $this->recordRequest($identifier, $endpoint, $limit);
        
        // Add rate limit headers
        $this->addRateLimitHeaders($identifier, $endpoint, $limit);
    }
    
    /**
     * Get unique identifier for rate limiting (IP + User ID if authenticated)
     */
    private function getIdentifier() {
        $ip = $_SERVER['REMOTE_ADDR'];
        
        // Include user ID if authenticated for more accurate tracking
        if (Authentication::check()) {
            $user = Authentication::user();
            return "user:{$user['id']}:ip:$ip";
        }
        
        return "ip:$ip";
    }
    
    /**
     * Get endpoint category based on current request
     */
    private function getEndpoint() {
        $uri = $_SERVER['REQUEST_URI'];
        $method = $_SERVER['REQUEST_METHOD'];
        
        // Authentication endpoints
        if (preg_match('#^/login#', $uri)) {
            return 'auth.login';
        }
        if (preg_match('#^/forgot-password#', $uri)) {
            return 'auth.forgot_password';
        }
        if (preg_match('#^/reset-password#', $uri)) {
            return 'auth.reset_password';
        }
        
        // API endpoints
        if (preg_match('#^/api/#', $uri)) {
            return in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE']) 
                ? 'api.write' 
                : 'api.read';
        }
        
        // Upload endpoints
        if (preg_match('#/upload#', $uri)) {
            return preg_match('#/photo#', $uri) ? 'upload.photo' : 'upload.file';
        }
        
        // Report endpoints
        if (preg_match('#/reports?#', $uri)) {
            return preg_match('#/export#', $uri) ? 'report.export' : 'report.generate';
        }
        
        // Default general limit
        return 'general';
    }
    
    /**
     * Get rate limit configuration for endpoint
     */
    private function getLimit($endpoint) {
        return self::RATE_LIMITS[$endpoint] ?? self::RATE_LIMITS['general'];
    }
    
    /**
     * Check if rate limit is exceeded
     */
    private function isRateLimitExceeded($identifier, $endpoint, $limit) {
        $key = $this->getCacheKey($identifier, $endpoint);
        $data = apcu_fetch($key);
        
        if (!$data) {
            return false; // No requests recorded yet
        }
        
        // Remove expired timestamps (sliding window)
        $currentTime = time();
        $windowStart = $currentTime - $limit['window'];
        $data['timestamps'] = array_filter($data['timestamps'], function($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        });
        
        // Check if limit exceeded
        return count($data['timestamps']) >= $limit['max'];
    }
    
    /**
     * Record current request
     */
    private function recordRequest($identifier, $endpoint, $limit) {
        $key = $this->getCacheKey($identifier, $endpoint);
        $data = apcu_fetch($key) ?: ['timestamps' => []];
        
        // Add current timestamp
        $data['timestamps'][] = time();
        
        // Clean old timestamps (sliding window)
        $windowStart = time() - $limit['window'];
        $data['timestamps'] = array_filter($data['timestamps'], function($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        });
        
        // Reset array keys
        $data['timestamps'] = array_values($data['timestamps']);
        
        // Store in cache (TTL = window duration + buffer)
        apcu_store($key, $data, $limit['window'] + 60);
    }
    
    /**
     * Handle rate limit exceeded
     */
    private function handleRateLimitExceeded($identifier, $endpoint, $limit) {
        // Log rate limit violation
        $this->logRateLimitViolation($identifier, $endpoint, $limit);
        
        // Calculate retry-after time
        $key = $this->getCacheKey($identifier, $endpoint);
        $data = apcu_fetch($key);
        $oldestTimestamp = min($data['timestamps']);
        $retryAfter = ($oldestTimestamp + $limit['window']) - time();
        
        // Check if AJAX request
        if ($this->isAjaxRequest()) {
            http_response_code(429);
            header('Content-Type: application/json');
            header("Retry-After: $retryAfter");
            echo json_encode([
                'success' => false,
                'error' => 'Rate limit exceeded',
                'message' => 'Too many requests. Please try again later.',
                'retry_after' => $retryAfter,
                'code' => 'RATE_LIMIT_EXCEEDED'
            ]);
            exit;
        }
        
        // For regular requests
        http_response_code(429);
        header("Retry-After: $retryAfter");
        
        if (!isset($_SESSION)) {
            session_start();
        }
        
        $_SESSION['_flash']['error'] = "Too many requests. Please try again in " . 
                                       $this->formatRetryTime($retryAfter) . ".";
        
        $referer = $_SERVER['HTTP_REFERER'] ?? '/dashboard';
        header("Location: $referer");
        exit;
    }
    
    /**
     * Add rate limit headers to response
     */
    private function addRateLimitHeaders($identifier, $endpoint, $limit) {
        $key = $this->getCacheKey($identifier, $endpoint);
        $data = apcu_fetch($key) ?: ['timestamps' => []];
        
        $remaining = max(0, $limit['max'] - count($data['timestamps']));
        $resetTime = time() + $limit['window'];
        
        header("X-RateLimit-Limit: {$limit['max']}");
        header("X-RateLimit-Remaining: $remaining");
        header("X-RateLimit-Reset: $resetTime");
        header("X-RateLimit-Window: {$limit['window']}");
    }
    
    /**
     * Get cache key
     */
    private function getCacheKey($identifier, $endpoint) {
        return self::CACHE_PREFIX . md5("$identifier:$endpoint");
    }
    
    /**
     * Check if request is AJAX
     */
    private function isAjaxRequest() {
        return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }
    
    /**
     * Format retry time for human reading
     */
    private function formatRetryTime($seconds) {
        if ($seconds < 60) {
            return "$seconds second" . ($seconds !== 1 ? 's' : '');
        }
        
        $minutes = ceil($seconds / 60);
        return "$minutes minute" . ($minutes !== 1 ? 's' : '');
    }
    
    /**
     * Log rate limit violation
     */
    private function logRateLimitViolation($identifier, $endpoint, $limit) {
        try {
            $user = Authentication::check() ? Authentication::user() : null;
            
            $logData = [
                'user_id' => $user['id'] ?? null,
                'action' => 'rate_limit_exceeded',
                'entity_type' => 'security',
                'entity_id' => null,
                'details' => json_encode([
                    'identifier' => $identifier,
                    'endpoint' => $endpoint,
                    'limit' => $limit['max'],
                    'window' => $limit['window'],
                    'url' => $_SERVER['REQUEST_URI'],
                    'method' => $_SERVER['REQUEST_METHOD'],
                    'user_agent' => $_SERVER['HTTP_USER_AGENT']
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ];
            
            $auditLog = new AuditLog();
            $auditLog->create($logData);
            
        } catch (Exception $e) {
            error_log("Failed to log rate limit violation: " . $e->getMessage());
        }
    }
    
    /**
     * Manually reset rate limit for identifier (admin function)
     */
    public static function resetLimit($identifier, $endpoint = null) {
        if ($endpoint) {
            $key = self::CACHE_PREFIX . md5("$identifier:$endpoint");
            apcu_delete($key);
        } else {
            // Reset all endpoints for identifier
            foreach (array_keys(self::RATE_LIMITS) as $ep) {
                $key = self::CACHE_PREFIX . md5("$identifier:$ep");
                apcu_delete($key);
            }
        }
    }
    
    /**
     * Get current rate limit status for identifier
     */
    public static function getStatus($identifier, $endpoint) {
        $limit = self::RATE_LIMITS[$endpoint] ?? self::RATE_LIMITS['general'];
        $key = self::CACHE_PREFIX . md5("$identifier:$endpoint");
        $data = apcu_fetch($key) ?: ['timestamps' => []];
        
        // Clean old timestamps
        $windowStart = time() - $limit['window'];
        $data['timestamps'] = array_filter($data['timestamps'], function($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        });
        
        return [
            'limit' => $limit['max'],
            'remaining' => max(0, $limit['max'] - count($data['timestamps'])),
            'used' => count($data['timestamps']),
            'reset_at' => time() + $limit['window'],
            'window' => $limit['window']
        ];
    }
}