<?php
namespace Mkaka\Models;

use Mkaka\Core\Model;

/**
 * Equipment Model
 * 
 * @file Equipment.php
 * @description Equipment/Fleet management (FR-11, FR-12, FR-13)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class Equipment extends Model {
    protected $table = 'equipment';
    protected $primaryKey = 'id';
    protected $fillable = [
        'equipment_id',
        'equipment_name',
        'equipment_type',
        'serial_number',
        'manufacturer',
        'model',
        'purchase_date',
        'purchase_cost',
        'current_value',
        'status',
        'current_location',
        'current_project_id',
        'assigned_to',
        'usage_hours',
        'last_maintenance_date',
        'next_maintenance_due'
    ];
    protected $timestamps = true;
    
    /**
     * Create equipment with asset registry (FR-11)
     */
    public function createEquipment($data) {
        $data['equipment_id'] = $this->generateEquipmentId($data['equipment_type']);
        $data['status'] = EQUIPMENT_STATUS_AVAILABLE;
        $data['usage_hours'] = 0;
        
        $equipmentId = $this->create($data);
        
        // Log creation
        $auditLog = new AuditLog();
        $auditLog->create([
            'user_id' => Authentication::user()['id'],
            'action' => 'equipment_created',
            'entity_type' => 'equipment',
            'entity_id' => $equipmentId,
            'details' => json_encode([
                'equipment_id' => $data['equipment_id'],
                'name' => $data['equipment_name']
            ]),
            'ip_address' => $_SERVER['REMOTE_ADDR']
        ]);
        
        return $equipmentId;
    }
    
    /**
     * Generate unique equipment ID
     */
    private function generateEquipmentId($type) {
        $prefix = strtoupper(substr($type, 0, 3));
        $year = date('Y');
        
        $sql = "SELECT COUNT(*) as count FROM {$this->table} 
                WHERE equipment_id LIKE ?";
        $result = $this->db->query($sql, ["{$prefix}-{$year}-%"]);
        $count = $result[0]['count'] + 1;
        
        return sprintf("%s-%s-%04d", $prefix, $year, $count);
    }
    
    /**
     * Check-out equipment with geotagging (FR-13)
     */
    public function checkOut($equipmentId, $projectId, $assignedTo, $gpsData) {
        // Validate GPS coordinates (FR-14)
        if (!$this->validateGPS($gpsData['latitude'], $gpsData['longitude'])) {
            throw new Exception("GPS coordinates are outside Malawi boundaries");
        }
        
        $equipment = $this->find($equipmentId);
        
        if (!$equipment) {
            throw new Exception("Equipment not found");
        }
        
        if ($equipment['status'] != EQUIPMENT_STATUS_AVAILABLE) {
            throw new Exception("Equipment is not available for check-out");
        }
        
        $this->db->beginTransaction();
        
        try {
            // Update equipment status
            $this->update($equipmentId, [
                'status' => EQUIPMENT_STATUS_IN_USE,
                'current_project_id' => $projectId,
                'assigned_to' => $assignedTo,
                'current_location' => json_encode($gpsData)
            ]);
            
            // Record check-out event
            $sql = "INSERT INTO equipment_checkout_log 
                    (equipment_id, project_id, assigned_to, checkout_date, 
                     checkout_latitude, checkout_longitude, checkout_by) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            $this->db->execute($sql, [
                $equipmentId,
                $projectId,
                $assignedTo,
                date(DATETIME_FORMAT),
                $gpsData['latitude'],
                $gpsData['longitude'],
                Authentication::user()['id']
            ]);
            
            // Log action
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => Authentication::user()['id'],
                'action' => 'equipment_checkout',
                'entity_type' => 'equipment',
                'entity_id' => $equipmentId,
                'details' => json_encode([
                    'project_id' => $projectId,
                    'gps' => $gpsData
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ]);
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Check-in equipment with geotagging (FR-13)
     */
    public function checkIn($equipmentId, $gpsData, $condition = 'good') {
        // Validate GPS coordinates
        if (!$this->validateGPS($gpsData['latitude'], $gpsData['longitude'])) {
            throw new Exception("GPS coordinates are outside Malawi boundaries");
        }
        
        $equipment = $this->find($equipmentId);
        
        if (!$equipment) {
            throw new Exception("Equipment not found");
        }
        
        $this->db->beginTransaction();
        
        try {
            // Update equipment status
            $newStatus = $condition == 'damaged' ? EQUIPMENT_STATUS_DAMAGED : EQUIPMENT_STATUS_AVAILABLE;
            
            $this->update($equipmentId, [
                'status' => $newStatus,
                'current_project_id' => null,
                'assigned_to' => null,
                'current_location' => json_encode($gpsData)
            ]);
            
            // Update check-out log
            $sql = "UPDATE equipment_checkout_log 
                    SET checkin_date = ?,
                        checkin_latitude = ?,
                        checkin_longitude = ?,
                        checkin_by = ?,
                        condition = ?
                    WHERE equipment_id = ? 
                      AND checkin_date IS NULL 
                    ORDER BY checkout_date DESC 
                    LIMIT 1";
            
            $this->db->execute($sql, [
                date(DATETIME_FORMAT),
                $gpsData['latitude'],
                $gpsData['longitude'],
                Authentication::user()['id'],
                $condition,
                $equipmentId
            ]);
            
            // Log action
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => Authentication::user()['id'],
                'action' => 'equipment_checkin',
                'entity_type' => 'equipment',
                'entity_id' => $equipmentId,
                'details' => json_encode([
                    'condition' => $condition,
                    'gps' => $gpsData
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ]);
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Validate GPS coordinates (FR-14)
     */
    private function validateGPS($latitude, $longitude) {
        return ($latitude >= MALAWI_MIN_LAT && $latitude <= MALAWI_MAX_LAT) &&
               ($longitude >= MALAWI_MIN_LNG && $longitude <= MALAWI_MAX_LNG);
    }
    
    /**
     * Schedule preventive maintenance (FR-12)
     */
    public function scheduleMaintenance($equipmentId, $maintenanceData) {
        $equipment = $this->find($equipmentId);
        
        if (!$equipment) {
            throw new Exception("Equipment not found");
        }
        
        $maintenance = new Maintenance();
        $maintenanceId = $maintenance->create([
            'equipment_id' => $equipmentId,
            'maintenance_type' => $maintenanceData['type'],
            'scheduled_date' => $maintenanceData['scheduled_date'],
            'description' => $maintenanceData['description'] ?? null,
            'estimated_cost' => $maintenanceData['estimated_cost'] ?? 0,
            'status' => 'scheduled',
            'scheduled_by' => Authentication::user()['id']
        ]);
        
        // Update equipment next maintenance date
        $this->update($equipmentId, [
            'next_maintenance_due' => $maintenanceData['scheduled_date']
        ]);
        
        return $maintenanceId;
    }
    
    /**
     * Check for overdue maintenance (FR-12)
     */
    public function checkOverdueMaintenance() {
        $sql = "SELECT e.*, 
                       DATEDIFF(CURDATE(), e.next_maintenance_due) as days_overdue
                FROM {$this->table} e
                WHERE e.next_maintenance_due < CURDATE()
                  AND e.status != ?
                ORDER BY e.next_maintenance_due ASC";
        
        $overdue = $this->db->query($sql, [EQUIPMENT_STATUS_MAINTENANCE]);
        
        // Send notifications for overdue maintenance
        foreach ($overdue as $equipment) {
            $notification = new Notification();
            $notification->createMaintenanceAlert($equipment['id']);
        }
        
        return $overdue;
    }
    
    /**
     * Update usage hours
     */
    public function updateUsageHours($equipmentId, $hours) {
        $equipment = $this->find($equipmentId);
        
        if (!$equipment) {
            throw new Exception("Equipment not found");
        }
        
        $newHours = $equipment['usage_hours'] + $hours;
        
        $this->update($equipmentId, ['usage_hours' => $newHours]);
        
        // Check if maintenance is due based on hours
        $this->checkMaintenanceByHours($equipmentId, $newHours);
        
        return $newHours;
    }
    
    /**
     * Check maintenance due by usage hours
     */
    private function checkMaintenanceByHours($equipmentId, $currentHours) {
        // Typical maintenance intervals (can be configured per equipment type)
        $maintenanceIntervals = [
            'excavator' => 250,  // hours
            'truck' => 500,
            'grader' => 250,
            'roller' => 200
        ];
        
        $equipment = $this->find($equipmentId);
        $type = $equipment['equipment_type'];
        
        if (isset($maintenanceIntervals[$type])) {
            $interval = $maintenanceIntervals[$type];
            
            if ($currentHours % $interval == 0) {
                // Auto-schedule maintenance
                $scheduledDate = date('Y-m-d', strtotime('+7 days'));
                
                $this->scheduleMaintenance($equipmentId, [
                    'type' => 'preventive',
                    'scheduled_date' => $scheduledDate,
                    'description' => "Scheduled maintenance at {$currentHours} hours"
                ]);
            }
        }
    }
    
    /**
     * Get equipment utilization report
     */
    public function getUtilizationReport($startDate, $endDate) {
        $sql = "SELECT 
                    e.equipment_id,
                    e.equipment_name,
                    e.equipment_type,
                    COUNT(ecl.id) as checkout_count,
                    SUM(TIMESTAMPDIFF(HOUR, ecl.checkout_date, ecl.checkin_date)) as total_hours,
                    AVG(TIMESTAMPDIFF(HOUR, ecl.checkout_date, ecl.checkin_date)) as avg_hours
                FROM {$this->table} e
                LEFT JOIN equipment_checkout_log ecl ON e.id = ecl.equipment_id
                    AND DATE(ecl.checkout_date) BETWEEN ? AND ?
                GROUP BY e.id
                ORDER BY total_hours DESC";
        
        return $this->db->query($sql, [$startDate, $endDate]);
    }
    
    /**
     * Get equipment by status
     */
    public function getByStatus($status) {
        return $this->where(['status' => $status]);
    }
    
    /**
     * Get available equipment
     */
    public function getAvailableEquipment($type = null) {
        if ($type) {
            return $this->where([
                'status' => EQUIPMENT_STATUS_AVAILABLE,
                'equipment_type' => $type
            ]);
        }
        
        return $this->where(['status' => EQUIPMENT_STATUS_AVAILABLE]);
    }
    
    /**
     * Get equipment checkout history
     */
    public function getCheckoutHistory($equipmentId) {
        $sql = "SELECT ecl.*, 
                       p.project_name,
                       CONCAT(u1.first_name, ' ', u1.last_name) as assigned_name,
                       CONCAT(u2.first_name, ' ', u2.last_name) as checkout_by_name
                FROM equipment_checkout_log ecl
                LEFT JOIN projects p ON ecl.project_id = p.id
                LEFT JOIN users u1 ON ecl.assigned_to = u1.id
                LEFT JOIN users u2 ON ecl.checkout_by = u2.id
                WHERE ecl.equipment_id = ?
                ORDER BY ecl.checkout_date DESC";
        
        return $this->db->query($sql, [$equipmentId]);
    }
}