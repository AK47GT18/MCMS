

// ============================================
// FILE 6: src/core/Response.php
// ============================================
/**
 * Response Class
 * 
 * @file Response.php
 * @description HTTP response handling
 * @author Anthony Kanjira (CEN/01/01/22)
 */


// ============================================
// FILE 7: src/core/Session.php
// ============================================
/**
 * Session Class
 * 
 * @file Session.php
 * @description Session management
 * @author Anthony Kanjira (CEN/01/01/22)
 */


// ============================================
// FILE 8: src/core/Validator.php
// ============================================
/**
 * Validator Class
 * 
 * @file Validator.php
 * @description Input validation
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class Validator {
    private $errors = [];
    
    /**
     * Validate data against rules
     */
    public function validate($data, $rules) {
        $this->errors = [];
        
        foreach ($rules as $field => $ruleString) {
            $fieldRules = explode('|', $ruleString);
            
            foreach ($fieldRules as $rule) {
                $this->applyRule($field, $data[$field] ?? null, $rule);
            }
        }
        
        return empty($this->errors);
    }
    
    /**
     * Apply validation rule
     */
    private function applyRule($field, $value, $rule) {
        if (strpos($rule, ':') !== false) {
            list($ruleName, $ruleValue) = explode(':', $rule);
        } else {
            $ruleName = $rule;
            $ruleValue = null;
        }
        
        switch ($ruleName) {
            case 'required':
                if (empty($value)) {
                    $this->errors[$field][] = "$field is required";
                }
                break;
                
            case 'email':
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->errors[$field][] = "$field must be a valid email";
                }
                break;
                
            case 'min':
                if (strlen($value) < $ruleValue) {
                    $this->errors[$field][] = "$field must be at least $ruleValue characters";
                }
                break;
                
            case 'max':
                if (strlen($value) > $ruleValue) {
                    $this->errors[$field][] = "$field must not exceed $ruleValue characters";
                }
                break;
                
            case 'numeric':
                if (!is_numeric($value)) {
                    $this->errors[$field][] = "$field must be numeric";
                }
                break;
                
            case 'alpha':
                if (!ctype_alpha($value)) {
                    $this->errors[$field][] = "$field must contain only letters";
                }
                break;
                
            case 'alphanumeric':
                if (!ctype_alnum($value)) {
                    $this->errors[$field][] = "$field must be alphanumeric";
                }
                break;
                
            case 'url':
                if (!filter_var($value, FILTER_VALIDATE_URL)) {
                    $this->errors[$field][] = "$field must be a valid URL";
                }
                break;
        }
    }
    
    /**
     * Get validation errors
     */
    public function errors() {
        return $this->errors;
    }
    
    /**
     * Check if validation failed
     */
    public function fails() {
        return !empty($this->errors);
    }
}

// ============================================
// FILE 9: src/core/Authentication.php
// ============================================
/**
 * Authentication Class
 * 
 * @file Authentication.php
 * @description User authentication (FR-01, FR-17, FR-18)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

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

// ============================================
// FILE 10: src/core/Authorization.php
// ============================================
/**
 * Authorization Class
 * 
 * @file Authorization.php
 * @description Role-based access control (FR-02)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class Authorization {
    private static $permissions = [];
    
    /**
     * Load user permissions
     */
    private static function loadPermissions() {
        if (!empty(self::$permissions