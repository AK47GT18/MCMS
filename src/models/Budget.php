<?php
namespace Mkaka\Models;

use Mkaka\Core\Model;

class Budget extends Model {
    protected $table = 'budgets';
    
    public function getTotalBudget() {
        $stmt = $this->db->query("SELECT SUM(amount) FROM {$this->table}");
        return $stmt->fetchColumn() ?: 0;
    }
    
    public function getCashOnHand() {
        // Simplified: Budget - Expenses
        // In real app, this would be complex
        $totalBudget = $this->getTotalBudget();
        
        $t = new Transaction();
        $totalExpenses = $t->getTotalExpenses();
        
        return $totalBudget - $totalExpenses;
    }
}
