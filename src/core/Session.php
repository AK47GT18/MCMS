<?php
namespace Mkaka\Core;

class Session {
    public function __construct() {
        if (session_status() === PHP_SESSION_NONE) {
            // Try Redis first, fall back to files
            if (extension_loaded('redis')) {
                ini_set('session.save_handler', 'redis');
                ini_set('session.save_path', 'tcp://redis:6379?database=1');
            }
            $this->start();
        }
    }
    
    /**
     * Start session with security settings
     */
    private function start() {
        $securityConfig = require __DIR__ . '/../config/security.php';
        
        ini_set('session.cookie_httponly', 1);
        ini_set('session.cookie_secure', $securityConfig['session']['secure'] ? 1 : 0);
        ini_set('session.cookie_samesite', $securityConfig['session']['samesite']);
        ini_set('session.use_strict_mode', 1);
        
        session_name($securityConfig['session']['name']);
        session_start();
        
        // Regenerate ID periodically for security
        if (!$this->has('_session_started')) {
            session_regenerate_id(true);
            $this->set('_session_started', time());
        }
    }
    
    /**
     * Set session value
     */
    public function set($key, $value) {
        $_SESSION[$key] = $value;
    }
    
    /**
     * Get session value
     */
    public function get($key, $default = null) {
        return $_SESSION[$key] ?? $default;
    }
    
    /**
     * Check if key exists
     */
    public function has($key) {
        return isset($_SESSION[$key]);
    }
    
    /**
     * Remove session key
     */
    public function remove($key) {
        unset($_SESSION[$key]);
    }
    
    /**
     * Set flash message
     */
    public function setFlash($key, $message) {
        $_SESSION['_flash'][$key] = $message;
    }
    
    /**
     * Get flash message (and remove it)
     */
    public function getFlash($key) {
        $message = $_SESSION['_flash'][$key] ?? null;
        unset($_SESSION['_flash'][$key]);
        return $message;
    }
    
    /**
     * Destroy session
     */
    public function destroy() {
        session_destroy();
        $_SESSION = [];
    }
    
    /**
     * Regenerate session ID
     */
    public function regenerate() {
        session_regenerate_id(true);
    }
}