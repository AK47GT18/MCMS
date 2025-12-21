<?php
/**
 * Authentication Service
 * 
 * @file AuthService.php
 * @description Business logic for authentication and user management (FR-01, FR-16, FR-17, FR-18)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class AuthService {
    
    private $userRepository;
    private $auditService;
    
    public function __construct() {
        $this->userRepository = new UserRepository();
        $this->auditService = new AuditService();
    }
    
    /**
     * Authenticate user (FR-01, FR-17)
     * 
     * @param string $username Username
     * @param string $password Password
     * @return array Authentication result
     */
    public function login($username, $password) {
        // Validate input
        if (empty($username) || empty($password)) {
            throw new ValidationException([
                'credentials' => 'Username and password are required'
            ]);
        }
        
        // Attempt authentication
        $result = Authentication::attempt($username, $password);
        
        if (!$result['success']) {
            throw new AuthenticationException(
                $result['message'],
                $this->determineFailureReason($username)
            );
        }
        
        return [
            'success' => true,
            'user' => $this->sanitizeUserData($result['user']),
            'redirect' => $this->getRedirectUrl($result['user']['role_id'])
        ];
    }
    
    /**
     * Logout current user
     */
    public function logout() {
        if (!Authentication::check()) {
            throw new AuthenticationException('No active session', 'no_session');
        }
        
        $user = Authentication::user();
        
        // Log logout event (FR-16)
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'logout',
            'entity_type' => 'user',
            'entity_id' => $user['id']
        ]);
        
        Authentication::logout();
        
        return ['success' => true, 'message' => 'Logged out successfully'];
    }
    
    /**
     * Request password reset
     * 
     * @param string $email User email
     * @return array
     */
    public function requestPasswordReset($email) {
        // Validate email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException(['email' => 'Invalid email address']);
        }
        
        $user = $this->userRepository->findByEmail($email);
        
        // Don't reveal if user exists (security best practice)
        if (!$user) {
            return [
                'success' => true,
                'message' => 'If the email exists, password reset instructions have been sent'
            ];
        }
        
        // Generate reset token
        $token = bin2hex(random_bytes(32));
        $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // Store token in database
        $db = Database::getInstance();
        $sql = "INSERT INTO password_resets (email, token, expires_at, created_at)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                    token = VALUES(token),
                    expires_at = VALUES(expires_at),
                    used = 0,
                    created_at = NOW()";
        
        $db->execute($sql, [$email, $token, $expiry]);
        
        // Send reset email
        $emailService = new EmailService();
        $emailService->sendPasswordResetEmail($email, $token);
        
        // Log password reset request
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'password_reset_requested',
            'entity_type' => 'user',
            'entity_id' => $user['id']
        ]);
        
        return [
            'success' => true,
            'message' => 'Password reset instructions sent to your email'
        ];
    }
    
    /**
     * Reset password with token (FR-18)
     * 
     * @param string $token Reset token
     * @param string $password New password
     * @param string $passwordConfirmation Password confirmation
     * @return array
     */
    public function resetPassword($token, $password, $passwordConfirmation) {
        // Validate passwords
        $this->validatePassword($password, $passwordConfirmation);
        
        // Verify token
        $db = Database::getInstance();
        $sql = "SELECT * FROM password_resets
                WHERE token = ? AND expires_at > NOW() AND used = 0";
        
        $result = $db->query($sql, [$token]);
        
        if (empty($result)) {
            throw new AuthenticationException(
                'Invalid or expired reset token',
                'invalid_token'
            );
        }
        
        $resetData = $result[0];
        
        // Update password
        $user = $this->userRepository->findByEmail($resetData['email']);
        
        if (!$user) {
            throw new NotFoundException('User not found', 'user', null);
        }
        
        $this->userRepository->updatePassword($user['id'], $password);
        
        // Mark token as used
        $sql = "UPDATE password_resets SET used = 1 WHERE token = ?";
        $db->execute($sql, [$token]);
        
        // Log password reset
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'password_reset_completed',
            'entity_type' => 'user',
            'entity_id' => $user['id'],
            'details' => json_encode(['method' => 'reset_link'])
        ]);
        
        return [
            'success' => true,
            'message' => 'Password reset successfully'
        ];
    }
    
    /**
     * Change password for authenticated user (FR-18)
     * 
     * @param string $currentPassword Current password
     * @param string $newPassword New password
     * @param string $confirmPassword Confirm password
     * @return array
     */
    public function changePassword($currentPassword, $newPassword, $confirmPassword) {
        if (!Authentication::check()) {
            throw new AuthenticationException('Not authenticated', 'not_authenticated');
        }
        
        $user = Authentication::user();
        
        // Verify current password
        if (!password_verify($currentPassword, $user['password'])) {
            throw new ValidationException([
                'current_password' => 'Current password is incorrect'
            ]);
        }
        
        // Validate new password
        $this->validatePassword($newPassword, $confirmPassword);
        
        // Check if new password is same as current
        if (password_verify($newPassword, $user['password'])) {
            throw new ValidationException([
                'new_password' => 'New password must be different from current password'
            ]);
        }
        
        // Update password
        $this->userRepository->updatePassword($user['id'], $newPassword);
        
        // Log password change
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'password_changed',
            'entity_type' => 'user',
            'entity_id' => $user['id'],
            'details' => json_encode(['method' => 'user_initiated'])
        ]);
        
        return [
            'success' => true,
            'message' => 'Password changed successfully'
        ];
    }
    
    /**
     * Validate password complexity (FR-18)
     * 
     * @param string $password Password
     * @param string $confirmation Confirmation
     * @throws ValidationException
     */
    private function validatePassword($password, $confirmation) {
        $errors = [];
        
        // Check passwords match
        if ($password !== $confirmation) {
            $errors['password_confirmation'] = 'Passwords do not match';
        }
        
        // Check minimum length
        if (strlen($password) < 8) {
            $errors['password'] = 'Password must be at least 8 characters long';
        }
        
        // Check for uppercase letter
        if (!preg_match('/[A-Z]/', $password)) {
            $errors['password'] = 'Password must contain at least one uppercase letter';
        }
        
        // Check for lowercase letter
        if (!preg_match('/[a-z]/', $password)) {
            $errors['password'] = 'Password must contain at least one lowercase letter';
        }
        
        // Check for number
        if (!preg_match('/[0-9]/', $password)) {
            $errors['password'] = 'Password must contain at least one number';
        }
        
        // Check for special character
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            $errors['password'] = 'Password must contain at least one special character';
        }
        
        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
    }
    
    /**
     * Create new user account
     * 
     * @param array $data User data
     * @return array
     */
    public function createUser($data) {
        // Check authorization
        Authorization::require('users.create');
        
        // Validate input
        $this->validateUserData($data);
        
        // Check if username exists
        if ($this->userRepository->usernameExists($data['username'])) {
            throw new ValidationException(['username' => 'Username already exists']);
        }
        
        // Check if email exists
        if ($this->userRepository->emailExists($data['email'])) {
            throw new ValidationException(['email' => 'Email already exists']);
        }
        
        // Validate password
        if (isset($data['password'])) {
            $this->validatePassword($data['password'], $data['password_confirmation'] ?? '');
        }
        
        // Create user
        $userId = $this->userRepository->create($data);
        
        // Log user creation
        $currentUser = Authentication::user();
        $this->auditService->log([
            'user_id' => $currentUser['id'],
            'action' => 'user_created',
            'entity_type' => 'user',
            'entity_id' => $userId,
            'details' => json_encode([
                'username' => $data['username'],
                'email' => $data['email'],
                'role_id' => $data['role_id']
            ])
        ]);
        
        return [
            'success' => true,
            'user_id' => $userId,
            'message' => 'User created successfully'
        ];
    }
    
    /**
     * Update user account
     * 
     * @param int $userId User ID
     * @param array $data Updated data
     * @return array
     */
    public function updateUser($userId, $data) {
        // Check authorization
        $currentUser = Authentication::user();
        if ($currentUser['id'] != $userId) {
            Authorization::require('users.edit');
        }
        
        // Validate input
        $this->validateUserData($data, true);
        
        // Check if username exists (excluding current user)
        if (isset($data['username']) && 
            $this->userRepository->usernameExists($data['username'], $userId)) {
            throw new ValidationException(['username' => 'Username already exists']);
        }
        
        // Check if email exists (excluding current user)
        if (isset($data['email']) && 
            $this->userRepository->emailExists($data['email'], $userId)) {
            throw new ValidationException(['email' => 'Email already exists']);
        }
        
        // Update user
        $this->userRepository->update($userId, $data);
        
        // Log user update
        $this->auditService->log([
            'user_id' => $currentUser['id'],
            'action' => 'user_updated',
            'entity_type' => 'user',
            'entity_id' => $userId,
            'details' => json_encode($data)
        ]);
        
        return [
            'success' => true,
            'message' => 'User updated successfully'
        ];
    }
    
    /**
     * Validate user data
     * 
     * @param array $data User data
     * @param bool $isUpdate Whether this is an update operation
     * @throws ValidationException
     */
    private function validateUserData($data, $isUpdate = false) {
        $errors = [];
        
        if (!$isUpdate || isset($data['username'])) {
            if (empty($data['username'])) {
                $errors['username'] = 'Username is required';
            } elseif (strlen($data['username']) < 3) {
                $errors['username'] = 'Username must be at least 3 characters';
            }
        }
        
        if (!$isUpdate || isset($data['email'])) {
            if (empty($data['email'])) {
                $errors['email'] = 'Email is required';
            } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = 'Invalid email address';
            }
        }
        
        if (!$isUpdate || isset($data['role_id'])) {
            if (empty($data['role_id'])) {
                $errors['role_id'] = 'Role is required';
            }
        }
        
        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
    }
    
    /**
     * Determine failure reason for authentication
     */
    private function determineFailureReason($username) {
        // Check if account is locked
        $cacheKey = "login_attempts_$username";
        $attempts = apcu_fetch($cacheKey);
        
        if ($attempts && $attempts['count'] >= MAX_LOGIN_ATTEMPTS) {
            return 'account_locked';
        }
        
        return 'invalid_credentials';
    }
    
    /**
     * Get redirect URL based on role
     */
    private function getRedirectUrl($roleId) {
        switch ($roleId) {
            case ROLE_MANAGING_DIRECTOR:
            case ROLE_OPERATIONS_MANAGER:
                return '/dashboard/executive';
            case ROLE_PROJECT_MANAGER:
                return '/dashboard/projects';
            case ROLE_FINANCE_OFFICER:
                return '/dashboard/finance';
            case ROLE_CONTRACT_ADMIN:
                return '/dashboard/contracts';
            case ROLE_EQUIPMENT_COORDINATOR:
                return '/dashboard/equipment';
            case ROLE_FIELD_SUPERVISOR:
                return '/dashboard/field';
            default:
                return '/dashboard';
        }
    }
    
    /**
     * Sanitize user data for response
     */
    private function sanitizeUserData($user) {
        unset($user['password']);
        return $user;
    }
    
    /**
     * Check if user session is valid
     */
    public function checkSession() {
        return [
            'authenticated' => Authentication::check(),
            'user' => Authentication::check() ? $this->sanitizeUserData(Authentication::user()) : null
        ];
    }
}