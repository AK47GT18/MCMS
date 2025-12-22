<?php
namespace Mkaka\Controllers;

use Mkaka\Core\Controller;
use Mkaka\Core\Authentication;
use Mkaka\Models\User;

/**
 * Authentication Controller
 * 
 * @file AuthController.php
 * @description Handles user authentication (FR-01, FR-16, FR-17, FR-18)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class AuthController extends Controller {
    
    /**
     * Show login page
     */
    public function showLogin() {
        // If already logged in, redirect to dashboard
        if (Authentication::check()) {
            return $this->redirect('/dashboard');
        }
        
        return $this->view('auth/login');
    }
    
    /**
     * Handle login attempt (FR-01, FR-17)
     */
    public function login() {
        try {
            // Validate input
            $validator = $this->validate($this->request->all(), [
                'username' => 'required|min:3',
                'password' => 'required|min:8'
            ]);
            
            if ($validator->fails()) {
                $this->flash('error', 'Please provide valid credentials');
                return $this->redirect('/login');
            }
            
            $username = $this->request->input('username');
            $password = $this->request->input('password');
            
            // Attempt authentication
            $result = Authentication::attempt($username, $password);
            
            if ($result['success']) {
                // Update last login
                $userModel = new User();
                $userModel->updateLastLogin($result['user']['id']);
                
                $this->flash('success', 'Login successful');
                
                // Redirect based on role
                $redirectUrl = $this->getRedirectUrl($result['user']['role_id']);
                return $this->redirect($redirectUrl);
            } else {
                $this->flash('error', $result['message']);
                return $this->redirect('/login');
            }
            
        } catch (Exception $e) {
            $this->flash('error', 'An error occurred during login');
            error_log("Login error: " . $e->getMessage());
            return $this->redirect('/login');
        }
    }
    
    /**
     * Get redirect URL based on user role
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
     * Handle logout
     */
    public function logout() {
        try {
            $userId = Authentication::user()['id'] ?? null;
            
            // Log logout
            if ($userId) {
                $auditLog = new AuditLog();
                $auditLog->create([
                    'user_id' => $userId,
                    'action' => 'logout',
                    'entity_type' => 'user',
                    'entity_id' => $userId,
                    'details' => json_encode(['timestamp' => date(DATETIME_FORMAT)]),
                    'ip_address' => $this->request->ip()
                ]);
            }
            
            Authentication::logout();
            $this->flash('success', 'Logged out successfully');
            
        } catch (Exception $e) {
            error_log("Logout error: " . $e->getMessage());
        }
        
        return $this->redirect('/login');
    }
    
    /**
     * Show password reset request page
     */
    public function showForgotPassword() {
        return $this->view('auth/forgot-password');
    }
    
    /**
     * Handle password reset request
     */
    public function forgotPassword() {
        try {
            $validator = $this->validate($this->request->all(), [
                'email' => 'required|email'
            ]);
            
            if ($validator->fails()) {
                $this->flash('error', 'Please provide a valid email address');
                return $this->redirect('/forgot-password');
            }
            
            $email = $this->request->input('email');
            
            $userModel = new User();
            $user = $userModel->findByEmail($email);
            
            if ($user) {
                // Generate reset token
                $token = bin2hex(random_bytes(32));
                $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
                
                // Store token
                $sql = "INSERT INTO password_resets (email, token, expires_at, created_at) 
                        VALUES (?, ?, ?, ?)";
                
                $db = Database::getInstance();
                $db->execute($sql, [$email, $token, $expiry, date(DATETIME_FORMAT)]);
                
                // TODO: Send email with reset link
                // $this->sendPasswordResetEmail($email, $token);
                
                $this->flash('success', 'Password reset instructions sent to your email');
            } else {
                // Don't reveal if email exists
                $this->flash('success', 'If the email exists, password reset instructions have been sent');
            }
            
            return $this->redirect('/forgot-password');
            
        } catch (Exception $e) {
            $this->flash('error', 'An error occurred. Please try again');
            error_log("Forgot password error: " . $e->getMessage());
            return $this->redirect('/forgot-password');
        }
    }
    
    /**
     * Show password reset page
     */
    public function showResetPassword($token) {
        // Verify token exists and not expired
        $sql = "SELECT * FROM password_resets 
                WHERE token = ? AND expires_at > ? AND used = 0";
        
        $db = Database::getInstance();
        $result = $db->query($sql, [$token, date(DATETIME_FORMAT)]);
        
        if (empty($result)) {
            $this->flash('error', 'Invalid or expired reset token');
            return $this->redirect('/login');
        }
        
        return $this->view('auth/reset-password', ['token' => $token]);
    }
    
    /**
     * Handle password reset (FR-18)
     */
    public function resetPassword() {
        try {
            $validator = $this->validate($this->request->all(), [
                'token' => 'required',
                'password' => 'required|min:8',
                'password_confirmation' => 'required'
            ]);
            
            if ($validator->fails()) {
                $this->flash('error', 'Please fill all required fields');
                return $this->redirect('/reset-password/' . $this->request->input('token'));
            }
            
            $token = $this->request->input('token');
            $password = $this->request->input('password');
            $confirmation = $this->request->input('password_confirmation');
            
            // Check passwords match
            if ($password !== $confirmation) {
                $this->flash('error', 'Passwords do not match');
                return $this->redirect('/reset-password/' . $token);
            }
            
            // Verify token
            $db = Database::getInstance();
            $sql = "SELECT * FROM password_resets 
                    WHERE token = ? AND expires_at > ? AND used = 0";
            
            $result = $db->query($sql, [$token, date(DATETIME_FORMAT)]);
            
            if (empty($result)) {
                $this->flash('error', 'Invalid or expired reset token');
                return $this->redirect('/login');
            }
            
            $resetData = $result[0];
            
            // Update password
            $userModel = new User();
            $user = $userModel->findByEmail($resetData['email']);
            
            if ($user) {
                $userModel->updatePassword($user['id'], $password);
                
                // Mark token as used
                $sql = "UPDATE password_resets SET used = 1 WHERE token = ?";
                $db->execute($sql, [$token]);
                
                // Log password change
                $auditLog = new AuditLog();
                $auditLog->create([
                    'user_id' => $user['id'],
                    'action' => 'password_reset',
                    'entity_type' => 'user',
                    'entity_id' => $user['id'],
                    'details' => json_encode(['method' => 'reset_link']),
                    'ip_address' => $this->request->ip()
                ]);
                
                $this->flash('success', 'Password reset successfully. Please login');
                return $this->redirect('/login');
            }
            
            $this->flash('error', 'User not found');
            return $this->redirect('/login');
            
        } catch (Exception $e) {
            $this->flash('error', 'An error occurred. Please try again');
            error_log("Reset password error: " . $e->getMessage());
            return $this->redirect('/login');
        }
    }
    
    /**
     * Show change password page
     */
    public function showChangePassword() {
        $this->requireAuth();
        return $this->view('auth/change-password');
    }
    
    /**
     * Handle password change (FR-18)
     */
    public function changePassword() {
        $this->requireAuth();
        
        try {
            $validator = $this->validate($this->request->all(), [
                'current_password' => 'required',
                'new_password' => 'required|min:8',
                'confirm_password' => 'required'
            ]);
            
            if ($validator->fails()) {
                $this->flash('error', 'Please fill all required fields');
                return $this->redirect('/change-password');
            }
            
            $currentPassword = $this->request->input('current_password');
            $newPassword = $this->request->input('new_password');
            $confirmPassword = $this->request->input('confirm_password');
            
            // Check new passwords match
            if ($newPassword !== $confirmPassword) {
                $this->flash('error', 'New passwords do not match');
                return $this->redirect('/change-password');
            }
            
            $user = Authentication::user();
            
            // Verify current password
            if (!password_verify($currentPassword, $user['password'])) {
                $this->flash('error', 'Current password is incorrect');
                return $this->redirect('/change-password');
            }
            
            // Update password
            $userModel = new User();
            $userModel->updatePassword($user['id'], $newPassword);
            
            // Log password change
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => $user['id'],
                'action' => 'password_changed',
                'entity_type' => 'user',
                'entity_id' => $user['id'],
                'details' => json_encode(['method' => 'user_initiated']),
                'ip_address' => $this->request->ip()
            ]);
            
            $this->flash('success', 'Password changed successfully');
            return $this->redirect('/dashboard');
            
        } catch (Exception $e) {
            $this->flash('error', 'An error occurred. Please try again');
            error_log("Change password error: " . $e->getMessage());
            return $this->redirect('/change-password');
        }
    }
    
    /**
     * Check session status (AJAX)
     */
    public function checkSession() {
        return $this->json([
            'authenticated' => Authentication::check(),
            'user' => Authentication::check() ? Authentication::user() : null
        ]);
    }
}