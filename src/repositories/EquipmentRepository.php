<?php
namespace Mkaka\Repositories;

use Mkaka\Core\Database;

class EquipmentRepository {
    
    private $db;
    private $table = 'equipment';
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function findById($id) {
        $sql = "SELECT e.*,
                       p.name as current_project,
                       CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name,
                       (SELECT COUNT(*) FROM maintenance_records WHERE equipment_id = e.id) as maintenance_count
                FROM {$this->table} e
                LEFT JOIN projects p ON e.current_project_id = p.id
                LEFT JOIN users u ON e.assigned_to_user_id = u.id
                WHERE e.id = ? AND e.deleted_at IS NULL";
        
        $result = $this->db->query($sql, [$id]);
        return $result[0] ?? null;
    }
    
    public function getAll($filters = [], $page = 1, $perPage = 20) {
        $offset = ($page - 1) * $perPage;
        
        $sql = "SELECT e.id, e.equipment_code, e.name, e.type, e.status,
                       e.current_location, e.usage_hours,
                       p.name as current_project
                FROM {$this->table} e
                LEFT JOIN projects p ON e.current_project_id = p.id
                WHERE e.deleted_at IS NULL";
        
        $params = [];
        
        if (!empty($filters['type'])) {
            $sql .= " AND e.type = ?";
            $params[] = $filters['type'];
        }
        
        if (!empty($filters['status'])) {
            $sql .= " AND e.status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['project_id'])) {
            $sql .= " AND e.current_project_id = ?";
            $params[] = $filters['project_id'];
        }
        
        $countSql = "SELECT COUNT(*) as total FROM ({$sql}) as counted";
        $totalResult = $this->db->query($countSql, $params);
        $total = $totalResult[0]['total'] ?? 0;
        
        $sql .= " ORDER BY e.name ASC LIMIT ? OFFSET ?";
        $params[] = $perPage;
        $params[] = $offset;
        
        $equipment = $this->db->query($sql, $params);
        
        return [
            'data' => $equipment,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage)
        ];
    }
    
    public function create($data) {
        if (empty($data['equipment_code'])) {
            $data['equipment_code'] = $this->generateEquipmentCode($data['type']);
        }
        
        $sql = "INSERT INTO {$this->table}
                (equipment_code, name, type, serial_number, purchase_date,
                 purchase_cost, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        
        $params = [
            $data['equipment_code'],
            $data['name'],
            $data['type'],
            $data['serial_number'] ?? null,
            $data['purchase_date'],
            $data['purchase_cost'],
            $data['status'] ?? 'available'
        ];
        
        $this->db->execute($sql, $params);
        return $this->db->lastInsertId();
    }
    
    /**
     * Check-out equipment with geotagging (FR-13)
     */
    public function checkOut($equipmentId, $data) {
        // Update equipment status
        $sql = "UPDATE {$this->table}
                SET status = 'in_use',
                    current_project_id = ?,
                    assigned_to_user_id = ?,
                    current_location = ?,
                    checkout_latitude = ?,
                    checkout_longitude = ?,
                    checkout_timestamp = NOW(),
                    updated_at = NOW()
                WHERE id = ?";
        
        $result = $this->db->execute($sql, [
            $data['project_id'],
            $data['user_id'],
            $data['location'] ?? null,
            $data['latitude'],
            $data['longitude'],
            $equipmentId
        ]);
        
        // Log checkout event
        if ($result) {
            $this->logEquipmentEvent($equipmentId, 'checkout', $data);
        }
        
        return $result;
    }
    
    /**
     * Check-in equipment with geotagging (FR-13)
     */
    public function checkIn($equipmentId, $data) {
        $sql = "UPDATE {$this->table}
                SET status = 'available',
                    current_project_id = NULL,
                    assigned_to_user_id = NULL,
                    checkin_latitude = ?,
                    checkin_longitude = ?,
                    checkin_timestamp = NOW(),
                    updated_at = NOW()
                WHERE id = ?";
        
        $result = $this->db->execute($sql, [
            $data['latitude'],
            $data['longitude'],
            $equipmentId
        ]);
        
        if ($result) {
            $this->logEquipmentEvent($equipmentId, 'checkin', $data);
        }
        
        return $result;
    }
    
    /**
     * Schedule preventive maintenance (FR-12)
     */
    public function scheduleMaintenance($equipmentId, $data) {
        $sql = "INSERT INTO maintenance_records
                (equipment_id, type, scheduled_date, description,
                 estimated_cost, status, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, 'scheduled', ?, NOW())";
        
        return $this->db->execute($sql, [
            $equipmentId,
            $data['type'] ?? 'preventive',
            $data['scheduled_date'],
            $data['description'],
            $data['estimated_cost'] ?? null,
            $data['created_by']
        ]);
    }
    
    /**
     * Get equipment requiring maintenance (FR-12)
     */
    public function getRequiringMaintenance() {
        $sql = "SELECT e.id, e.equipment_code, e.name, e.type,
                       e.usage_hours, e.last_maintenance_date,
                       DATEDIFF(CURDATE(), e.last_maintenance_date) as days_since_maintenance
                FROM {$this->table} e
                WHERE e.deleted_at IS NULL
                  AND (
                      (e.usage_hours >= e.maintenance_interval_hours)
                      OR (e.last_maintenance_date IS NOT NULL 
                          AND DATEDIFF(CURDATE(), e.last_maintenance_date) >= e.maintenance_interval_days)
                      OR (e.last_maintenance_date IS NULL 
                          AND DATEDIFF(CURDATE(), e.purchase_date) >= 90)
                  )
                ORDER BY days_since_maintenance DESC";
        
        return $this->db->query($sql);
    }
    
    /**
     * Get available equipment
     */
    public function getAvailable() {
        $sql = "SELECT id, equipment_code, name, type, current_location
                FROM {$this->table}
                WHERE status = 'available' AND deleted_at IS NULL
                ORDER BY name";
        
        return $this->db->query($sql);
    }
    
    private function logEquipmentEvent($equipmentId, $event, $data) {
        $sql = "INSERT INTO equipment_logs
                (equipment_id, event_type, project_id, user_id,
                 latitude, longitude, details, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
        
        return $this->db->execute($sql, [
            $equipmentId,
            $event,
            $data['project_id'] ?? null,
            $data['user_id'],
            $data['latitude'],
            $data['longitude'],
            json_encode($data)
        ]);
    }
    
    private function generateEquipmentCode($type) {
        $prefix = strtoupper(substr($type, 0, 3));
        $year = date('Y');
        $codePrefix = "{$prefix}-{$year}-";
        
        $sql = "SELECT equipment_code FROM {$this->table}
                WHERE equipment_code LIKE ?
                ORDER BY id DESC LIMIT 1";
        
        $result = $this->db->query($sql, ["{$codePrefix}%"]);
        
        if (!empty($result)) {
            $lastNumber = (int) substr($result[0]['equipment_code'], -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $codePrefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
    
    public function delete($id) {
        $sql = "UPDATE {$this->table} SET deleted_at = NOW() WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }
}
