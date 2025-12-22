<?php
namespace Mkaka\Repositories;

use Mkaka\Core\Database;

/**
 * User Repository
 * 
 * @file UserRepository.php
 * @description Data access layer for users (FR-01, FR-02, FR-16, FR-17, FR-18)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class UserRepository {
    
    private $db;
    private $table = 'users';
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Find user by ID
     * 
     * @param int $id User ID
     * @return array|null
     */
    public function findById($id) {
        $sql = "SELECT u.*, r.name as role_name, r.permissions 
                FROM {$this->table} u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.id = ? AND u.deleted_at IS NULL";
        
        $result = $this->db->query($sql, [$id]);
        return $result[0] ?? null;
    }
    
    /**
     * Find user by username (FR-01)
     * 
     * @param string $username Username
     * @return array|null
     */
    public function findByUsername($username) {
        $sql = "SELECT u.*, r.name as role_name, r.permissions 
                FROM {$this->table} u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.username = ? AND u.deleted_at IS NULL";
        
        $result = $this->db->query($sql, [$username]);
        return $result[0] ?? null;
    }
    
    /**
     * Find user by email
     * 
     * @param string $email Email address
     * @return array|null
     */
    public function findByEmail($email) {
        $sql = "SELECT u.*, r.name as role_name 
                FROM {$this->table} u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.email = ? AND u.deleted_at IS NULL";
        
        $result = $this->db->query($sql, [$email]);
        return $result[0] ?? null;
    }
    
    /**
     * Get all users with pagination
     * 
     * @param array $filters Filter criteria
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array
     */
    public function getAll($filters = [], $page = 1, $perPage = 20) {
        $offset = ($page - 1) * $perPage;
        
        $sql = "SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
                       u.phone, u.role_id, r.name as role_name, 
                       u.is_active, u.last_login, u.created_at
                FROM {$this->table} u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.deleted_at IS NULL";
        
        $params = [];
        
        // Apply filters
        if (!empty($filters['role_id'])) {
            $sql .= " AND u.role_id = ?";
            $params[] = $filters['role_id'];
        }
        
        if (!empty($filters['is_active'])) {
            $sql .= " AND u.is_active = ?";
            $params[] = $filters['is_active'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (u.username LIKE ? OR u.email LIKE ? OR 
                      CONCAT(u.first_name, ' ', u.last_name) LIKE ?)";
            $searchTerm = "%{$filters['search']}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM ({$sql}) as counted";
        $totalResult = $this->db->query($countSql, $params);
        $total = $totalResult[0]['total'] ?? 0;
        
        // Add sorting and pagination
        $sql .= " ORDER BY u.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $perPage;
        $params[] = $offset;
        
        $users = $this->db->query($sql, $params);
        
        return [
            'data' => $users,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage)
        ];
    }
    
    /**
     * Create new user (FR-18)
     * 
     * @param array $data User data
     * @return int User ID
     */
    public function create($data) {
        // Hash password with bcrypt (NFR-05)
        if (isset($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        }
        
        $sql = "INSERT INTO {$this->table} 
                (username, email, password, first_name, last_name, phone, 
                 role_id, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        
        $params = [
            $data['username'],
            $data['email'],
            $data['password'],
            $data['first_name'] ?? null,
            $data['last_name'] ?? null,
            $data['phone'] ?? null,
            $data['role_id'],
            $data['is_active'] ?? 1
        ];
        
        $this->db->execute($sql, $params);
        return $this->db->lastInsertId();
    }
    
    /**
     * Update user
     * 
     * @param int $id User ID
     * @param array $data Updated data
     * @return bool
     */
    public function update($id, $data) {
        $fields = [];
        $params = [];
        
        $allowedFields = ['username', 'email', 'first_name', 'last_name', 
                         'phone', 'role_id', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $fields[] = "updated_at = NOW()";
        $params[] = $id;
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = ?";
        
        return $this->db->execute($sql, $params);
    }
    
    /**
     * Update password (FR-18)
     * 
     * @param int $id User ID
     * @param string $password New password
     * @return bool
     */
    public function updatePassword($id, $password) {
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        
        $sql = "UPDATE {$this->table} 
                SET password = ?, 
                    password_changed_at = NOW(),
                    updated_at = NOW()
                WHERE id = ?";
        
        return $this->db->execute($sql, [$hashedPassword, $id]);
    }
    
    /**
     * Update last login timestamp (FR-16)
     * 
     * @param int $id User ID
     * @return bool
     */
    public function updateLastLogin($id) {
        $sql = "UPDATE {$this->table} 
                SET last_login = NOW(), 
                    last_login_ip = ?
                WHERE id = ?";
        
        return $this->db->execute($sql, [$_SERVER['REMOTE_ADDR'], $id]);
    }
    
    /**
     * Soft delete user
     * 
     * @param int $id User ID
     * @return bool
     */
    public function delete($id) {
        $sql = "UPDATE {$this->table} 
                SET deleted_at = NOW(), 
                    is_active = 0
                WHERE id = ?";
        
        return $this->db->execute($sql, [$id]);
    }
    
    /**
     * Check if username exists
     * 
     * @param string $username Username
     * @param int $excludeId Exclude user ID (for updates)
     * @return bool
     */
    public function usernameExists($username, $excludeId = null) {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} 
                WHERE username = ? AND deleted_at IS NULL";
        $params = [$username];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $result = $this->db->query($sql, $params);
        return ($result[0]['count'] ?? 0) > 0;
    }
    
    /**
     * Check if email exists
     * 
     * @param string $email Email
     * @param int $excludeId Exclude user ID (for updates)
     * @return bool
     */
    public function emailExists($email, $excludeId = null) {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} 
                WHERE email = ? AND deleted_at IS NULL";
        $params = [$email];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $result = $this->db->query($sql, $params);
        return ($result[0]['count'] ?? 0) > 0;
    }
    
    /**
     * Get users by role
     * 
     * @param int $roleId Role ID
     * @return array
     */
    public function getByRole($roleId) {
        $sql = "SELECT id, username, email, first_name, last_name, phone
                FROM {$this->table}
                WHERE role_id = ? AND is_active = 1 AND deleted_at IS NULL
                ORDER BY first_name, last_name";
        
        return $this->db->query($sql, [$roleId]);
    }
    
    /**
     * Get active users count
     * 
     * @return int
     */
    public function getActiveCount() {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} 
                WHERE is_active = 1 AND deleted_at IS NULL";
        
        $result = $this->db->query($sql);
        return $result[0]['count'] ?? 0;
    }
    
    /**
     * Get recently active users
     * 
     * @param int $days Number of days
     * @param int $limit Limit
     * @return array
     */
    public function getRecentlyActive($days = 7, $limit = 10) {
        $sql = "SELECT u.id, u.username, u.first_name, u.last_name, 
                       u.last_login, r.name as role_name
                FROM {$this->table} u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.last_login >= DATE_SUB(NOW(), INTERVAL ? DAY)
                  AND u.deleted_at IS NULL
                ORDER BY u.last_login DESC
                LIMIT ?";
        
        return $this->db->query($sql, [$days, $limit]);
    }
}