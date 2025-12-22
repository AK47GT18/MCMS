<?php
namespace Mkaka\Core;

use Mkaka\Models\User;
use Mkaka\Models\AuditLog;

class Authentication {
    private static $session;
    
    /**
     * Initialize authentication
     */
    public static function init() {
        self::$session = new Session();
    }
    
    /**
     * Attempt login (FR-01, FR-17)
     */
    public static function attempt($username, $password) {
        self::init();
        
        // Check for login attempts
        if (self::isLocked($username)) {
            return [
                'success' => false,
                'message' => 'Account locked for 30 minutes due to multiple failed attempts'
            ];
        }
        
        $userModel = new User();
        $user = $userModel->where(['username' => $username])[0] ?? null;
        
        if (!$user) {
            self::recordFailedAttempt($username);
            return ['success' => false, 'message' => 'Invalid credentials'];
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            self::recordFailedAttempt($username);
            return ['success' => false, 'message' => 'Invalid credentials'];
        }
        
        // Clear failed attempts
        self::clearFailedAttempts($username);
        
        // Set session
        self::$session->set('user_id', $user['id']);
        self::$session->set('user_role', $user['role_id']);
        self::$session->set('username', $user['username']);
        self::$session->regenerate();
        
        // Log successful login (FR-16)
        self::logLoginAttempt($username, true);
        
        return ['success' => true, 'user' => $user];
    }
    
    /**
     * Check if user is authenticated
     */
    public static function check() {
        self::init();
        return self::$session->has('user_id');
    }
    
    /**
     * Get current user
     */
    public static function user() {
        self::init();
        if (!self::check()) {
            return null;
        }
        
        $userModel = new User();
        return $userModel->find(self::$session->get('user_id'));
    }
    
    /**
     * Logout user
     */
    public static function logout() {
        self::init();
        self::$session->destroy();
    }
    
    /**
     * Check if account is locked (FR-17)
     */
    private static function isLocked($username) {
        $cacheKey = "login_attempts_$username";
        $attempts = apcu_fetch($cacheKey);
        
        if ($attempts && $attempts['count'] >= MAX_LOGIN_ATTEMPTS) {
            $lockExpiry = $attempts['timestamp'] + LOCKOUT_DURATION;
            return time() < $lockExpiry;
        }
        
        return false;
    }
    
    /**
     * Record failed login attempt
     */
    private static function recordFailedAttempt($username) {
        $cacheKey = "login_attempts_$username";
        $attempts = apcu_fetch($cacheKey) ?: ['count' => 0, 'timestamp' => time()];
        
        $attempts['count']++;
        $attempts['timestamp'] = time();
        
        apcu_store($cacheKey, $attempts, LOCKOUT_WINDOW);
        
        self::logLoginAttempt($username, false);
    }
    
    /**
     * Clear failed attempts
     */
    private static function clearFailedAttempts($username) {
        apcu_delete("login_attempts_$username");
    }
    
    /**
     * Log login attempt (FR-16)
     */
    private static function logLoginAttempt($username, $success) {
        $auditLog = new AuditLog();
        $auditLog->create([
            'user_id' => null,
            'action' => 'login_attempt',
            'details' => json_encode([
                'username' => $username,
                'success' => $success,
                'ip_address' => $_SERVER['REMOTE_ADDR'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT']
            ]),
            'ip_address' => $_SERVER['REMOTE_ADDR']
        ]);
    }
}
