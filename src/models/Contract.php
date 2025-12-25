<?php
namespace Mkaka\Models;

use Mkaka\Core\Model;
use PDO;

class Contract extends Model {
    protected $table = 'contracts';
    
    public function countByStatus($status) {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE status = :status");
        $stmt->execute([':status' => $status]);
        return $stmt->fetchColumn() ?: 0;
    }
    
    public function countExpiringSoon($days) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM {$this->table} 
            WHERE status = 'active' 
            AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL :days DAY)
        ");
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchColumn() ?: 0;
    }
    
    public function getTotalValue() {
        $stmt = $this->db->query("SELECT SUM(value) FROM {$this->table} WHERE status = 'active'");
        return $stmt->fetchColumn() ?: 0;
    }
    
    public function getRecent($limit = 5) {
        $stmt = $this->db->prepare("
            SELECT c.*, p.name as project_name 
            FROM {$this->table} c
            LEFT JOIN projects p ON c.project_id = p.id
            ORDER BY c.created_at DESC 
            LIMIT :limit
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}