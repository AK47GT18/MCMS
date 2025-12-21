<?php
/**
 * User Model
 * 
 * @file User.php
 * @description User management (FR-01, FR-02, FR-16, FR-17, FR-18)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class User extends Model {
    protected $table = 'users';
    protected $primaryKey = 'id';
    protected $fillable = [
        'username',
        'email',
        'password',
        'first_name',
        'last_name',
        'phone',
        'role_id',
        'is_active',
        'last_login_at'
    ];
    protected $guarded = ['id', 'created_at', 'updated_at'];
    protected $timestamps = true;
    
    /**
     * Create user with hashed password (FR-18)
     */
    public function createUser($data) {
        // Validate password complexity (FR-18)
        if (!$this->validatePassword($data['password'])) {
            throw new Exception("Password does not meet complexity requirements");
        }
        
        // Hash password using bcrypt (NFR-05)
        $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 10]);
        
        return $this->create($data);
    }
    
    /**
     * Validate password complexity (FR-18)
     */
    private function validatePassword($password) {
        if (strlen($password) < PASSWORD_MIN_LENGTH) {
            return false;
        }
        
        $hasUppercase = preg_match('/[A-Z]/', $password);
        $hasLowercase = preg_match('/[a-z]/', $password);
        $hasNumber = preg_match('/[0-9]/', $password);
        $hasSpecial = preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password);
        
        return $hasUppercase && $hasLowercase && $hasNumber && $hasSpecial;
    }
    
    /**
     * Update user password
     */
    public function updatePassword($userId, $newPassword) {
        if (!$this->validatePassword($newPassword)) {
            throw new Exception("Password does not meet complexity requirements");
        }
        
        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]);
        
        return $this->update($userId, ['password' => $hashedPassword]);
    }
    
    /**
     * Get user by username
     */
    public function findByUsername($username) {
        $result = $this->where(['username' => $username]);
        return $result ? $result[0] : null;
    }
    
    /**
     * Get user by email
     */
    public function findByEmail($email) {
        $result = $this->where(['email' => $email]);
        return $result ? $result[0] : null;
    }
    
    /**
     * Get users by role
     */
    public function getUsersByRole($roleId) {
        return $this->where(['role_id' => $roleId, 'is_active' => 1]);
    }
    
    /**
     * Update last login timestamp
     */
    public function updateLastLogin($userId) {
        return $this->update($userId, ['last_login_at' => date(DATETIME_FORMAT)]);
    }
    
    /**
     * Deactivate user
     */
    public function deactivate($userId) {
        return $this->update($userId, ['is_active' => 0]);
    }
    
    /**
     * Activate user
     */
    public function activate($userId) {
        return $this->update($userId, ['is_active' => 1]);
    }
    
    /**
     * Get user with role information
     */
    public function getUserWithRole($userId) {
        $sql = "SELECT u.*, r.role_name, r.description as role_description 
                FROM {$this->table} u 
                LEFT JOIN roles r ON u.role_id = r.id 
                WHERE u.id = ?";
        
        $result = $this->db->query($sql, [$userId]);
        return $result ? $result[0] : null;
    }
    
    /**
     * Get all active users with pagination
     */
    public function getActiveUsers($page = 1, $perPage = ITEMS_PER_PAGE) {
        $offset = ($page - 1) * $perPage;
        
        $sql = "SELECT u.*, r.role_name 
                FROM {$this->table} u 
                LEFT JOIN roles r ON u.role_id = r.id 
                WHERE u.is_active = 1 
                ORDER BY u.first_name, u.last_name 
                LIMIT ? OFFSET ?";
        
        $data = $this->db->query($sql, [$perPage, $offset]);
        $total = $this->count(['is_active' => 1]);
        
        return [
            'data' => $data,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil($total / $perPage)
        ];
    }
}