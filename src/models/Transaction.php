<?php
namespace Mkaka\Models;

use Mkaka\Core\Model;
use PDO;

class Transaction extends Model {
    protected $table = 'transactions';
    
    public function getTotalExpenses() {
        $stmt = $this->db->query("SELECT SUM(amount) FROM {$this->table} WHERE type = 'expense'");
        return $stmt->fetchColumn() ?: 0;
    }
    
    public function countPendingApprovals() {
        $stmt = $this->db->query("SELECT COUNT(*) FROM {$this->table} WHERE status = 'pending'");
        return $stmt->fetchColumn() ?: 0;
    }
    
    public function getExpensesByCategory() {
        $stmt = $this->db->query("
            SELECT category, SUM(amount) as total 
            FROM {$this->table} 
            WHERE type = 'expense' 
            GROUP BY category
        ");
        return $stmt->fetchAll();
    }
    
    public function getMonthlyCashflow() {
        // Mocking for now as it requires complex date grouping
        return [];
    }
    
    public function getRecent($limit = 5) {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} ORDER BY date DESC LIMIT :limit");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function getTransactions($filters, $page = 1, $perPage = 10) {
        $query = "SELECT * FROM {$this->table} WHERE 1=1";
        $params = [];
        
        if (!empty($filters['type'])) {
            $query .= " AND type = :type";
            $params[':type'] = $filters['type'];
        }
        
        // ... add other filters
        
        return $this->paginate($query, $params, $page, $perPage);
    }
}