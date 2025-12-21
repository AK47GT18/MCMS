<?php
/**
 * Request Logging Middleware
 * 
 * @file LogMiddleware.php
 * @description Logs all HTTP requests for debugging and auditing
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class LogMiddleware {
    
    private $startTime;
    private $startMemory;
    
    /**
     * Handle request logging
     */
    public function handle() {
        // Record start time and memory
        $this->startTime = microtime(true);
        $this->startMemory = memory_get_usage();
        
        // Log incoming request
        $this->logRequest();
        
        // Register shutdown function to log response
        register_shutdown_function([$this, 'logResponse']);
    }
    
    /**
     * Log incoming request
     */
    private function logRequest() {
        $logData = [
            'timestamp' => date(DATETIME_FORMAT),
            'method' => $_SERVER['REQUEST_METHOD'],
            'uri' => $_SERVER['REQUEST_URI'],
            'ip' => $this->getClientIp(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'referer' => $_SERVER['HTTP_REFERER'] ?? null,
            'user_id' => Authentication::check() ? Authentication::user()['id'] : null,
            'session_id' => session_id()
        ];
        
        // Log to file
        $this->writeLog('request', $logData);
    }
    
    /**
     * Log response (called at shutdown)
     */
    public function logResponse() {
        $endTime = microtime(true);
        $endMemory = memory_get_usage();
        
        $executionTime = round(($endTime - $this->startTime) * 1000, 2); // milliseconds
        $memoryUsed = round(($endMemory - $this->startMemory) / 1024, 2); // KB
        
        $logData = [
            'timestamp' => date(DATETIME_FORMAT),
            'execution_time_ms' => $executionTime,
            'memory_used_kb' => $memoryUsed,
            'response_code' => http_response_code(),
            'uri' => $_SERVER['REQUEST_URI']
        ];
        
        // Check for slow requests (NFR-01, NFR-02)
        if ($executionTime > 5000) { // 5 seconds
            $this->logSlowRequest($executionTime, $memoryUsed);
        }
        
        // Log to file
        $this->writeLog('response', $logData);
    }
    
    /**
     * Log slow request for performance monitoring
     */
    private function logSlowRequest($executionTime, $memoryUsed) {
        $logData = [
            'timestamp' => date(DATETIME_FORMAT),
            'type' => 'slow_request',
            'uri' => $_SERVER['REQUEST_URI'],
            'method' => $_SERVER['REQUEST_METHOD'],
            'execution_time_ms' => $executionTime,
            'memory_used_kb' => $memoryUsed,
            'user_id' => Authentication::check() ? Authentication::user()['id'] : null,
            'ip' => $this->getClientIp()
        ];
        
        $this->writeLog('performance', $logData);
        
        // Also log to error log
        error_log("SLOW REQUEST: {$_SERVER['REQUEST_URI']} took {$executionTime}ms");
    }
    
    /**
     * Write log entry to file
     */
    private function writeLog($type, $data) {
        $logFile = LOGS_PATH . "/{$type}_" . date('Y-m-d') . '.log';
        
        // Ensure logs directory exists
        if (!is_dir(LOGS_PATH)) {
            mkdir(LOGS_PATH, 0755, true);
        }
        
        $logEntry = json_encode($data) . PHP_EOL;
        
        // Write to log file
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Get real client IP address
     */
    private function getClientIp() {
        $ipKeys = [
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];
        
        foreach ($ipKeys as $key) {
            if (isset($_SERVER[$key]) && filter_var($_SERVER[$key], FILTER_VALIDATE_IP)) {
                return $_SERVER[$key];
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    }
    
    /**
     * Log error
     */
    public static function logError($message, $context = []) {
        $logData = [
            'timestamp' => date(DATETIME_FORMAT),
            'type' => 'error',
            'message' => $message,
            'context' => $context,
            'uri' => $_SERVER['REQUEST_URI'] ?? 'CLI',
            'user_id' => Authentication::check() ? Authentication::user()['id'] : null,
            'stack_trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
        ];
        
        $logFile = LOGS_PATH . '/error_' . date('Y-m-d') . '.log';
        
        if (!is_dir(LOGS_PATH)) {
            mkdir(LOGS_PATH, 0755, true);
        }
        
        $logEntry = json_encode($logData) . PHP_EOL;
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        // Also log to PHP error log
        error_log($message);
    }
    
    /**
     * Log security event
     */
    public static function logSecurityEvent($event, $details = []) {
        $logData = [
            'timestamp' => date(DATETIME_FORMAT),
            'type' => 'security',
            'event' => $event,
            'details' => $details,
            'uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'user_id' => Authentication::check() ? Authentication::user()['id'] : null
        ];
        
        $logFile = LOGS_PATH . '/security_' . date('Y-m-d') . '.log';
        
        if (!is_dir(LOGS_PATH)) {
            mkdir(LOGS_PATH, 0755, true);
        }
        
        $logEntry = json_encode($logData) . PHP_EOL;
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
}
