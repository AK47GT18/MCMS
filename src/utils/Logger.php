<?php
/**
 * Logger Utility
 * 
 * @file Logger.php
 * @description Centralized logging utility
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

namespace Mkaka\Utils;

class Logger {
    
    private static $logPath = LOGS_PATH;
    
    /**
     * Log levels
     */
    const DEBUG = 'debug';
    const INFO = 'info';
    const WARNING = 'warning';
    const ERROR = 'error';
    const CRITICAL = 'critical';
    
    /**
     * Log a debug message
     */
    public static function debug($message, $context = []) {
        self::log(self::DEBUG, $message, $context);
    }
    
    /**
     * Log an info message
     */
    public static function info($message, $context = []) {
        self::log(self::INFO, $message, $context);
    }
    
    /**
     * Log a warning
     */
    public static function warning($message, $context = []) {
        self::log(self::WARNING, $message, $context);
    }
    
    /**
     * Log an error
     */
    public static function error($message, $context = []) {
        self::log(self::ERROR, $message, $context);
    }
    
    /**
     * Log a critical error
     */
    public static function critical($message, $context = []) {
        self::log(self::CRITICAL, $message, $context);
    }
    
    /**
     * Main logging method
     */
    private static function log($level, $message, $context = []) {
        // Ensure log directory exists
        if (!is_dir(self::$logPath)) {
            mkdir(self::$logPath, 0755, true);
        }
        
        // Prepare log entry
        $logEntry = [
            'timestamp' => date(DATETIME_FORMAT),
            'level' => strtoupper($level),
            'message' => $message,
            'context' => $context,
            'user_id' => Authentication::check() ? Authentication::user()['id'] : null,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'CLI',
            'uri' => $_SERVER['REQUEST_URI'] ?? 'CLI',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'CLI'
        ];
        
        // Add trace for errors
        if (in_array($level, [self::ERROR, self::CRITICAL])) {
            $logEntry['trace'] = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5);
        }
        
        // Determine log file
        $filename = self::$logPath . '/' . $level . '_' . date('Y-m-d') . '.log';
        
        // Write to log file
        $logLine = json_encode($logEntry) . PHP_EOL;
        file_put_contents($filename, $logLine, FILE_APPEND | LOCK_EX);
        
        // Also log to PHP error log for critical errors
        if ($level === self::CRITICAL) {
            error_log("CRITICAL: {$message}");
        }
    }
    
    /**
     * Log database query
     */
    public static function query($sql, $params = [], $executionTime = 0) {
        if (!getenv('LOG_QUERIES')) {
            return;
        }
        
        $logEntry = [
            'timestamp' => date(DATETIME_FORMAT),
            'type' => 'query',
            'sql' => $sql,
            'params' => $params,
            'execution_time_ms' => round($executionTime * 1000, 2),
            'user_id' => Authentication::check() ? Authentication::user()['id'] : null
        ];
        
        $filename = self::$logPath . '/query_' . date('Y-m-d') . '.log';
        $logLine = json_encode($logEntry) . PHP_EOL;
        file_put_contents($filename, $logLine, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Log security event
     */
    public static function security($event, $details = []) {
        $logEntry = [
            'timestamp' => date(DATETIME_FORMAT),
            'event' => $event,
            'details' => $details,
            'user_id' => Authentication::check() ? Authentication::user()['id'] : null,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
        ];
        
        $filename = self::$logPath . '/security_' . date('Y-m-d') . '.log';
        $logLine = json_encode($logEntry) . PHP_EOL;
        file_put_contents($filename, $logLine, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Log API request
     */
    public static function api($method, $endpoint, $statusCode, $responseTime) {
        $logEntry = [
            'timestamp' => date(DATETIME_FORMAT),
            'method' => $method,
            'endpoint' => $endpoint,
            'status_code' => $statusCode,
            'response_time_ms' => round($responseTime * 1000, 2),
            'user_id' => Authentication::check() ? Authentication::user()['id'] : null,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
        ];
        
        $filename = self::$logPath . '/api_' . date('Y-m-d') . '.log';
        $logLine = json_encode($logEntry) . PHP_EOL;
        file_put_contents($filename, $logLine, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Clear old logs
     */
    public static function clearOldLogs($days = 30) {
        $files = glob(self::$logPath . '/*.log');
        $cutoffTime = time() - ($days * 86400);
        
        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
            }
        }
    }
    
    /**
     * Get log files
     */
    public static function getLogFiles($type = null, $date = null) {
        $pattern = self::$logPath . '/';
        
        if ($type) {
            $pattern .= $type . '_';
        } else {
            $pattern .= '*_';
        }
        
        if ($date) {
            $pattern .= $date . '.log';
        } else {
            $pattern .= '*.log';
        }
        
        return glob($pattern);
    }
    
    /**
     * Read log file
     */
    public static function readLog($filename, $limit = 100) {
        $filepath = self::$logPath . '/' . $filename;
        
        if (!file_exists($filepath)) {
            return [];
        }
        
        $lines = file($filepath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $lines = array_reverse($lines); // Most recent first
        $lines = array_slice($lines, 0, $limit);
        
        $entries = [];
        foreach ($lines as $line) {
            $entry = json_decode($line, true);
            if ($entry) {
                $entries[] = $entry;
            }
        }
        
        return $entries;
    }
}