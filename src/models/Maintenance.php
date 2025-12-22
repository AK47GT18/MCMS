<?php
namespace Mkaka\Models;

use Mkaka\Core\Model;

class Maintenance extends Model {
    protected $table = 'maintenance_records';
    protected $primaryKey = 'id';
    protected $fillable = [
        'equipment_id',
        'maintenance_type',
        'scheduled_date',
        'completed_date',
        'description',
        'performed_by',
        'cost',
        'estimated_cost',
        'status',
        'notes',
        'scheduled_by'
    ];
    protected $timestamps = true;
    
    /**
     * Get maintenance history for equipment
     */
    public function getEquipmentHistory($equipmentId) {
        $sql = "SELECT m.*, 
                       CONCAT(u1.first_name, ' ', u1.last_name) as scheduled_by_name,
                       CONCAT(u2.first_name, ' ', u2.last_name) as performed_by_name
                FROM {$this->table} m
                LEFT JOIN users u1 ON m.scheduled_by = u1.id
                LEFT JOIN users u2 ON m.performed_by = u2.id
                WHERE m.equipment_id = ?
                ORDER BY m.scheduled_date DESC";
        
        return $this->db->query($sql, [$equipmentId]);
    }
    
    /**
     * Get upcoming maintenance
     */
    public function getUpcomingMaintenance($days = 30) {
        $targetDate = date('Y-m-d', strtotime("+{$days} days"));
        
        $sql = "SELECT m.*, e.equipment_name, e.equipment_id
                FROM {$this->table} m
                JOIN equipment e ON m.equipment_id = e.id
                WHERE m.scheduled_date <= ? 
                  AND m.status = 'scheduled'
                ORDER BY m.scheduled_date ASC";
        
        return $this->db->query($sql, [$targetDate]);
    }
    
    /**
     * Complete maintenance
     */
    public function completeMaintenance($maintenanceId, $performedBy, $actualCost, $notes = null) {
        return $this->update($maintenanceId, [
            'status' => 'completed',
            'completed_date' => date(DATETIME_FORMAT),
            'performed_by' => $performedBy,
            'cost' => $actualCost,
            'notes' => $notes
        ]);
    }
}